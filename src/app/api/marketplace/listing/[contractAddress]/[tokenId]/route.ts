/**
 * Marketplace Listing API Route
 * 
 * Server-side endpoint to fetch marketplace listing data from TheGraph.
 * Bypasses CSP restrictions by running on the server.
 */

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, BadRequestError } from '@/lib/api';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { GET_ACTIVE_ITEMS } from '@/constants/subgraph.queries';

interface RouteParams {
  params: Promise<{
    contractAddress: string;
    tokenId: string;
  }>;
}

/**
 * GET /api/marketplace/listing/[contractAddress]/[tokenId]
 * 
 * Fetches marketplace listing for a specific NFT.
 * Since we can only use GET_ACTIVE_ITEMS, we fetch all items and filter.
 */
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  return apiHandler(async () => {
    const { contractAddress, tokenId } = await context.params;

    if (!contractAddress || !tokenId) {
      throw new BadRequestError('Missing contractAddress or tokenId parameter');
    }

    // Normalize addresses for comparison
    const normalizedAddress = contractAddress.toLowerCase();
    const normalizedTokenId = tokenId.toLowerCase();

    // Create Apollo Client for server-side query
    const client = new ApolloClient({
      uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
      cache: new InMemoryCache(),
      defaultOptions: {
        query: {
          fetchPolicy: 'no-cache',
        },
      },
    });

    // Fetch all active items (only query that works)
    const { data, error } = await client.query({
      query: GET_ACTIVE_ITEMS,
    });

    if (error) {
      console.error('❌ TheGraph query error:', error);
      throw new Error(`Failed to fetch marketplace data: ${error.message}`);
    }

    // Filter for the specific NFT (field is 'items', not 'activeItems')
    const items = data?.items || [];

    const listing = items.find(
      (item: any) =>
        item.contractAddress?.toLowerCase() === normalizedAddress &&
        item.tokenId === tokenId // tokenId is a string in GraphQL, not lowercase
    );

    if (!listing) {
      // NFT not listed - return null, not an error
      return apiSuccess({ listing: null });
    }

    // Return the listing data
    return apiSuccess({
      listing: {
        listingId: listing.listingId,
        contractAddress: listing.contractAddress,
        tokenId: listing.tokenId,
        price: listing.price,
        seller: listing.seller,
        buyer: listing.buyer,
        isListed: listing.isListed,
        desiredContractAddress: listing.desiredContractAddress,
        desiredTokenId: listing.desiredTokenId,
      },
    });
  })(request);
}
