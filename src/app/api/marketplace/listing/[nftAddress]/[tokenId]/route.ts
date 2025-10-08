/**
 * Marketplace Listing API Route
 * 
 * Server-side endpoint to fetch marketplace listing data from TheGraph.
 * Bypasses CSP restrictions by running on the server.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { GET_ACTIVE_ITEMS } from '@/constants/subgraph.queries';

interface RouteParams {
  params: Promise<{
    nftAddress: string;
    tokenId: string;
  }>;
}

/**
 * GET /api/marketplace/listing/[nftAddress]/[tokenId]
 * 
 * Fetches marketplace listing for a specific NFT.
 * Since we can only use GET_ACTIVE_ITEMS, we fetch all items and filter.
 */
export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  try {
    const { nftAddress, tokenId } = await context.params;

    if (!nftAddress || !tokenId) {
      return NextResponse.json(
        { error: 'Missing nftAddress or tokenId parameter' },
        { status: 400 }
      );
    }

    // Normalize addresses for comparison
    const normalizedAddress = nftAddress.toLowerCase();
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
      return NextResponse.json(
        { error: 'Failed to fetch marketplace data', details: error.message },
        { status: 500 }
      );
    }

    // Filter for the specific NFT (field is 'items', not 'activeItems')
    const items = data?.items || [];

    // Log first few items to see structure
    if (items.length > 0) {
    }

    const listing = items.find(
      (item: any) =>
        item.nftAddress?.toLowerCase() === normalizedAddress &&
        item.tokenId === tokenId // tokenId is a string in GraphQL, not lowercase
    );

    if (listing) {
    }

    if (!listing) {
      // NFT not listed - return null, not an error
      return NextResponse.json({ listing: null }, { status: 200 });
    }

    // Return the listing data
    return NextResponse.json({
      listing: {
        listingId: listing.listingId,
        nftAddress: listing.nftAddress,
        tokenId: listing.tokenId,
        price: listing.price,
        seller: listing.seller,
        buyer: listing.buyer,
        isListed: listing.isListed,
        desiredNftAddress: listing.desiredNftAddress,
        desiredTokenId: listing.desiredTokenId,
      },
    });
  } catch (error) {
    console.error('Marketplace listing API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
