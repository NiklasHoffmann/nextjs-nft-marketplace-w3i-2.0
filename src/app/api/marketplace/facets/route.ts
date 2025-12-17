import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import marketplaceAbi from '@/constants/marketplace.abi.json';

const MARKETPLACE_ADDRESS = '0xF422A7779D2feB884CcC1773b88d98494A946604' as `0x${string}`;

export async function GET() {
  try {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
    });

    // Get all facets
    const facets = await publicClient.readContract({
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceAbi,
      functionName: 'facets',
    }) as Array<{ facetAddress: `0x${string}`; functionSelectors: `0x${string}`[] }>;

    // Check for createListing selector
    const createListingSelector = '0xcf4dffa1';
    let createListingFound = false;
    let createListingFacet = null;

    for (const facet of facets) {
      if (facet.functionSelectors.includes(createListingSelector as `0x${string}`)) {
        createListingFound = true;
        createListingFacet = facet.facetAddress;
        break;
      }
    }

    return NextResponse.json({
      success: true,
      facets: facets.map((f) => ({
        address: f.facetAddress,
        selectorCount: f.functionSelectors.length,
        selectors: f.functionSelectors,
      })),
      createListing: {
        selector: createListingSelector,
        found: createListingFound,
        facet: createListingFacet,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
