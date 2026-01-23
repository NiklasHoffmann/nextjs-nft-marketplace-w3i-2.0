/**
 * Marketplace Listing API Route
 * 
 * Server-side endpoint to fetch marketplace listing data from TheGraph.
 * Bypasses CSP restrictions by running on the server.
 */

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, BadRequestError } from '@/lib/api';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { GET_LISTINGS_BY_NFT } from '@/config/subgraph/queries';

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

    // Fetch listings for this specific NFT
    const { data, error } = await client.query({
      query: GET_LISTINGS_BY_NFT,
      variables: {
        tokenAddress: normalizedAddress,
        tokenId: tokenId,
      },
    });

    if (error) {
      console.error('❌ TheGraph query error:', error);
      throw new Error(`Failed to fetch marketplace data: ${error.message}`);
    }

    // Get the listings array
    const listings = data?.listings || [];

    if (listings.length === 0) {
      // NFT not listed - return null, not an error
      return apiSuccess({ listing: null });
    }

    // Return the first active listing (most recent)
    const listing = listings[0];
    return apiSuccess({
      listing: {
        id: listing.id,
        listingId: listing.listingId,
        tokenAddress: listing.tokenAddress,
        tokenId: listing.tokenId,
        tokenStandard: listing.tokenStandard,
        priceTotal: listing.priceTotal,
        remainingQuantity: listing.remainingQuantity,
        unitPrice: listing.unitPrice,
        listingType: listing.listingType,
        feeRate: listing.feeRate,
        seller: listing.seller,
        status: listing.status,
        active: listing.active,
        createdAt: listing.createdAt,
        desiredTokenAddress: listing.desiredTokenAddress,
        desiredTokenId: listing.desiredTokenId,
      },
    });
  })(request);
}
