import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api/responses';

// GET /api/test/check-stats - Check what stats exist in database
export async function GET(request: NextRequest) {
    try {

        // Check views collection
        const viewsCollection = await getCollection('nft_views');
        const viewsCount = await viewsCollection.countDocuments();
        const sampleView = await viewsCollection.findOne();

        // Check favorites collection  
        const favoritesCollection = await getCollection('user_favorites');
        const favoritesCount = await favoritesCollection.countDocuments();
        const sampleFavorite = await favoritesCollection.findOne();

        // Check ratings collection
        const ratingsCollection = await getCollection('user_ratings');
        const ratingsCount = await ratingsCollection.countDocuments();
        const sampleRating = await ratingsCollection.findOne();

        // Check watchlist collection
        const watchlistCollection = await getCollection('user_watchlist');
        const watchlistCount = await watchlistCollection.countDocuments();
        const sampleWatchlist = await watchlistCollection.findOne();

        const report = {
            views: { count: viewsCount, sample: sampleView },
            favorites: { count: favoritesCount, sample: sampleFavorite },
            ratings: { count: ratingsCount, sample: sampleRating },
            watchlist: { count: watchlistCount, sample: sampleWatchlist }
        };

        return apiSuccess(report);

    } catch (error) {
        console.error('âŒ Error checking stats:', error);
        return apiInternalError(error instanceof Error ? error.message : 'Unknown error');
    }
}
