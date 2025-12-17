/**
 * Marketplace Collection Whitelist Check API
 * 
 * Checks if a collection is whitelisted on the marketplace
 * Used by batch listing to verify all collections
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getAddress } from 'viem';
import { sepolia } from 'viem/chains';
import marketplaceAbi from '@/constants/marketplace.abi.json';

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http()
});

export async function POST(request: NextRequest) {
    try {
        const { marketplaceAddress, collectionAddress } = await request.json();

        if (!marketplaceAddress || !collectionAddress) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // Ensure addresses are properly checksummed
        const checksummedMarketplace = getAddress(marketplaceAddress);
        const checksummedCollection = getAddress(collectionAddress);

        console.log('Checking whitelist:', {
            marketplace: checksummedMarketplace,
            collection: checksummedCollection
        });

        // Call isCollectionWhitelisted on marketplace contract
        const isWhitelisted = await publicClient.readContract({
            address: checksummedMarketplace,
            abi: marketplaceAbi,
            functionName: 'isCollectionWhitelisted',
            args: [checksummedCollection]
        });

        console.log('Whitelist result:', isWhitelisted);

        return NextResponse.json({
            isWhitelisted: isWhitelisted as boolean,
            collectionAddress: checksummedCollection,
            marketplaceAddress: checksummedMarketplace
        });
    } catch (error: any) {
        console.error('Whitelist check error:', error);
        return NextResponse.json(
            { 
                error: error.message || 'Failed to check whitelist status',
                details: error.shortMessage || error.reason
            },
            { status: 500 }
        );
    }
}
