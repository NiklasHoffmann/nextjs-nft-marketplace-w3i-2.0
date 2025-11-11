import { NextRequest } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import {
  getCachedStats,
  setCachedStats,
  invalidateStatsCache
} from '@/lib/cache';
import {
  apiSuccess,
  apiBadRequest,
  apiInternalError,
  rateLimit,
  RATE_LIMIT_CONFIG,
  getQueryParam,
  parseJsonBody,
  isValidAddress,
  isValidTokenId,
  BadRequestError,
  InternalError
} from '@/lib/api';

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

// GET /api/nft/stats - Get NFT statistics
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (lenient for read-only operations)
    await rateLimit(request, RATE_LIMIT_CONFIG.LENIENT);

    // Validate and extract parameters
    const contractAddress = getQueryParam(request, 'contractAddress', true);
    const tokenId = getQueryParam(request, 'tokenId', true);

    if (!isValidAddress(contractAddress)) {
      throw new BadRequestError('Invalid contract address format');
    }
    if (!isValidTokenId(tokenId)) {
      throw new BadRequestError('Invalid token ID format');
    }

    const lowerContractAddress = contractAddress.toLowerCase();

    // Check cache first
    const cachedStats = getCachedStats(lowerContractAddress, tokenId);
    if (cachedStats) {
      return apiSuccess({ ...cachedStats, cached: true });
    }

    // Get stats from denormalized nft_stats collection (FAST!)
    const statsCollection = await getCollection('nft_stats');
    const statsDoc = await statsCollection.findOne({
      contractAddress: lowerContractAddress,
      tokenId: tokenId
    });

    // If no stats doc exists, create one by counting (migration path)
    if (!statsDoc) {
      // Count from user collections (only on first access)
      const [favoritesCollection, watchlistCollection, ratingsCollection, viewsCollection] = await Promise.all([
        getCollection('user_favorites'),
        getCollection('user_watchlist'),
        getCollection('user_ratings'),
        getCollection('nft_views')
      ]);

      const [favoriteCount, watchlistCount, ratings, viewCount] = await Promise.all([
        favoritesCollection.countDocuments({
          contractAddress: lowerContractAddress,
          tokenId: tokenId
        }),
        watchlistCollection.countDocuments({
          contractAddress: lowerContractAddress,
          tokenId: tokenId
        }),
        ratingsCollection.find({
          contractAddress: lowerContractAddress,
          tokenId: tokenId,
          isPublic: true
        }).toArray(),
        viewsCollection.countDocuments({
          contractAddress: lowerContractAddress,
          tokenId: tokenId
        })
      ]);

      const ratingCount = ratings.length;
      const averageRating = ratingCount > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratingCount
        : 0;

      // Create initial stats document
      const initialStats = {
        contractAddress: lowerContractAddress,
        tokenId: tokenId,
        viewCount,
        favoriteCount,
        watchlistCount,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingCount,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      await statsCollection.insertOne(initialStats);

      const stats: NFTStats = {
        contractAddress: lowerContractAddress,
        tokenId: tokenId,
        viewCount,
        favoriteCount,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingCount,
        watchlistCount
      };

      // Cache the newly created stats
      setCachedStats(lowerContractAddress, tokenId, stats);

      return apiSuccess(stats);
    }

    // Return existing stats from denormalized collection
    // Ensure no negative values (safety guard against data corruption)
    const stats: NFTStats = {
      contractAddress: lowerContractAddress,
      tokenId: tokenId,
      viewCount: Math.max(0, statsDoc.viewCount || 0),
      favoriteCount: Math.max(0, statsDoc.favoriteCount || 0),
      averageRating: Math.max(0, statsDoc.averageRating || 0),
      ratingCount: Math.max(0, statsDoc.ratingCount || 0),
      watchlistCount: Math.max(0, statsDoc.watchlistCount || 0)
    };

    // Cache the stats for future requests
    setCachedStats(lowerContractAddress, tokenId, stats);

    // Log warning if we found negative values (indicates data corruption)
    if (statsDoc.viewCount < 0 || statsDoc.favoriteCount < 0 ||
      statsDoc.watchlistCount < 0 || statsDoc.ratingCount < 0) {
      console.warn('âš ï¸ Found negative stat values for', lowerContractAddress, tokenId,
        'Stats:', statsDoc);
    }

    return apiSuccess(stats);

  } catch (error) {
    console.error('Error fetching NFT stats:', error);

    // Use typed error responses
    if (error instanceof BadRequestError) {
      return apiBadRequest(error.message);
    }

    if (error instanceof InternalError) {
      return apiInternalError(error.message);
    }

    return apiInternalError('Failed to fetch NFT stats');
  }
}

// POST /api/nft/stats - Record NFT view
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (standard for write operations)
    await rateLimit(request, RATE_LIMIT_CONFIG.STANDARD);

    // Parse and validate request body
    const body = await parseJsonBody<{ contractAddress: string; tokenId: string; userId?: string }>(request);
    const { contractAddress, tokenId, userId } = body;

    if (!contractAddress || !tokenId) {
      throw new BadRequestError('contractAddress and tokenId are required');
    }

    if (!isValidAddress(contractAddress)) {
      throw new BadRequestError('Invalid contract address format');
    }
    if (!isValidTokenId(tokenId)) {
      throw new BadRequestError('Invalid token ID format');
    }

    const lowerContractAddress = contractAddress.toLowerCase();
    const timestamp = new Date().toISOString();

    // Invalidate cache when recording a view
    invalidateStatsCache(lowerContractAddress, tokenId);

    const collection = await getCollection('nft_views');

    const viewRecord = {
      contractAddress: lowerContractAddress,
      tokenId: tokenId,
      userId: userId?.toLowerCase(), // Optional - can track anonymous views
      viewedAt: timestamp
    };

    // Insert view record and update stats atomically
    await Promise.all([
      collection.insertOne(viewRecord),
      // Update viewCount in stats collection
      (async () => {
        const statsCollection = await getCollection('nft_stats');
        await statsCollection.updateOne(
          { contractAddress: lowerContractAddress, tokenId },
          {
            $inc: { viewCount: 1 },
            $set: { lastUpdated: timestamp },
            $setOnInsert: {
              contractAddress: lowerContractAddress,
              tokenId,
              favoriteCount: 0,
              watchlistCount: 0,
              averageRating: 0,
              ratingCount: 0,
              createdAt: timestamp
            }
          },
          { upsert: true }
        );
      })()
    ]);

    return apiSuccess({ message: 'View recorded' });

  } catch (error) {
    console.error('Error recording NFT view:', error);

    // Use typed error responses
    if (error instanceof BadRequestError) {
      return apiBadRequest(error.message);
    }

    return apiInternalError('Failed to record view');
  }
}
