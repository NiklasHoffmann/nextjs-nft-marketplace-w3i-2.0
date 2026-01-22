/**
 * Marketplace Events → MongoDB Sync (SERVER-SIDE ONLY)
 * 
 * Immediately syncs marketplace events to MongoDB.
 * This file should ONLY be imported server-side (in NFT Sync Service).
 */

import { getDatabase } from '@/lib/mongodb';
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
        const collection = db.collection('marketplace_items');

        const { nftAddress, tokenId, listingId, price, seller } = event.data;
        const chainId = 11155111; // Sepolia

        // Upsert listing document
        const document = {
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
            // Additional V2 fields from event if available
            ...(event.data as any)
        };

        await collection.updateOne(
            {
                contractAddress: nftAddress.toLowerCase(),
                tokenId: tokenId.toString(),
                listingId: listingId.toString()
            },
            {
                $set: document,
                $setOnInsert: { firstSyncedAt: new Date() }
            },
            { upsert: true }
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
export async function removeListingFromMongoDB(contractAddress: string, tokenId: string, listingId: string): Promise<void> {
    try {
        console.log('💾 [MongoDB Sync] Removing listing from database...');

        const db = await getDatabase();
        const collection = db.collection('marketplace_items');

        await collection.deleteOne({
            contractAddress: contractAddress.toLowerCase(),
            tokenId: tokenId.toString(),
            listingId: listingId.toString()
        });

        console.log('✅ [MongoDB Sync] Listing removed:', {
            listingId,
            nft: `${contractAddress}:${tokenId}`
        });

    } catch (error) {
        console.error('❌ [MongoDB Sync] Failed to remove listing:', error);
        throw error;
    }
}
