import { NextRequest } from 'next/server';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { DIAMOND_LOUPE_FACET_ABI } from '@/config/abis/diamond-loupe-facet';
import { apiHandler } from '@/lib/api/handler';
import { apiSuccess } from '@/lib/api/responses';

const MARKETPLACE_ADDRESS = '0x1107Eb26D47A5bF88E9a9F97cbC7EA38c3E1D7EC' as `0x${string}`;

export const GET = apiHandler(async (request: NextRequest) => {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http('https://ethereum-sepolia-rpc.publicnode.com'),
  });

  // Get all facets
  const facets = await publicClient.readContract({
    address: MARKETPLACE_ADDRESS,
    abi: DIAMOND_LOUPE_FACET_ABI,
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

  return apiSuccess({
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
});
