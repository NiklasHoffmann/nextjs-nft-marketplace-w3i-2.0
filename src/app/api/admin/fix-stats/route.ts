import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import {
    apiSuccess,
    apiUnauthorized,
    apiInternalError,
    requireAdmin,
    rateLimit,
    RATE_LIMIT_CONFIG
} from '@/lib/api';

/**
 * Admin API: Fix Negative Stats
 * 
 * GET /api/admin/fix-stats
 * 
 * Recalculates all stats by counting from source collections.
 * This fixes any negative values or inconsistencies.
 */
export async function GET(request: NextRequest) {
    try {
        // Require admin authentication
        await requireAdmin(request);

        // Apply strict rate limiting for admin operations
        await rateLimit(request, RATE_LIMIT_CONFIG.STRICT);

        // Get collections
        const statsCollection = await getCollection('nft_stats');
        const favoritesCollection = await getCollection('user_favorites');
        const watchlistCollection = await getCollection('user_watchlist');
        const ratingsCollection = await getCollection('user_ratings');
        const viewsCollection = await getCollection('nft_views');

        // Find all stats documents with negative values
        const negativeStats = await statsCollection.find({
            $or: [
                { viewCount: { $lt: 0 } },
                { favoriteCount: { $lt: 0 } },
                { watchlistCount: { $lt: 0 } },
                { ratingCount: { $lt: 0 } }
            ]
        }).toArray();

        console.log(`ðŸ” Found ${negativeStats.length} stats documents with negative values`);

        if (negativeStats.length === 0) {
            return apiSuccess({
                message: 'No negative stats found! Database is clean.',
                fixed: 0
            });
        }

        const results = [];

        // Fix each document by recounting from source collections
        for (const statDoc of negativeStats) {
            const { contractAddress, tokenId } = statDoc;

            console.log(`ðŸ“Š Fixing stats for ${contractAddress}/${tokenId}`);

            // Recount from source collections
            const [favoriteCount, watchlistCount, ratings, viewCount] = await Promise.all([
                favoritesCollection.countDocuments({
                    contractAddress: contractAddress,
                    tokenId: tokenId
                }),
                watchlistCollection.countDocuments({
                    contractAddress: contractAddress,
                    tokenId: tokenId
                }),
                ratingsCollection.find({
                    contractAddress: contractAddress,
                    tokenId: tokenId,
                    isPublic: true
                }).toArray(),
                viewsCollection.countDocuments({
                    contractAddress: contractAddress,
                    tokenId: tokenId
                })
            ]);

            const ratingCount = ratings.length;
            const averageRating = ratingCount > 0
                ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratingCount
                : 0;

            const before = {
                viewCount: statDoc.viewCount,
                favoriteCount: statDoc.favoriteCount,
                watchlistCount: statDoc.watchlistCount,
                ratingCount: statDoc.ratingCount
            };

            const after = {
                viewCount: Math.max(0, viewCount),
                favoriteCount: Math.max(0, favoriteCount),
                watchlistCount: Math.max(0, watchlistCount),
                averageRating: Math.round(averageRating * 10) / 10,
                ratingCount: Math.max(0, ratingCount)
            };

            // Update with correct values
            await statsCollection.updateOne(
                { contractAddress, tokenId },
                {
                    $set: {
                        ...after,
                        lastUpdated: new Date().toISOString()
                    }
                }
            );

            results.push({
                nft: `${contractAddress}/${tokenId}`,
                before,
                after
            });
        }

        return apiSuccess({
            message: `Fixed ${results.length} stats documents`,
            fixed: results.length,
            results
        });

    } catch (error) {
        console.error('Error fixing negative stats:', error);
        return apiInternalError('Failed to fix negative stats');
    }
}
