import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, parseJsonBody, getQueryParam, BadRequestError } from '@/lib/api';
import { getCollection } from '@/lib/mongodb';
import type { GameScore, GameScoreSubmission, ScoreSubmitResponse, TopScoresResponse } from '@/types/game';

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, number[]>();
const MAX_SUBMISSIONS_PER_HOUR = 10;
const MAX_SCORE = 10000000; // Maximum realistic score
const MIN_SCORE = 0;

// Helper: Check rate limit
function checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    const timestamps = rateLimitMap.get(identifier) || [];
    const recentTimestamps = timestamps.filter(ts => ts > hourAgo);

    if (recentTimestamps.length >= MAX_SUBMISSIONS_PER_HOUR) {
        return false;
    }

    recentTimestamps.push(now);
    rateLimitMap.set(identifier, recentTimestamps);
    return true;
}

// Helper: Validate score data
function validateScoreData(data: GameScoreSubmission): { valid: boolean; error?: string } {
    // Must have either playerName or walletAddress
    if (!data.playerName && !data.walletAddress) {
        return { valid: false, error: 'Either playerName or walletAddress is required' };
    }

    // Validate score range
    if (data.score < MIN_SCORE || data.score > MAX_SCORE) {
        return { valid: false, error: `Score must be between ${MIN_SCORE} and ${MAX_SCORE}` };
    }

    // Validate level
    if (data.level < 1 || data.level > 1000) {
        return { valid: false, error: 'Invalid level' };
    }

    // Validate platformsClimbed
    if (data.platformsClimbed < 0 || data.platformsClimbed > 100000) {
        return { valid: false, error: 'Invalid platformsClimbed' };
    }

    // Plausibility check: score should correlate with level and platforms
    const expectedMinScore = data.platformsClimbed * 5; // Rough estimate
    if (data.score < expectedMinScore * 0.5) {
        return { valid: false, error: 'Score seems implausibly low for the progress made' };
    }

    // Validate playerName length if provided
    if (data.playerName && data.playerName.length > 20) {
        return { valid: false, error: 'Player name must be 20 characters or less' };
    }

    // Validate wallet address format if provided
    if (data.walletAddress && !data.walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return { valid: false, error: 'Invalid wallet address format' };
    }

    return { valid: true };
}

// POST /api/game/scores - Submit a new score
export const POST = apiHandler(async (request: NextRequest) => {
    const body = await parseJsonBody<GameScoreSubmission>(request);

    // Get identifier for rate limiting (IP or wallet address)
    const identifier = body.walletAddress ||
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';

    // Check rate limit
    if (!checkRateLimit(identifier)) {
        throw new BadRequestError(`Rate limit exceeded. Maximum ${MAX_SUBMISSIONS_PER_HOUR} submissions per hour.`);
    }

    // Validate data
    const validation = validateScoreData(body);
    if (!validation.valid) {
        throw new BadRequestError(validation.error || 'Invalid score data');
    }

    // Prepare score document
    const scoreDocument: Omit<GameScore, '_id'> = {
        score: body.score,
        level: body.level,
        platformsClimbed: body.platformsClimbed,
        playerName: body.playerName,
        walletAddress: body.walletAddress,
        createdAt: new Date(),
    };

    // Insert into database
    const collection = await getCollection('game_scores');
    const result = await collection.insertOne(scoreDocument);

    // Check if this is a top score (top 10)
    const topScores = await collection
        .find()
        .sort({ score: -1 })
        .limit(10)
        .toArray() as unknown as GameScore[];

    const isTopScore = topScores.some(score =>
        score._id?.toString() === result.insertedId.toString()
    );

    const rank = isTopScore
        ? topScores.findIndex(score => score._id?.toString() === result.insertedId.toString()) + 1
        : undefined;

    return apiSuccess({
        message: isTopScore
            ? `Congratulations! You achieved rank #${rank} on the leaderboard!`
            : 'Score submitted successfully!',
        score: { ...scoreDocument, _id: result.insertedId.toString() },
        isTopScore,
        rank,
    });
});

// GET /api/game/scores - Get top scores or user scores
export const GET = apiHandler(async (request: NextRequest) => {
    const type = getQueryParam(request, 'type') || 'top';
    const walletAddress = getQueryParam(request, 'address');
    const limit = parseInt(getQueryParam(request, 'limit') || '10');

    const collection = await getCollection('game_scores');

    if (type === 'user' && walletAddress) {
        const scores = await collection
            .find({ walletAddress })
            .sort({ score: -1 })
            .limit(20)
            .toArray() as unknown as GameScore[];

        return apiSuccess({
            scores,
            personalBest: scores[0] || undefined,
        });
    }

    if (type === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const scores = await collection
            .find({ createdAt: { $gte: weekAgo } })
            .sort({ score: -1 })
            .limit(limit)
            .toArray() as unknown as GameScore[];

        const total = await collection.countDocuments({ createdAt: { $gte: weekAgo } });

        return apiSuccess({ scores, total });
    }

    // Default: top scores all-time
    const scores = await collection
        .find()
        .sort({ score: -1 })
        .limit(limit)
        .toArray() as unknown as GameScore[];

    const total = await collection.countDocuments();

    return apiSuccess({ scores, total });
});
