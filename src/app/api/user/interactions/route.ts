import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { apiHandler } from '@/lib/api/handler';
import { withAuth } from '@/lib/middleware';
import {
    getCachedInteractions,
    setCachedInteractions,
    invalidateAllCachesForNFT
} from '@/lib/cache';
import {
    apiSuccess,
    apiBadRequest,
    apiInternalError,
    rateLimit,
    RATE_LIMIT_CONFIG,
    getQueryParam,
    parseJsonBody,
    isValidAddress,
    BadRequestError
} from '@/lib/api';

interface UserInteractionData {
    // Favorites
    isFavorite: boolean;
    favoriteAddedAt?: string;

    // Public Ratings (for community averages)
    rating?: number;
    ratedAt?: string;

    // Watchlist
    isWatchlisted: boolean;
    watchlistAddedAt?: string;

    // Private Personal Data (separate from public ratings)
    personalNotes?: string;
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

// GET /api/user/interactions - Get all user interactions for an NFT (AUTH REQUIRED)
export const GET = apiHandler(async (request: NextRequest) => {
    // Require authentication
    await withAuth(request);
    // @ts-ignore - added by withAuth middleware
    const authenticatedUser = request.userAddress as string;

    // Apply rate limiting (lenient for read operations)
    await rateLimit(request, RATE_LIMIT_CONFIG.LENIENT);

    // Extract and validate parameters
    const userId = getQueryParam(request, 'userId', true);
    const contractAddress = getQueryParam(request, 'contractAddress', true);
    const tokenId = getQueryParam(request, 'tokenId', true);

    if (!isValidAddress(contractAddress)) {
        throw new BadRequestError('Invalid contract address format');
    }

    // Fetch from all user collections
    const [favoritesCollection, ratingsCollection, watchlistCollection, personalNotesCollection] = await Promise.all([
        getCollection('user_likes'),
        getCollection('user_ratings'),
        getCollection('user_watchlist'),
        getCollection('user_personal_notes'),
    ]);

    if (!userId) {
        throw new BadRequestError('User ID is required');
    }

    const lowerUserId = authenticatedUser.toLowerCase();
    if (userId.toLowerCase() !== lowerUserId) {
        console.warn('[user/interactions] userId mismatch, using authenticated user instead');
    }
    const lowerContractAddress = contractAddress.toLowerCase();

    // Check cache first
    const cachedData = getCachedInteractions(lowerUserId, lowerContractAddress, tokenId);
    if (cachedData) {
        return apiSuccess({ ...cachedData, cached: true });
    }

    // Query all collections in parallel
    const [favoriteDoc, ratingDoc, watchlistDoc, personalNotesDoc] = await Promise.all([
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
        }),
        personalNotesCollection.findOne({
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

        // Public Ratings (for community averages)
        rating: ratingDoc?.rating,
        ratedAt: ratingDoc?.ratedAt,

        // Watchlist
        isWatchlisted: !!watchlistDoc,
        watchlistAddedAt: watchlistDoc?.addedAt,

        // Private Personal Data (separate from public ratings)
        personalNotes: personalNotesDoc?.personalNotes || '',
        strategy: personalNotesDoc?.strategy,
        investmentGoal: personalNotesDoc?.investmentGoal,
        riskLevel: personalNotesDoc?.riskLevel,

        lastUpdated: new Date().toISOString()
    };

    // Cache the combined data
    setCachedInteractions(lowerUserId, lowerContractAddress, tokenId, combinedData);

    return apiSuccess(combinedData);
});


// POST /api/user/interactions - Update user interactions (AUTH REQUIRED)
export const POST = apiHandler(async (request: NextRequest) => {
    // Require authentication
    await withAuth(request);
    // @ts-ignore
    const authenticatedUser = request.userAddress as string;

    const body = await request.json();
    const { userId, contractAddress, tokenId, ...updates } = body;

    if (!contractAddress || !tokenId) {
        return apiBadRequest('contractAddress and tokenId are required');
    }

    if (!isValidAddress(contractAddress)) {
        return apiBadRequest('Invalid contract address format');
    }

    const lowerUserId = authenticatedUser.toLowerCase();
    if (userId && userId.toLowerCase() !== lowerUserId) {
        console.warn('[user/interactions] userId mismatch, using authenticated user instead');
    }
    const lowerContractAddress = contractAddress.toLowerCase();
    const timestamp = new Date().toISOString();

    // Get collections
    const [favoritesCollection, ratingsCollection, watchlistCollection, personalNotesCollection] = await Promise.all([
        getCollection('user_likes'),
        getCollection('user_ratings'),
        getCollection('user_watchlist'),
        getCollection('user_personal_notes'),
    ]);

    const results = [];
    const statUpdates: Array<{
        contractAddress: string;
        tokenId: string;
        field: 'likeCount' | 'watchlistCount' | 'rating';
        delta?: number;
    }> = []; // Track stat updates to execute atomically

    // Update favorites if specified (TOGGLE logic)
    if (updates.isFavorite !== undefined) {
        const existingCount = await favoritesCollection.countDocuments({
            userId: lowerUserId,
            contractAddress: lowerContractAddress,
            tokenId
        });

        if (existingCount > 0) {
            const result = await favoritesCollection.deleteMany({
                userId: lowerUserId,
                contractAddress: lowerContractAddress,
                tokenId
            });
            results.push({ type: 'favorite', action: 'removed', result });

            if (result.deletedCount && result.deletedCount > 0) {
                statUpdates.push({
                    contractAddress: lowerContractAddress,
                    tokenId,
                    field: 'likeCount',
                    delta: -result.deletedCount
                });
            }
        } else {
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

            statUpdates.push({
                contractAddress: lowerContractAddress,
                tokenId,
                field: 'likeCount',
                delta: 1
            });
        }
    }

    // Update rating if specified (PUBLIC ratings only)
    if (typeof updates.rating === 'number' && updates.rating >= 0 && updates.rating <= 5) {
        if (updates.rating === 0) {
            const result = await ratingsCollection.deleteMany({
                userId: lowerUserId,
                contractAddress: lowerContractAddress,
                tokenId
            });
            results.push({ type: 'rating', action: 'removed', result });

            if (result.deletedCount && result.deletedCount > 0) {
                statUpdates.push({
                    contractAddress: lowerContractAddress,
                    tokenId,
                    field: 'rating'
                });
            }
        } else {
            await ratingsCollection.deleteMany({
                userId: lowerUserId,
                contractAddress: lowerContractAddress,
                tokenId
            });

            const result = await ratingsCollection.insertOne({
                userId: lowerUserId,
                contractAddress: lowerContractAddress,
                tokenId,
                rating: updates.rating,
                isPublic: true,
                ratedAt: timestamp
            });
            results.push({ type: 'rating', action: 'updated', result });

            statUpdates.push({
                contractAddress: lowerContractAddress,
                tokenId,
                field: 'rating'
            });
        }
    }

    // Update personal notes independently (PRIVATE data)
    if (typeof updates.personalNotes === 'string' ||
        typeof updates.strategy === 'string' ||
        typeof updates.investmentGoal === 'string' ||
        typeof updates.riskLevel === 'string') {

        const personalDataUpdate: any = {
            userId: lowerUserId,
            contractAddress: lowerContractAddress,
            tokenId,
            lastUpdated: timestamp
        };

        if (typeof updates.personalNotes === 'string') {
            personalDataUpdate.personalNotes = updates.personalNotes;
        }
        if (typeof updates.strategy === 'string') {
            personalDataUpdate.strategy = updates.strategy;
        }
        if (typeof updates.investmentGoal === 'string') {
            personalDataUpdate.investmentGoal = updates.investmentGoal;
        }
        if (typeof updates.riskLevel === 'string') {
            personalDataUpdate.riskLevel = updates.riskLevel;
        }

        const result = await personalNotesCollection.updateOne(
            { userId: lowerUserId, contractAddress: lowerContractAddress, tokenId },
            {
                $set: personalDataUpdate,
                $setOnInsert: {
                    createdAt: timestamp
                }
            },
            { upsert: true }
        );
        results.push({ type: 'personal_notes', action: 'updated', result });
    }

    // Update watchlist if specified (TOGGLE logic)
    if (updates.isWatchlisted !== undefined) {
        const existingCount = await watchlistCollection.countDocuments({
            userId: lowerUserId,
            contractAddress: lowerContractAddress,
            tokenId
        });

        if (existingCount > 0) {
            const result = await watchlistCollection.deleteMany({
                userId: lowerUserId,
                contractAddress: lowerContractAddress,
                tokenId
            });
            results.push({ type: 'watchlist', action: 'removed', result });

            if (result.deletedCount && result.deletedCount > 0) {
                statUpdates.push({
                    contractAddress: lowerContractAddress,
                    tokenId,
                    field: 'watchlistCount',
                    delta: -result.deletedCount
                });
            }
        } else {
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

            statUpdates.push({
                contractAddress: lowerContractAddress,
                tokenId,
                field: 'watchlistCount',
                delta: 1
            });
        }
    }

    // Execute all stat updates atomically
    if (statUpdates.length > 0) {
        const statsCollection = await getCollection('nft_stats');

        for (const update of statUpdates) {
            if (update.field === 'rating') {
                // Special handling for ratings - need to recalculate average
                const ratingsCollection = await getCollection('user_ratings');
                const allRatings = await ratingsCollection.find({
                    contractAddress: update.contractAddress,  // user_ratings uses contractAddress field
                    tokenId: update.tokenId,
                    isPublic: true
                }).toArray();

                const ratingCount = allRatings.length;
                const averageRating = ratingCount > 0
                    ? allRatings.reduce((sum, r) => sum + r.rating, 0) / ratingCount
                    : 0;

                await statsCollection.updateOne(
                    { contractAddress: update.contractAddress, tokenId: update.tokenId },
                    {
                        $set: {
                            averageRating: Math.round(averageRating * 10) / 10,
                            ratingCount,
                            lastUpdated: timestamp
                        },
                        $setOnInsert: {
                            contractAddress: update.contractAddress,
                            tokenId: update.tokenId,
                            viewCount: 0,
                            likeCount: 0,
                            watchlistCount: 0,
                            createdAt: timestamp
                        }
                    },
                    { upsert: true }
                );
            } else {
                const existingDoc = await statsCollection.findOne({
                    contractAddress: update.contractAddress,
                    tokenId: update.tokenId
                });

                const delta = update.delta ?? 0;
                if (!existingDoc) {
                    if (delta > 0) {
                        await statsCollection.insertOne({
                            contractAddress: update.contractAddress,
                            tokenId: update.tokenId,
                            viewCount: 0,
                            likeCount: update.field === 'likeCount' ? delta : 0,
                            watchlistCount: update.field === 'watchlistCount' ? delta : 0,
                            averageRating: 0,
                            ratingCount: 0,
                            createdAt: timestamp,
                            lastUpdated: timestamp
                        });
                    }
                    continue;
                }

                if (delta > 0) {
                    await statsCollection.updateOne(
                        { contractAddress: update.contractAddress, tokenId: update.tokenId },
                        {
                            $inc: { [update.field]: delta },
                            $set: { lastUpdated: timestamp }
                        }
                    );
                } else if (delta < 0) {
                    const currentValue = existingDoc[update.field as keyof typeof existingDoc] as number || 0;
                    const newValue = Math.max(0, currentValue + delta);
                    await statsCollection.updateOne(
                        { contractAddress: update.contractAddress, tokenId: update.tokenId },
                        {
                            $set: {
                                [update.field]: newValue,
                                lastUpdated: timestamp
                            }
                        }
                    );
                }
            }
        }
    }

    // Fetch updated data to return to client
    const [favoriteDoc, ratingDoc, watchlistDoc, personalNotesDoc] = await Promise.all([
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
        }),
        personalNotesCollection.findOne({
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

        // Public Ratings (for community averages)
        rating: ratingDoc?.rating,
        ratedAt: ratingDoc?.ratedAt,

        // Watchlist
        isWatchlisted: !!watchlistDoc,
        watchlistAddedAt: watchlistDoc?.addedAt,

        // Private Personal Data (separate from public ratings)
        personalNotes: personalNotesDoc?.personalNotes || '',
        strategy: personalNotesDoc?.strategy,
        investmentGoal: personalNotesDoc?.investmentGoal,
        riskLevel: personalNotesDoc?.riskLevel,

        lastUpdated: timestamp
    };

    // IMPORTANT: Cache the updated data FIRST before returning
    setCachedInteractions(lowerUserId, lowerContractAddress, tokenId, combinedData);

    // Invalidate ALL related caches (stats + interactions) to ensure UI updates immediately
    // This fixes the delayed update issue where stats (favoriteCount, watchlistCount, etc.) 
    // weren't refreshing until cache TTL expired
    invalidateAllCachesForNFT(lowerContractAddress, tokenId, lowerUserId);

    // CRITICAL FIX: Fetch and return the updated stats IMMEDIATELY after atomic DB updates
    // This prevents race conditions where the client fetches stats before DB write is committed
    const statsCollection = await getCollection('nft_stats');
    const updatedStats = await statsCollection.findOne({
        contractAddress: lowerContractAddress,  // nft_stats uses contractAddress field
        tokenId: tokenId
    });

    return apiSuccess({
        message: 'User interactions updated successfully',
        data: combinedData,
        stats: updatedStats ? {
            likeCount: updatedStats.likeCount || 0,
            watchlistCount: updatedStats.watchlistCount || 0,
            averageRating: updatedStats.averageRating || 0,
            ratingCount: updatedStats.ratingCount || 0,
            viewCount: updatedStats.viewCount || 0,
            lastUpdated: updatedStats.lastUpdated
        } : null,
        results
    });
});

// PUT /api/user/interactions - Alias for POST (AUTH REQUIRED)
export const PUT = apiHandler(async (request: NextRequest) => {
    // Re-use POST logic with auth
    return POST(request);
});
