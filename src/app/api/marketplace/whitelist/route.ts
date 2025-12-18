import { NextRequest } from 'next/server';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import marketplaceAbi from '@/constants/marketplace.abi.json';
import { apiHandler } from '@/lib/api/handler';
import { apiSuccess } from '@/lib/api/responses';

const MARKETPLACE_ADDRESS = '0xF422A7779D2feB884CcC1773b88d98494A946604';

export const GET = apiHandler(async (request: NextRequest) => {
  const client = createPublicClient({
    chain: sepolia,
    transport: http()
  });

  const whitelistedCollections = await client.readContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: marketplaceAbi,
    functionName: 'getWhitelistedCollections',
  }) as string[];

  console.log('📋 [Whitelist API] Current whitelist:', whitelistedCollections);

  return apiSuccess({
    collections: whitelistedCollections,
    count: whitelistedCollections.length
  });
});
