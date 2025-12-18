/**
 * NFT Detail API (OPTIMIZED)
 * 
 * GET /api/nft/detail?contractAddress=...&tokenId=...
 * 
 * Data Strategy (per DATA_SYNC_ARCHITECTURE.md):
 * 1. Get from nft_metadata (cached IPFS data)
 * 2. Check if blockchain state is stale (>5min) → fetch fresh if needed
 * 3. Lazy-load IPFS metadata if missing
 * 4. Join with nft_stats and insights
 * 
 * Performance:
 * - IPFS metadata: Cached forever (immutable)
 * - Blockchain state: Cached 5min (on-demand refresh)
 * - Stats: Real-time from MongoDB
 */

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, getQueryParam, BadRequestError } from '@/lib/api';
import { getCollection } from '@/lib/mongodb';
import { blockchainStateSync } from '@/services/nft-sync/blockchain-state-sync';
import { ipfsMetadataLazySync } from '@/services/nft-sync/ipfs-metadata-lazy-sync';

export const GET = apiHandler(async (request: NextRequest) => {
    const startTime = Date.now();

    const contractAddress = getQueryParam(request, 'contractAddress');
    const tokenId = getQueryParam(request, 'tokenId');
    const forceRefresh = getQueryParam(request, 'refresh') === 'true';

    if (!contractAddress || !tokenId) {
        throw new BadRequestError('Missing contractAddress or tokenId');
    }

        // Step 1: Get from nft_metadata
        const nftMetadata = await getCollection('nft_metadata');
        let nft = await nftMetadata.findOne({ contractAddress, tokenId });

        // Step 2: Check if blockchain state is stale or force refresh
        const BLOCKCHAIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        const blockchainStale =
            forceRefresh ||
            !nft?.blockchain?.lastSyncedAt ||
            (Date.now() - nft.blockchain.lastSyncedAt.getTime() > BLOCKCHAIN_CACHE_TTL);

        if (blockchainStale) {
            console.log(`🔄 [NFT Detail] Blockchain state stale, syncing...`);
            console.log(`   Contract: ${contractAddress}`);
            console.log(`   TokenId: ${tokenId}`);
            console.log(`   Reason: ${!nft ? 'NFT not in DB' : forceRefresh ? 'Force refresh' : !nft.blockchain?.lastSyncedAt ? 'Never synced' : 'Stale (>5min)'}`);

            await blockchainStateSync.syncNFTState(
                contractAddress,
                tokenId,
                process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS
            );

            // Refetch after sync
            nft = await nftMetadata.findOne({ contractAddress, tokenId });

            console.log(`   ✅ After sync - approved: ${nft?.blockchain?.approved || 'NULL'}`);
            console.log(`   ✅ After sync - isApprovedForAll: ${nft?.blockchain?.isApprovedForAll || false}`);
        } else if (nft?.blockchain) {
            console.log(`✅ [NFT Detail] Using cached blockchain state (age: ${Math.round((Date.now() - nft.blockchain.lastSyncedAt.getTime()) / 1000)}s)`);
            console.log(`   Approved: ${nft.blockchain.approved || 'NULL'}`);
            console.log(`   IsApprovedForAll: ${nft.blockchain.isApprovedForAll || false}`);
        }

        // Step 3: Lazy-load IPFS metadata if missing
        if (!nft?.metadata?.name) {
            console.log(`📡 [NFT Detail] IPFS metadata missing, lazy-loading...`);
            await ipfsMetadataLazySync.ensureMetadata(contractAddress, tokenId);
            // Refetch after metadata fetch
            nft = await nftMetadata.findOne({ contractAddress, tokenId });
        }

        // Step 4: Join with stats
        const nftStats = await getCollection('nft_stats');
        const stats = await nftStats.findOne({ contractAddress, tokenId });

        // Step 5: Get insights (item-specific OR collection-wide)
        const insightsCollection = await getCollection('admin_nft_insights');
        const insights = await insightsCollection.findOne({
            contractAddress,
            $or: [
                { tokenId }, // Item-specific
                { tokenId: null }, // Collection-wide
                { tokenId: '' },
                { tokenId: { $exists: false } }
            ]
        });

        // Step 6: Get marketplace listing (if any)
        const marketplaceItems = await getCollection('marketplace_items');
        const listing = await marketplaceItems.findOne({
            contractAddress,
            tokenId,
            active: true
        });

        // Prepare response
        const response = {
            contractAddress,
            tokenId,

            // IPFS metadata (cached forever)
            metadata: nft?.metadata || {
                name: `NFT #${tokenId}`,
                description: '',
                image: '',
                attributes: []
            },

            // Contract info
            contract: nft?.contract || {
                name: null,
                symbol: null,
                address: contractAddress,
                tokenURI: null
            },

            // Blockchain state (cached 5min)
            blockchain: nft?.blockchain || {
                owner: null,
                approved: null,
                isApprovedForAll: false,
                lastSyncedAt: null
            },

            // Approval Status Helper (for UI)
            approvalStatus: {
                hasTokenApproval: nft?.blockchain?.approved &&
                    nft.blockchain.approved !== '0x0000000000000000000000000000000000000000',
                hasOperatorApproval: nft?.blockchain?.isApprovedForAll || false,
                isApprovedForMarketplace: (
                    (nft?.blockchain?.approved &&
                        nft.blockchain.approved.toLowerCase() === process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS?.toLowerCase()) ||
                    nft?.blockchain?.isApprovedForAll
                ),
                approvedAddress: nft?.blockchain?.approved || null,
                marketplaceAddress: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || null
            },

            // Stats (real-time)
            stats: stats || {
                viewCount: 0,
                likeCount: 0,
                watchlistCount: 0,
                averageRating: 0,
                ratingCount: 0
            },

            // Insights (admin-managed)
            insights: insights || null,

            // Marketplace listing (if listed) - with ALL v2 fields
            marketplace: listing ? {
                // Core
                listingId: listing.listingId,
                isListed: listing.active,
                active: listing.active,

                // Pricing (v1 & v2)
                price: listing.price || listing.priceTotal,
                priceTotal: listing.priceTotal,
                unitPrice: listing.unitPrice,

                // Parties
                seller: listing.seller,
                buyer: listing.buyer || null,

                // Swap Data
                desiredContractAddress: listing.desiredContractAddress || listing.desiredTokenAddress,
                desiredTokenAddress: listing.desiredTokenAddress,
                desiredTokenId: listing.desiredTokenId,
                desiredErc1155Quantity: listing.desiredErc1155Quantity,

                // v2 Fields
                tokenStandard: listing.tokenStandard,
                listingType: listing.listingType,
                status: listing.status,

                // ERC1155
                erc1155QuantityListed: listing.erc1155QuantityListed,
                remainingQuantity: listing.remainingQuantity,

                // Advanced
                buyerWhitelistEnabled: listing.buyerWhitelistEnabled,
                partialBuyEnabled: listing.partialBuyEnabled,
                feeRate: listing.feeRate,

                // Chain & Timestamps
                chainId: listing.chainId,
                createdAt: listing.createdAt,
                syncedAt: listing.syncedAt
            } : null,

            // Metadata
            cached: !blockchainStale,
            loadTime: Date.now() - startTime
        };

    // Increment view count
    await nftStats.updateOne(
        { contractAddress, tokenId },
        {
            $inc: { viewCount: 1 },
            $set: { lastViewedAt: new Date() }
        },
        { upsert: true }
    );

    return apiSuccess(response);
});
