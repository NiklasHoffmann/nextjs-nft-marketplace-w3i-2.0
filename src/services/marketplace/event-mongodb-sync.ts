/**
 * Marketplace Events → MongoDB Sync (SERVER-SIDE ONLY)
 * 
 * Immediately syncs marketplace events to MongoDB.
 * This file should ONLY be imported server-side (in NFT Sync Service).
 */

import { getDatabase } from '@/lib/mongodb';
import { IPFSMetadataLazySync } from '@/services/nft-sync/ipfs-metadata-lazy-sync';
import type {
    ProcessedItemListedEvent,
    ProcessedItemBoughtEvent,
    ProcessedItemCanceledEvent
} from '@/types/marketplace/contract-events';

/**
 * Immediately sync a single listing to MongoDB (real-time)
 * Don't wait for TheGraph polling - instant DB update
 * SERVER-SIDE ONLY
 */
export async function syncListingToMongoDB(event: ProcessedItemListedEvent): Promise<void> {
    try {
        console.log('💾 [MongoDB Sync] Syncing listing to database immediately...');

        const db = await getDatabase();
        const marketplaceCollection = db.collection('marketplace_items');
        const metadataCollection = db.collection('nft_metadata');

        const { nftAddress, tokenId, listingId, price, seller, currency, feeRate, buyerWhitelistEnabled, partialBuyEnabled, erc1155Quantity, desiredErc1155Quantity } = event.data;
        const chainId = 11155111; // Sepolia

        // Determine token standard (ERC721 if erc1155Quantity is 0, else ERC1155)
        const isERC1155 = erc1155Quantity && erc1155Quantity !== '0';
        const tokenStandard = isERC1155 ? 'ERC1155' : 'ERC721';

        // Calculate priceTotal and unitPrice
        const priceTotal = price.toString();
        const unitPrice = isERC1155 && erc1155Quantity && erc1155Quantity !== '0' 
            ? (BigInt(price) / BigInt(erc1155Quantity)).toString()
            : '0';

        // 1. Upsert listing in marketplace_items with FULL v2 fields
        const listingDocument = {
            listingId: listingId.toString(),
            chainId,
            contractAddress: nftAddress.toLowerCase(),
            nftAddress: nftAddress.toLowerCase(),
            tokenId: tokenId.toString(),
            price: price.toString(),
            seller: seller.toLowerCase(),
            isListed: true,
            active: true,
            listingType: event.listingType,
            createdAt: new Date(event.processedAt),
            syncedAt: new Date(),
            // V2 Fields
            status: 'LISTED',
            tokenStandard,
            currency: currency || '0x0000000000000000000000000000000000000000',
            feeRate: feeRate?.toString() || '0',
            priceTotal,
            unitPrice,
            buyerWhitelistEnabled: buyerWhitelistEnabled || false,
            partialBuyEnabled: partialBuyEnabled || false,
            erc1155QuantityListed: isERC1155 ? erc1155Quantity : null,
            remainingQuantity: isERC1155 ? erc1155Quantity : null,
            desiredTokenAddress: event.data.desiredNftAddress || '0x0000000000000000000000000000000000000000',
            desiredTokenId: event.data.desiredTokenId || '0',
            desiredErc1155Quantity: desiredErc1155Quantity || '0',
            buyer: event.data.buyer || '0x0000000000000000000000000000000000000000'
        };

        await marketplaceCollection.updateOne(
            {
                contractAddress: nftAddress.toLowerCase(),
                tokenId: tokenId.toString(),
                listingId: listingId.toString()
            },
            {
                $set: listingDocument,
                $setOnInsert: { firstSyncedAt: new Date() }
            },
            { upsert: true }
        );

        // 2. Ensure NFT exists in nft_metadata (with full enrichment)
        const existingNFT = await metadataCollection.findOne({
            contractAddress: nftAddress.toLowerCase(),
            tokenId: tokenId.toString()
        });

        if (!existingNFT || !existingNFT.metadata?.name) {
            console.log('🔍 [MongoDB Sync] NFT metadata missing, triggering IPFS enrichment...');
            
            // Trigger IPFS metadata fetch (don't wait for it - async)
            const metadataSync = new IPFSMetadataLazySync();
            metadataSync.ensureMetadata(nftAddress.toLowerCase(), tokenId.toString()).catch(err => {
                console.error('⚠️ [MongoDB Sync] Metadata enrichment failed:', err.message);
            });
        }

        // 3. Update nft_metadata.isListed flag
        await metadataCollection.updateOne(
            {
                contractAddress: nftAddress.toLowerCase(),
                tokenId: tokenId.toString()
            },
            {
                $set: {
                    isListed: true,
                    listingId: listingId.toString(),
                    lastVerified: new Date()
                }
            }
        );

        console.log('✅ [MongoDB Sync] Listing synced:', {
            listingId: listingId.toString(),
            nft: `${nftAddress}:${tokenId}`
        });

    } catch (error) {
        console.error('❌ [MongoDB Sync] Failed to sync listing:', error);
        throw error;
    }
}

/**
 * Remove listing from MongoDB after purchase/cancel
 * SERVER-SIDE ONLY
 */
export async function removeListingFromMongoDB(contractAddress: string, tokenId: string, listingId: string, buyer?: string): Promise<void> {
    try {
        console.log('💾 [MongoDB Sync] Removing listing from database...');

        const db = await getDatabase();
        const marketplaceCollection = db.collection('marketplace_items');
        const metadataCollection = db.collection('nft_metadata');

        // 1. Delete from marketplace_items
        await marketplaceCollection.deleteOne({
            contractAddress: contractAddress.toLowerCase(),
            tokenId: tokenId.toString(),
            listingId: listingId.toString()
        });

        // 2. Update nft_metadata.isListed flag (mark as unlisted)
        const metadataUpdate: any = {
            isListed: false,
            listingId: null,
            lastVerified: new Date()
        };

        // If buyer is provided (ItemBought event), update owner and track ownership history
        if (buyer) {
            const existingNFT = await metadataCollection.findOne({
                contractAddress: contractAddress.toLowerCase(),
                tokenId: tokenId.toString()
            });

            const oldOwner = existingNFT?.blockchain?.owner;
            const now = new Date();

            // Update current owner
            metadataUpdate['blockchain.owner'] = buyer.toLowerCase();
            metadataUpdate['blockchain.ownerSince'] = now;

            // Add old owner to history if exists and owner changed
            if (oldOwner && oldOwner.toLowerCase() !== buyer.toLowerCase()) {
                console.log(`📝 [MongoDB Sync] Owner changed: ${oldOwner} → ${buyer}`);
                
                // Ensure 'from' timestamp is a Date object
                let fromDate: Date;
                if (existingNFT.blockchain?.ownerSince) {
                    fromDate = existingNFT.blockchain.ownerSince;
                } else if (existingNFT.createdAt) {
                    fromDate = typeof existingNFT.createdAt === 'string' ? new Date(existingNFT.createdAt) : existingNFT.createdAt;
                } else {
                    fromDate = now;
                }

                await metadataCollection.updateOne(
                    {
                        contractAddress: contractAddress.toLowerCase(),
                        tokenId: tokenId.toString()
                    },
                    {
                        $push: {
                            ownershipHistory: {
                                owner: oldOwner,
                                from: fromDate,
                                to: now,
                                detectedAt: now
                            }
                        } as any
                    }
                );
            }
        }

        await metadataCollection.updateOne(
            {
                contractAddress: contractAddress.toLowerCase(),
                tokenId: tokenId.toString()
            },
            {
                $set: metadataUpdate
            }
        );

        console.log('✅ [MongoDB Sync] Listing removed:', {
            listingId,
            nft: `${contractAddress}:${tokenId}`,
            newOwner: buyer || 'unchanged'
        });

    } catch (error) {
        console.error('❌ [MongoDB Sync] Failed to remove listing:', error);
        throw error;
    }
}

/**
 * Update listing in MongoDB after price/terms change
 * SERVER-SIDE ONLY
 */
export async function updateListingInMongoDB(event: any): Promise<void> {
    try {
        console.log('💾 [MongoDB Sync] Updating listing in database...');

        const db = await getDatabase();
        const marketplaceCollection = db.collection('marketplace_items');

        const { nftAddress, tokenId, listingId, newPrice, newDesiredNftAddress, newDesiredTokenId } = event.data;

        // Determine new listing type
        const hasSwap = newDesiredNftAddress && newDesiredNftAddress !== '0x0000000000000000000000000000000000000000';
        const hasPrice = newPrice && newPrice !== '0';
        const listingType = hasSwap && hasPrice ? 'swap-and-sale' : hasSwap ? 'swap' : 'sale';

        // Update the listing with new price/terms
        const updateDoc: any = {
            price: newPrice.toString(),
            listingType,
            updatedAt: new Date(),
            syncedAt: new Date()
        };

        // Update swap parameters if present
        if (hasSwap) {
            updateDoc.desiredNftAddress = newDesiredNftAddress.toLowerCase();
            updateDoc.desiredTokenId = newDesiredTokenId.toString();
        } else {
            // Clear swap parameters if no longer a swap
            updateDoc.desiredNftAddress = '0x0000000000000000000000000000000000000000';
            updateDoc.desiredTokenId = '0';
        }

        const result = await marketplaceCollection.updateOne(
            {
                contractAddress: nftAddress.toLowerCase(),
                tokenId: tokenId.toString(),
                listingId: listingId.toString()
            },
            {
                $set: updateDoc
            }
        );

        if (result.matchedCount === 0) {
            console.warn('⚠️ [MongoDB Sync] Listing not found for update, might need to sync from TheGraph');
        } else {
            console.log('✅ [MongoDB Sync] Listing updated:', {
                listingId: listingId.toString(),
                nft: `${nftAddress}:${tokenId}`,
                newPrice: newPrice.toString(),
                listingType
            });
        }

    } catch (error) {
        console.error('❌ [MongoDB Sync] Failed to update listing:', error);
        throw error;
    }
}
