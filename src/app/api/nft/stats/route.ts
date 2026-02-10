import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, getQueryParam, parseJsonBody, isValidAddress, BadRequestError } from '@/lib/api';
import { getCollection } from '@/lib/mongodb';
import {
  getCachedStats,
  setCachedStats,
  invalidateStatsCache
} from '@/lib/cache';

interface NFTStats {
  contractAddress: string; // API response still uses contractAddress for compatibility
  tokenId: string;
  viewCount: number;
  likeCount: number;
  averageRating: number;
  ratingCount: number;
  watchlistCount: number;
  lastViewed?: string;
}

// GET /api/nft/stats - Get NFT statistics
export const GET = apiHandler(async (request: NextRequest) => {
  // Validate and extract parameters
  const contractAddress = getQueryParam(request, 'contractAddress');
  const tokenId = getQueryParam(request, 'tokenId');

  if (!contractAddress || !tokenId) {
    throw new BadRequestError('contractAddress and tokenId are required');
  }

  if (!isValidAddress(contractAddress)) {
    throw new BadRequestError('Invalid contract address format');
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
    console.log(`📊 No stats found for ${lowerContractAddress}/${tokenId}, creating initial stats...`);

    try {
      // Count from user collections (only on first access)
      const [favoritesCollection, watchlistCollection, ratingsCollection, viewsCollection] = await Promise.all([
        getCollection('user_likes'),
        getCollection('user_watchlist'),
        getCollection('user_ratings'),
        getCollection('nft_views')
      ]);

      const [likeCount, watchlistCount, ratings, viewCount] = await Promise.all([
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
        likeCount,
        watchlistCount,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingCount,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      await statsCollection.insertOne(initialStats);
      console.log(`✅ Created initial stats for ${lowerContractAddress}/${tokenId}:`, initialStats);

      const stats: NFTStats = {
        contractAddress: lowerContractAddress,
        tokenId: tokenId,
        viewCount,
        likeCount,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingCount,
        watchlistCount
      };

      // Cache the newly created stats
      setCachedStats(lowerContractAddress, tokenId, stats);

      return apiSuccess(stats);
    } catch (createError) {
      console.error('❌ Error creating initial stats:', createError);
      // Return zero stats instead of failing
      const zeroStats: NFTStats = {
        contractAddress: lowerContractAddress,
        tokenId: tokenId,
        viewCount: 0,
        likeCount: 0,
        averageRating: 0,
        ratingCount: 0,
        watchlistCount: 0
      };
      return apiSuccess(zeroStats);
    }
  }

  // Return existing stats from denormalized collection
  // Ensure no negative values (safety guard against data corruption)
  const stats: NFTStats = {
    contractAddress: lowerContractAddress,
    tokenId: tokenId,
    viewCount: Math.max(0, statsDoc.viewCount || 0),
    likeCount: Math.max(0, statsDoc.likeCount || statsDoc.favoriteCount || 0),
    averageRating: Math.max(0, statsDoc.averageRating || 0),
    ratingCount: Math.max(0, statsDoc.ratingCount || 0),
    watchlistCount: Math.max(0, statsDoc.watchlistCount || 0)
  };

  // Cache the stats for future requests
  setCachedStats(lowerContractAddress, tokenId, stats);

  // Log warning if we found negative values (indicates data corruption)
  if (statsDoc.viewCount < 0 || statsDoc.likeCount < 0 || statsDoc.favoriteCount < 0 ||
    statsDoc.watchlistCount < 0 || statsDoc.ratingCount < 0) {
    console.warn('⚠️ Found negative stat values for', lowerContractAddress, tokenId,
      'Stats:', statsDoc);
  }

  return apiSuccess(stats);
});

// POST /api/nft/stats - Record NFT view
export const POST = apiHandler(async (request: NextRequest) => {
  console.log('📊 POST /api/nft/stats - Recording view...');

  // Parse and validate request body
  const body = await parseJsonBody<{ contractAddress: string; tokenId: string; userId?: string; viewerId?: string }>(request);
  const { contractAddress, tokenId, userId, viewerId: clientViewerId } = body;
  console.log('📝 Request body:', { contractAddress, tokenId, userId });

  if (!contractAddress || !tokenId) {
    throw new BadRequestError('contractAddress and tokenId are required');
  }

  if (!isValidAddress(contractAddress)) {
    throw new BadRequestError('Invalid contract address format');
  }

  const lowerContractAddress = contractAddress.toLowerCase();
  const timestamp = new Date().toISOString();
  const normalizedUserId = userId?.toLowerCase();
  const viewerCookieName = 'nft_viewer_id';
  const existingViewerId = request.cookies.get(viewerCookieName)?.value || null;
  let viewerId = clientViewerId || existingViewerId;
  let shouldSetViewerCookie = false;

  if (!normalizedUserId && !viewerId) {
    viewerId = crypto.randomUUID();
    shouldSetViewerCookie = true;
  }
  console.log('✅ Validation passed, recording view for:', lowerContractAddress, tokenId);

  // Invalidate cache when recording a view
  invalidateStatsCache(lowerContractAddress, tokenId);

  console.log('🔌 Getting nft_views collection...');
  const collection = await getCollection('nft_views');

  const viewRecord = {
    contractAddress: lowerContractAddress,
    tokenId: tokenId,
    userId: normalizedUserId || null,
    viewerId: viewerId || null,
    viewedAt: timestamp
  };

  console.log('💾 Inserting view record and updating stats...');
  let shouldIncrement = true;

  if (normalizedUserId) {
    const existingUserView = await collection.findOne({
      contractAddress: lowerContractAddress,
      tokenId,
      userId: normalizedUserId
    });

    if (existingUserView) {
      shouldIncrement = false;
    } else if (viewerId) {
      const existingViewerView = await collection.findOne({
        contractAddress: lowerContractAddress,
        tokenId,
        viewerId
      });

      if (existingViewerView) {
        await collection.updateOne(
          { _id: existingViewerView._id },
          { $set: { userId: normalizedUserId } }
        );
        shouldIncrement = false;
      } else {
        await collection.insertOne(viewRecord);
      }
    } else {
      await collection.insertOne(viewRecord);
    }
  } else if (viewerId) {
    const existingViewerView = await collection.findOne({
      contractAddress: lowerContractAddress,
      tokenId,
      viewerId
    });

    if (existingViewerView) {
      shouldIncrement = false;
    } else {
      await collection.insertOne(viewRecord);
    }
  }

  if (shouldIncrement) {
    console.log('📈 Getting nft_stats collection...');
    const statsCollection = await getCollection('nft_stats');
    console.log('⬆️  Updating viewCount...');
    await statsCollection.updateOne(
      { contractAddress: lowerContractAddress, tokenId },
      {
        $inc: { viewCount: 1 },
        $set: { lastUpdated: timestamp },
        $setOnInsert: {
          contractAddress: lowerContractAddress,
          tokenId,
          likeCount: 0,
          watchlistCount: 0,
          averageRating: 0,
          ratingCount: 0,
          createdAt: timestamp
        }
      },
      { upsert: true }
    );
    console.log('✅ Stats updated successfully');
  }

  const statsCollection = await getCollection('nft_stats');
  const updatedStats = await statsCollection.findOne({
    contractAddress: lowerContractAddress,
    tokenId
  });

  console.log('🎉 View recorded successfully');
  const response = apiSuccess({
    message: shouldIncrement ? 'View recorded' : 'View already recorded',
    stats: updatedStats ? {
      viewCount: updatedStats.viewCount || 0,
      likeCount: updatedStats.likeCount || 0,
      watchlistCount: updatedStats.watchlistCount || 0,
      averageRating: updatedStats.averageRating || 0,
      ratingCount: updatedStats.ratingCount || 0,
      lastUpdated: updatedStats.lastUpdated
    } : null
  });

  if (shouldSetViewerCookie && viewerId) {
    response.cookies.set(viewerCookieName, viewerId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });
  }

  return response;
});
