import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

interface UserInteractionData {
    // Favorites
    isFavorite: boolean;
    favoriteAddedAt?: string;

    // Ratings
    rating?: number;
    ratedAt?: string;

    // Watchlist
    isWatchlisted: boolean;
    watchlistAddedAt?: string;

    // Personal Data
    personalNotes?: string;
    personalRating?: number;
    strategy?: string;
    investmentGoal?: string;
    riskLevel?: string;

    // Metadata
    userId: string;
    contractAddress: string;
    tokenId: string;
    lastUpdated: string;
}

interface CombinedUserInteractionsResponse {
    success: boolean;
    data?: UserInteractionData;
    error?: string;
}

// GET /api/user/interactions - Get all user interactions for an NFT
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const contractAddress = searchParams.get('contractAddress');
        const tokenId = searchParams.get('tokenId');

        if (!userId || !contractAddress || !tokenId) {
            return NextResponse.json(
                { success: false, error: 'userId, contractAddress, and tokenId are required' },
                { status: 400 }
            );
        }

        console.log('🔍 GET /api/user/interactions called with:', { userId, contractAddress, tokenId });

        // Fetch from all user collections
        const [favoritesCollection, ratingsCollection, watchlistCollection] = await Promise.all([
            getCollection('user_favorites'),
            getCollection('user_ratings'),
            getCollection('user_watchlist'),
        ]);

        const lowerUserId = userId.toLowerCase();
        const lowerContractAddress = contractAddress.toLowerCase();

        // Query all collections in parallel
        const [favoriteDoc, ratingDoc, watchlistDoc] = await Promise.all([
            favoritesCollection.findOne({
                userId: lowerUserId,
                contractAddress: lowerContractAddress,
                tokenId: tokenId
            }),
            ratingsCollection.findOne({
                userId: lowerUserId,
                contractAddress: lowerContractAddress,
                tokenId: tokenId
            }),
            watchlistCollection.findOne({
                userId: lowerUserId,
                contractAddress: lowerContractAddress,
                tokenId: tokenId
            })
        ]);

        // Combine all data into a single response
        const combinedData: UserInteractionData = {
            userId: lowerUserId,
            contractAddress: lowerContractAddress,
            tokenId: tokenId,

            // Favorites
            isFavorite: !!favoriteDoc,
            favoriteAddedAt: favoriteDoc?.addedAt,

            // Ratings
            rating: ratingDoc?.rating,
            ratedAt: ratingDoc?.ratedAt,

            // Watchlist
            isWatchlisted: !!watchlistDoc,
            watchlistAddedAt: watchlistDoc?.addedAt,

            // Personal data (can be extended later)
            personalNotes: ratingDoc?.notes || '', // If you add notes to ratings
            personalRating: ratingDoc?.rating, // Alias for rating
            strategy: undefined, // Can be added later
            investmentGoal: undefined, // Can be added later
            riskLevel: undefined, // Can be added later

            lastUpdated: new Date().toISOString()
        };

        console.log('✅ Combined user interactions:', combinedData);

        const response: CombinedUserInteractionsResponse = {
            success: true,
            data: combinedData
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching user interactions:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user interactions' },
            { status: 500 }
        );
    }
}

// POST /api/user/interactions - Update user interactions (batch update)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, contractAddress, tokenId, ...updates } = body;

        if (!userId || !contractAddress || !tokenId) {
            return NextResponse.json(
                { success: false, error: 'userId, contractAddress, and tokenId are required' },
                { status: 400 }
            );
        }

        console.log('🔄 POST /api/user/interactions called with:', { userId, contractAddress, tokenId, updates });

        const lowerUserId = userId.toLowerCase();
        const lowerContractAddress = contractAddress.toLowerCase();
        const timestamp = new Date().toISOString();

        // Get collections
        const [favoritesCollection, ratingsCollection, watchlistCollection] = await Promise.all([
            getCollection('user_favorites'),
            getCollection('user_ratings'),
            getCollection('user_watchlist'),
        ]);

        const results = [];

        // Update favorites if specified
        if (typeof updates.isFavorite === 'boolean') {
            if (updates.isFavorite) {
                const result = await favoritesCollection.updateOne(
                    { userId: lowerUserId, contractAddress: lowerContractAddress, tokenId },
                    {
                        $set: {
                            userId: lowerUserId,
                            contractAddress: lowerContractAddress,
                            tokenId,
                            addedAt: timestamp
                        }
                    },
                    { upsert: true }
                );
                results.push({ type: 'favorite', action: 'added', result });
            } else {
                const result = await favoritesCollection.deleteOne({
                    userId: lowerUserId,
                    contractAddress: lowerContractAddress,
                    tokenId
                });
                results.push({ type: 'favorite', action: 'removed', result });
            }
        }

        // Update rating if specified
        if (typeof updates.rating === 'number' && updates.rating >= 1 && updates.rating <= 5) {
            const result = await ratingsCollection.updateOne(
                { userId: lowerUserId, contractAddress: lowerContractAddress, tokenId },
                {
                    $set: {
                        userId: lowerUserId,
                        contractAddress: lowerContractAddress,
                        tokenId,
                        rating: updates.rating,
                        notes: updates.personalNotes || '',
                        ratedAt: timestamp
                    }
                },
                { upsert: true }
            );
            results.push({ type: 'rating', action: 'updated', result });
        }

        // Update personal notes independently (if only notes are provided without rating)
        if (typeof updates.personalNotes === 'string' && typeof updates.rating !== 'number') {
            const result = await ratingsCollection.updateOne(
                { userId: lowerUserId, contractAddress: lowerContractAddress, tokenId },
                {
                    $set: {
                        userId: lowerUserId,
                        contractAddress: lowerContractAddress,
                        tokenId,
                        notes: updates.personalNotes
                    },
                    $setOnInsert: {
                        rating: 0,
                        ratedAt: timestamp
                    }
                },
                { upsert: true }
            );
            results.push({ type: 'notes', action: 'updated', result });
        }

        // Update watchlist if specified
        if (typeof updates.isWatchlisted === 'boolean') {
            if (updates.isWatchlisted) {
                const result = await watchlistCollection.updateOne(
                    { userId: lowerUserId, contractAddress: lowerContractAddress, tokenId },
                    {
                        $set: {
                            userId: lowerUserId,
                            contractAddress: lowerContractAddress,
                            tokenId,
                            addedAt: timestamp
                        }
                    },
                    { upsert: true }
                );
                results.push({ type: 'watchlist', action: 'added', result });
            } else {
                const result = await watchlistCollection.deleteOne({
                    userId: lowerUserId,
                    contractAddress: lowerContractAddress,
                    tokenId
                });
                results.push({ type: 'watchlist', action: 'removed', result });
            }
        }

        console.log('✅ Batch update results:', results);

        // Fetch updated data to return to client
        const [favoriteDoc, ratingDoc, watchlistDoc] = await Promise.all([
            favoritesCollection.findOne({
                userId: lowerUserId,
                contractAddress: lowerContractAddress,
                tokenId: tokenId
            }),
            ratingsCollection.findOne({
                userId: lowerUserId,
                contractAddress: lowerContractAddress,
                tokenId: tokenId
            }),
            watchlistCollection.findOne({
                userId: lowerUserId,
                contractAddress: lowerContractAddress,
                tokenId: tokenId
            })
        ]);

        // Combine all data into a single response
        const combinedData: UserInteractionData = {
            userId: lowerUserId,
            contractAddress: lowerContractAddress,
            tokenId: tokenId,

            // Favorites
            isFavorite: !!favoriteDoc,
            favoriteAddedAt: favoriteDoc?.addedAt,

            // Ratings
            rating: ratingDoc?.rating,
            ratedAt: ratingDoc?.ratedAt,

            // Watchlist
            isWatchlisted: !!watchlistDoc,
            watchlistAddedAt: watchlistDoc?.addedAt,

            // Personal data (can be extended later)
            personalNotes: ratingDoc?.notes || '',
            personalRating: ratingDoc?.rating,
            strategy: undefined,
            investmentGoal: undefined,
            riskLevel: undefined,

            lastUpdated: timestamp
        };

        console.log('✅ Returning updated combined data:', combinedData);

        return NextResponse.json({
            success: true,
            data: combinedData,
            message: 'User interactions updated successfully',
            results
        });

    } catch (error) {
        console.error('Error updating user interactions:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update user interactions' },
            { status: 500 }
        );
    }
}

// PUT /api/user/interactions - Alias for POST (for convenience)
export async function PUT(request: NextRequest) {
    return POST(request);
}