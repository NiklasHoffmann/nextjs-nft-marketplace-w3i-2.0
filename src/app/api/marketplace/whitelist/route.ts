import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import marketplaceAbi from '@/constants/marketplace.abi.json';

const MARKETPLACE_ADDRESS = '0xF422A7779D2feB884CcC1773b88d98494A946604';

export async function GET() {
  try {
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

    return NextResponse.json({
      success: true,
      collections: whitelistedCollections,
      count: whitelistedCollections.length
    });
  } catch (error: any) {
    console.error('❌ [Whitelist API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
