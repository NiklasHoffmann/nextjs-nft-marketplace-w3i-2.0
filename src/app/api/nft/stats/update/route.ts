import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

/**
 * INTERNAL API - Update NFT stats counter
 * This is called internally when user interactions change
 * Maintains denormalized stats for fast reads
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { contractAddress, tokenId, field, increment } = body;

        if (!contractAddress || !tokenId || !field) {
            return NextResponse.json(
                { success: false, error: 'contractAddress, tokenId, and field are required' },
                { status: 400 }
            );
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

        return NextResponse.json({
            success: true,
            data: updatedDoc
        });

    } catch (error) {
        console.error('Error updating NFT stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update NFT stats' },
            { status: 500 }
        );
    }
}
