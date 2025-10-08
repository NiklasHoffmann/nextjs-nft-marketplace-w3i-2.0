import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

/**
 * NFT Cache API - Layer 2 (Server-Side Cache)
 * 
 * Provides server-side caching for aggregated NFT data to reduce API calls
 * and improve performance for all users.
 * 
 * Cache Strategy:
 * - TTL: 5 minutes (fresh)
 * - Stale: 30 minutes (stale-while-revalidate)
 * - Shared between all users
 */

interface CachedNFT {
    nftKey: string;
    contractAddress: string;
    tokenId: string;
    data: any; // AggregatedNFT
    cachedAt: number;
    expiresAt: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const STALE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * GET /api/nft/cache - Fetch cached NFT data
 * Query params:
 * - contractAddress: NFT contract address
 * - tokenId: NFT token ID
 * - multiple: Comma-separated list of nftKeys (format: address-tokenId)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const contractAddress = searchParams.get('contractAddress');
        const tokenId = searchParams.get('tokenId');
        const multiple = searchParams.get('multiple'); // Format: "0x123-1,0x456-2"

        const collection = await getCollection('nft_cache');

        // Batch fetch
        if (multiple) {
            const nftKeys = multiple.split(',').map(k => k.trim());
            const now = Date.now();

            const cached = await collection
                .find({
                    nftKey: { $in: nftKeys },
                    expiresAt: { $gt: now } // Not completely expired
                })
                .toArray();

            const result: Record<string, any> = {};
            cached.forEach((doc: any) => {
                result[doc.nftKey] = {
                    data: doc.data,
                    isFresh: (now - doc.cachedAt) < CACHE_TTL,
                    isStale: (now - doc.cachedAt) >= CACHE_TTL,
                    age: now - doc.cachedAt
                };
            });

            return NextResponse.json({
                success: true,
                cached: result,
                hitRate: `${cached.length}/${nftKeys.length}`,
                timestamp: now
            });
        }

        // Single fetch
        if (contractAddress && tokenId) {
            const nftKey = `${contractAddress.toLowerCase()}-${tokenId}`;
            const now = Date.now();

            const cached = await collection.findOne({
                nftKey,
                expiresAt: { $gt: now }
            });

            if (cached) {
                const age = now - (cached as any).cachedAt;
                const isFresh = age < CACHE_TTL;
                return NextResponse.json({
                    success: true,
                    data: (cached as any).data,
                    isFresh,
                    isStale: !isFresh,
                    age,
                    cachedAt: (cached as any).cachedAt
                });
            }

            return NextResponse.json({
                success: false,
                error: 'Not in cache'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: false,
            error: 'Missing contractAddress/tokenId or multiple parameter'
        }, { status: 400 });

    } catch (error) {
        console.error('❌ Cache fetch error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch cache'
        }, { status: 500 });
    }
}

/**
 * POST /api/nft/cache - Store NFT data in cache
 * Body: { contractAddress, tokenId, data }
 * or: { items: [{ contractAddress, tokenId, data }] } for batch
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const collection = await getCollection('nft_cache');
        const now = Date.now();

        // Batch insert
        if (body.items && Array.isArray(body.items)) {
            const cacheEntries = body.items.map((item: any) => ({
                nftKey: `${item.contractAddress.toLowerCase()}-${item.tokenId}`,
                contractAddress: item.contractAddress.toLowerCase(),
                tokenId: item.tokenId,
                data: item.data,
                cachedAt: now,
                expiresAt: now + STALE_TTL
            }));

            const result = await collection.bulkWrite(
                cacheEntries.map((entry: CachedNFT) => ({
                    updateOne: {
                        filter: { nftKey: entry.nftKey },
                        update: { $set: entry },
                        upsert: true
                    }
                }))
            );

            return NextResponse.json({
                success: true,
                cached: cacheEntries.length,
                upserted: result.upsertedCount,
                modified: result.modifiedCount
            });
        }

        // Single insert
        const { contractAddress, tokenId, data } = body;

        if (!contractAddress || !tokenId || !data) {
            return NextResponse.json({
                success: false,
                error: 'Missing contractAddress, tokenId, or data'
            }, { status: 400 });
        }

        const nftKey = `${contractAddress.toLowerCase()}-${tokenId}`;
        const cacheEntry: CachedNFT = {
            nftKey,
            contractAddress: contractAddress.toLowerCase(),
            tokenId,
            data,
            cachedAt: now,
            expiresAt: now + STALE_TTL
        };

        await collection.updateOne(
            { nftKey },
            { $set: cacheEntry },
            { upsert: true }
        );

        return NextResponse.json({
            success: true,
            nftKey,
            cachedAt: now,
            expiresAt: cacheEntry.expiresAt
        });

    } catch (error) {
        console.error('❌ Cache store error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to store cache'
        }, { status: 500 });
    }
}

/**
 * DELETE /api/nft/cache - Clear cache entries
 * Query params:
 * - contractAddress + tokenId: Clear specific NFT
 * - all=true: Clear all cache (admin only)
 * - expired=true: Clear expired entries only
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const contractAddress = searchParams.get('contractAddress');
        const tokenId = searchParams.get('tokenId');
        const all = searchParams.get('all') === 'true';
        const expired = searchParams.get('expired') === 'true';

        const collection = await getCollection('nft_cache');
        const now = Date.now();

        // Clear all (admin)
        if (all) {
            const result = await collection.deleteMany({});

            return NextResponse.json({
                success: true,
                deleted: result.deletedCount,
                message: 'All cache cleared'
            });
        }

        // Clear expired
        if (expired) {
            const result = await collection.deleteMany({
                expiresAt: { $lt: now }
            });

            return NextResponse.json({
                success: true,
                deleted: result.deletedCount,
                message: 'Expired cache cleared'
            });
        }

        // Clear specific NFT
        if (contractAddress && tokenId) {
            const nftKey = `${contractAddress.toLowerCase()}-${tokenId}`;
            const result = await collection.deleteOne({ nftKey });

            return NextResponse.json({
                success: true,
                deleted: result.deletedCount,
                nftKey
            });
        }

        return NextResponse.json({
            success: false,
            error: 'Specify contractAddress+tokenId, expired=true, or all=true'
        }, { status: 400 });

    } catch (error) {
        console.error('❌ Cache clear error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to clear cache'
        }, { status: 500 });
    }
}
