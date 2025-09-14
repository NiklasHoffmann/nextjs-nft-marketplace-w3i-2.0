import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

interface NFTStats {
  contractAddress: string;
  tokenId: string;
  viewCount: number;
  favoriteCount: number;
  averageRating: number;
  ratingCount: number;
  watchlistCount: number;
  lastViewed?: string;
}

// GET /api/stats/nft - Get NFT statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get('contractAddress');
    const tokenId = searchParams.get('tokenId');

    if (!contractAddress || !tokenId) {
      return NextResponse.json(
        { success: false, error: 'contractAddress and tokenId are required' },
        { status: 400 }
      );
    }

    // Get view count from views collection
    const viewsCollection = await getCollection('nft_views');
    const viewCount = await viewsCollection.countDocuments({
      contractAddress: contractAddress.toLowerCase(),
      tokenId: tokenId
    });

    // Get favorite count from favorites
    const favoritesCollection = await getCollection('user_favorites');
    const favoriteCount = await favoritesCollection.countDocuments({
      contractAddress: contractAddress.toLowerCase(),
      tokenId: tokenId
    });

    // Get rating statistics
    const ratingsCollection = await getCollection('user_ratings');
    const ratings = await ratingsCollection.find({
      contractAddress: contractAddress.toLowerCase(),
      tokenId: tokenId
    }).toArray();

    const ratingCount = ratings.length;
    const averageRating = ratingCount > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratingCount 
      : 0;

    // Get watchlist count
    const watchlistCollection = await getCollection('user_watchlist');
    const watchlistCount = await watchlistCollection.countDocuments({
      contractAddress: contractAddress.toLowerCase(),
      tokenId: tokenId
    });

    const stats: NFTStats = {
      contractAddress: contractAddress.toLowerCase(),
      tokenId: tokenId,
      viewCount,
      favoriteCount,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingCount,
      watchlistCount
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching NFT stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch NFT stats' },
      { status: 500 }
    );
  }
}

// POST /api/stats/nft - Record NFT view
export async function POST(request: NextRequest) {
  try {
    const { contractAddress, tokenId, userId } = await request.json();

    if (!contractAddress || !tokenId) {
      return NextResponse.json(
        { success: false, error: 'contractAddress and tokenId are required' },
        { status: 400 }
      );
    }

    const collection = await getCollection('nft_views');
    
    const viewRecord = {
      contractAddress: contractAddress.toLowerCase(),
      tokenId: tokenId,
      userId: userId?.toLowerCase(), // Optional - can track anonymous views
      viewedAt: new Date().toISOString()
    };

    await collection.insertOne(viewRecord);

    return NextResponse.json({
      success: true,
      data: { message: 'View recorded' }
    });

  } catch (error) {
    console.error('Error recording NFT view:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record view' },
      { status: 500 }
    );
  }
}