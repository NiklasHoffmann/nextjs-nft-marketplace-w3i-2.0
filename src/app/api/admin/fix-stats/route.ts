import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

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
        // Simple auth check (you might want to add proper admin auth)
        const { searchParams } = new URL(request.url);
        const authKey = searchParams.get('key');

        // TODO: Replace with proper admin authentication
        // Temporarily disabled for development
        if (process.env.NODE_ENV === 'production' && authKey !== process.env.ADMIN_SECRET_KEY) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

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

        console.log(`🔍 Found ${negativeStats.length} stats documents with negative values`);

        if (negativeStats.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No negative stats found! Database is clean.',
                fixed: 0
            });
        }

        const results = [];

        // Fix each document by recounting from source collections
        for (const statDoc of negativeStats) {
            const { contractAddress, tokenId } = statDoc;

            console.log(`📊 Fixing stats for ${contractAddress}/${tokenId}`);

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

        return NextResponse.json({
            success: true,
            message: `Fixed ${results.length} stats documents`,
            fixed: results.length,
            results
        });

    } catch (error) {
        console.error('Error fixing negative stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fix negative stats' },
            { status: 500 }
        );
    }
}
