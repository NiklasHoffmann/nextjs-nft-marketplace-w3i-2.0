/**
 * Marketplace Events Webhook
 * 
 * Receives events from client-side EventListener and triggers server-side actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// Deduplication: Track processed events (txHash + eventName)
const processedEvents = new Map<string, number>();
const DEDUP_WINDOW = 5000; // 5 seconds

/**
 * POST /api/events/marketplace
 * 
 * Client-side EventListener forwards events here for server-side processing
 */
export async function POST(request: NextRequest) {
    console.log('🔔 [Events API] Request received!');
    
    try {
        const body = await request.json();
        console.log('📦 [Events API] Body parsed:', body?.event?.eventName);
        
        const event = body.event;

        if (!event || !event.eventName) {
            console.error('❌ [Events API] Invalid event data');
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid event data' 
            }, { status: 400 });
        }

        // Deduplication check
        const dedupKey = `${event.txHash}-${event.eventName}`;
        const now = Date.now();
        const lastProcessed = processedEvents.get(dedupKey);
        
        if (lastProcessed && (now - lastProcessed) < DEDUP_WINDOW) {
            console.log(`⏭️ [Events API] Duplicate event detected (${dedupKey}), skipping...`);
            return NextResponse.json({
                success: true,
                processed: false,
                reason: 'duplicate',
                eventName: event.eventName
            });
        }
        
        // Mark as processed
        processedEvents.set(dedupKey, now);
        
        // Cleanup old entries (prevent memory leak)
        if (processedEvents.size > 100) {
            const cutoff = now - DEDUP_WINDOW;
            for (const [key, timestamp] of processedEvents.entries()) {
                if (timestamp < cutoff) {
                    processedEvents.delete(key);
                }
            }
        }

        console.log(`📡 [Events API] Processing ${event.eventName}...`);

        // Import sync functions dynamically (avoid top-level import issues)
        const { syncListingToMongoDB, removeListingFromMongoDB, removeListingByListingId, updateListingInMongoDB } = await import('@/services/marketplace/event-mongodb-sync');
        const { routeMarketplaceEvent } = await import('@/services/marketplace/event-invalidation-bridge');
        const { broadcastMarketplaceEvent } = await import('@/services/sse/broadcast');

        // SERVER-SIDE: Immediately sync to MongoDB
        if (event.eventName === 'ItemListed') {
            console.log('💾 [Events API] Syncing listing to MongoDB...');
            await syncListingToMongoDB(event);
            
            // Wait for MongoDB to fully commit (avoid race condition with SSE fetch)
            console.log('⏳ [Events API] Waiting for MongoDB commit...');
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } else if (event.eventName === 'ItemBought' || event.eventName === 'ItemCanceled') {
            console.log('🗑️ [Events API] Removing listing from MongoDB...');
            const { nftAddress, tokenId, listingId, buyer } = event.data;
            await removeListingFromMongoDB(
                nftAddress,
                tokenId.toString(),
                listingId.toString(),
                event.eventName === 'ItemBought' ? buyer : undefined // Only pass buyer for purchases
            );
            
            // Wait for MongoDB to fully commit
            console.log('⏳ [Events API] Waiting for MongoDB commit...');
            await new Promise(resolve => setTimeout(resolve, 500));
        } else if (event.eventName === 'ListingCanceledDueToInvalidListing') {
            console.log('🗑️ [Events API] Removing invalid listing from MongoDB...');
            const { nftAddress, tokenId, listingId } = event.data;
            await removeListingFromMongoDB(
                nftAddress,
                tokenId.toString(),
                listingId.toString()
            );

            // Wait for MongoDB to fully commit
            console.log('⏳ [Events API] Waiting for MongoDB commit...');
            await new Promise(resolve => setTimeout(resolve, 500));
        } else if (event.eventName === 'CollectionWhitelistRevokedCancelTriggered') {
            console.log('🗑️ [Events API] Removing listing by listingId (collection whitelist revoked)...');
            const { tokenAddress, listingId } = event.data;
            await removeListingByListingId(tokenAddress, listingId.toString());

            // Wait for MongoDB to fully commit
            console.log('⏳ [Events API] Waiting for MongoDB commit...');
            await new Promise(resolve => setTimeout(resolve, 500));
        } else if (event.eventName === 'ItemUpdated') {
            console.log('🔄 [Events API] Updating listing in MongoDB...');
            await updateListingInMongoDB(event);
            
            // Wait for MongoDB to fully commit
            console.log('⏳ [Events API] Waiting for MongoDB commit...');
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Route event through invalidation bridge
        console.log('🔄 [Events API] Triggering invalidation...');
        routeMarketplaceEvent(event);

        // SERVER-SIDE INVALIDATION: Revalidate Next.js cache for ALL clients
        console.log('🔄 [Events API] Revalidating Next.js cache...');
        revalidatePath('/marketplace'); // Marketplace page
        revalidatePath('/my-nfts'); // User NFTs page
        revalidatePath('/sell'); // Sell page (stats cards)
        revalidatePath('/api/marketplace'); // API route
        revalidatePath('/api/user/nfts'); // User NFTs API
        revalidateTag('marketplace-items'); // Tagged cache entries
        revalidateTag('user-nfts'); // User NFTs cache
        revalidateTag('collections'); // Collections cache
        console.log('✅ [Events API] Cache revalidated for all clients');

        // BROADCAST TO ALL CLIENTS: Send SSE notification
        console.log('📡 [Events API] Broadcasting to connected clients...');
        broadcastMarketplaceEvent(event);

        console.log(`✅ [Events API] Event processed successfully`);

        return NextResponse.json({
            success: true,
            processed: true,
            eventName: event.eventName
        });
    } catch (error) {
        console.error(`❌ [Events API] Processing failed:`, error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
}
