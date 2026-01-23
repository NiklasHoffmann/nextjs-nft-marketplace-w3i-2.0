/**
 * Game Score Types for History Towers
 */

export interface GameScore {
    _id?: string;
    score: number;
    level: number;
    platformsClimbed: number;
    playerName?: string;
    walletAddress?: string;
    createdAt: Date;
}

export interface GameScoreSubmission {
    score: number;
    level: number;
    platformsClimbed: number;
    playerName?: string;
    walletAddress?: string;
}

export interface TopScoresResponse {
    success: boolean;
    scores: GameScore[];
    total: number;
}

export interface UserScoresResponse {
    success: boolean;
    scores: GameScore[];
    personalBest?: GameScore;
}

export interface ScoreSubmitResponse {
    success: boolean;
    message: string;
    score?: GameScore;
    isTopScore?: boolean;
    rank?: number;
}
