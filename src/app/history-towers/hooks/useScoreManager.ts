/**
 * useScoreManager Hook
 * 
 * Verwaltet Score-Tracking, API-Calls und Highscore-Management
 */

import { useState, useCallback, useEffect } from 'react';
import type { ScoreSubmitResponse } from '../types';
import { API } from '../constants';

interface ScoreManagerOptions {
    walletAddress?: string;
}

export function useScoreManager({ walletAddress }: ScoreManagerOptions = {}) {
    const [bestScore, setBestScore] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    /**
     * Fetch Personal Best Score
     */
    const fetchPersonalBest = useCallback(async () => {
        try {
            let url = `${API.getScores}?type=top&limit=1`;
            
            if (walletAddress) {
                url = `${API.getScores}?type=user&address=${walletAddress}&limit=1`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data.success && data.scores && data.scores.length > 0) {
                setBestScore(data.scores[0].score);
            } else {
                setBestScore(0);
            }
        } catch (error) {
            console.error('Error fetching personal best:', error);
            setBestScore(0);
        }
    }, [walletAddress]);

    /**
     * Submit Score to API
     */
    const submitScore = useCallback(async (
        score: number,
        level: number,
        platformsClimbed: number,
        maxCombo: number = 0
    ): Promise<ScoreSubmitResponse> => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const response = await fetch(API.submitScore, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    walletAddress,
                    score,
                    level,
                    platformsClimbed,
                    maxCombo,
                    timestamp: new Date().toISOString(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit score');
            }

            // Update best score if this is higher
            if (score > bestScore) {
                setBestScore(score);
            }

            return {
                success: true,
                isTopScore: data.isTopScore || false,
                rank: data.rank,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            setSubmitError(message);
            console.error('Error submitting score:', error);
            
            return {
                success: false,
                isTopScore: false,
                message,
            };
        } finally {
            setIsSubmitting(false);
        }
    }, [walletAddress, bestScore]);

    /**
     * Check if score is a new personal best
     */
    const isNewPersonalBest = useCallback((score: number): boolean => {
        return score > bestScore;
    }, [bestScore]);

    /**
     * Get rank text based on score
     */
    const getRankText = useCallback((score: number): string => {
        if (score >= 100000) return 'Legendary';
        if (score >= 50000) return 'Master';
        if (score >= 25000) return 'Expert';
        if (score >= 10000) return 'Advanced';
        if (score >= 5000) return 'Intermediate';
        if (score >= 1000) return 'Beginner';
        return 'Novice';
    }, []);

    /**
     * Format score for display
     */
    const formatScore = useCallback((score: number): string => {
        return score.toLocaleString('de-DE');
    }, []);

    /**
     * Load best score on mount and wallet change
     */
    useEffect(() => {
        fetchPersonalBest();
    }, [fetchPersonalBest]);

    return {
        bestScore,
        isSubmitting,
        submitError,
        submitScore,
        fetchPersonalBest,
        isNewPersonalBest,
        getRankText,
        formatScore,
    };
}
