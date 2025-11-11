import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import {
    apiSuccess,
    apiBadRequest,
    apiInternalError,
    requireAdmin,
    rateLimit,
    RATE_LIMIT_CONFIG,
    parseJsonBody,
    isValidAddress,
    isValidTokenId,
    BadRequestError
} from '@/lib/api';

/**
 * ADMIN API - Update NFT stats counter
 * This is called internally when user interactions change
 * Maintains denormalized stats for fast reads
 */
export async function POST(request: NextRequest) {
    try {
        // Require admin authentication (throws UnauthorizedError if not admin)
        await requireAdmin(request);

        // Apply strict rate limiting for admin write operations
        await rateLimit(request, RATE_LIMIT_CONFIG.STRICT);

        // Parse and validate request body
        const body = await parseJsonBody<{
            contractAddress: string;
            tokenId: string;
            field: string;
            increment: boolean;
        }>(request);

        const { contractAddress, tokenId, field, increment } = body;

        if (!contractAddress || !tokenId || !field) {
            throw new BadRequestError('contractAddress, tokenId, and field are required');
        }

        if (!isValidAddress(contractAddress)) {
            throw new BadRequestError('Invalid contract address format');
        }
        if (!isValidTokenId(tokenId)) {
            throw new BadRequestError('Invalid token ID format');
        }

        // Validate field name (security check)
        const allowedFields = ['viewCount', 'favoriteCount', 'watchlistCount', 'ratingCount'];
        if (!allowedFields.includes(field)) {
            throw new BadRequestError(`Invalid field. Allowed: ${allowedFields.join(', ')}`);
        }

        const collection = await getCollection('nft_stats');
        const lowerContractAddress = contractAddress.toLowerCase();

        // Use atomic increment/decrement operation
        const updateOperation = increment ? { $inc: { [field]: 1 } } : { $inc: { [field]: -1 } };

        const result = await collection.updateOne(
            {
                contractAddress: lowerContractAddress,
                tokenId: tokenId
            },
            {
                ...updateOperation,
                $set: {
                    lastUpdated: new Date().toISOString()
                },
                $setOnInsert: {
                    contractAddress: lowerContractAddress,
                    tokenId: tokenId,
                    viewCount: 0,
                    favoriteCount: 0,
                    watchlistCount: 0,
                    averageRating: 0,
                    ratingCount: 0,
                    createdAt: new Date().toISOString()
                }
            },
            { upsert: true }
        );

        // Fetch updated stats
        const updatedDoc = await collection.findOne({
            contractAddress: lowerContractAddress,
            tokenId: tokenId
        });

        return apiSuccess(updatedDoc);

    } catch (error) {
        console.error('Error updating NFT stats:', error);

        // Use typed error responses
        if (error instanceof BadRequestError) {
            return apiBadRequest(error.message);
        }

        return apiInternalError('Failed to update NFT stats');
    }
}
