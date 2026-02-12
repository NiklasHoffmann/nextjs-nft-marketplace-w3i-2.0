/**
 * Update NFT Owner in nft_metadata Collection
 * 
 * Called immediately after successful purchase
 * Fetches REAL owner from blockchain via ownerOf() - no guessing!
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { apiSuccess, apiError } from '@/lib/api';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { devLog } from '@/utils';

const ERC721_ABI = [
    {
        name: 'ownerOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'tokenId', type: 'uint256' }],
        outputs: [{ name: '', type: 'address' }],
    }
] as const;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { contractAddress, tokenId } = body;

        // Validation
        if (!contractAddress || !tokenId) {
            return apiError('Missing required fields: contractAddress, tokenId', 400);
        }

        const lowerContractAddress = contractAddress.toLowerCase();

        devLog.info(`🔄 [Update Owner] Fetching real owner from blockchain for ${lowerContractAddress}/${tokenId}`);

        // Fetch REAL owner from blockchain
        const client = createPublicClient({
            chain: sepolia,
            transport: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org')
        });

        const owner = await client.readContract({
            address: lowerContractAddress as `0x${string}`,
            abi: ERC721_ABI,
            functionName: 'ownerOf',
            args: [BigInt(tokenId)]
        });

        const lowerOwner = (owner as string).toLowerCase();

        devLog.info(`📡 [Update Owner] Blockchain says owner is: ${lowerOwner}`);

        // Update nft_metadata collection with REAL owner from blockchain
        const nftMetadataCollection = await getCollection('nft_metadata');

        const result = await nftMetadataCollection.updateOne(
            {
                contractAddress: lowerContractAddress,
                tokenId: tokenId
            },
            {
                $set: {
                    currentOwner: lowerOwner,
                    lastVerified: new Date(),
                    'contract.owner': lowerOwner
                }
            },
            {
                upsert: true // Create if doesn't exist
            }
        );

        if (result.matchedCount > 0) {
            devLog.info(`✅ [Update Owner] Updated existing NFT document with blockchain owner`);
        } else if (result.upsertedCount > 0) {
            devLog.info(`✅ [Update Owner] Created new NFT document with blockchain owner`);
        }

        return apiSuccess({
            message: 'NFT ownership updated from blockchain',
            owner: lowerOwner,
            updated: result.modifiedCount > 0,
            created: result.upsertedCount > 0
        });

    } catch (error) {
        devLog.error('❌ [Update Owner] Error:', error);
        return apiError(
            error instanceof Error ? error.message : 'Failed to update NFT ownership',
            500
        );
    }
}
