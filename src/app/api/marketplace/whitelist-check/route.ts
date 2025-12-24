/**
 * Marketplace Collection Whitelist Check API
 * 
 * Checks if a collection is whitelisted on the marketplace
 * Used by batch listing to verify all collections
 */

import { NextRequest } from 'next/server';
import { createPublicClient, http, getAddress } from 'viem';
import { sepolia } from 'viem/chains';
import marketplaceAbi from '@/constants/marketplace.abi.json';
import { apiHandler } from '@/lib/api/handler';
import { apiSuccess, apiBadRequest } from '@/lib/api/responses';

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http()
});

export const POST = apiHandler(async (request: NextRequest) => {
    try {
        const body = await request.json();
        const { marketplaceAddress, collectionAddress } = body;

        console.log('[Whitelist Check] Request body:', body);

        if (!marketplaceAddress || !collectionAddress) {
            console.error('[Whitelist Check] Missing parameters:', { marketplaceAddress, collectionAddress });
            return apiBadRequest('Missing required parameters');
        }

        // Ensure addresses are properly checksummed
        const checksummedMarketplace = getAddress(marketplaceAddress);
        const checksummedCollection = getAddress(collectionAddress);

        console.log('🔍 [Whitelist Check] ==================');
        console.log('📍 Marketplace:', checksummedMarketplace);
        console.log('📍 Collection:', checksummedCollection);
        console.log('📍 Collection (lowercase):', collectionAddress.toLowerCase());

        // Call isCollectionWhitelisted on marketplace contract
        const isWhitelisted = await publicClient.readContract({
            address: checksummedMarketplace,
            abi: marketplaceAbi,
            functionName: 'isCollectionWhitelisted',
            args: [checksummedCollection]
        });

        console.log('✅ Contract response (raw):', isWhitelisted);
        console.log('✅ Contract response (type):', typeof isWhitelisted);
        console.log('✅ Contract response (boolean):', Boolean(isWhitelisted));
        console.log('==================\n');

        const result = {
            isWhitelisted: Boolean(isWhitelisted),
            collectionAddress: checksummedCollection,
            marketplaceAddress: checksummedMarketplace
        };

        console.log('[Whitelist Check] Returning:', result);

        return apiSuccess(result);
    } catch (error) {
        console.error('[Whitelist Check] Error:', error);
        throw error;
    }
});
