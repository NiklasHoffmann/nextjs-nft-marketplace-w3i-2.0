'use client';

import { useState, useEffect } from 'react';
import type { GameScoreSubmission, ScoreSubmitResponse } from '@/types/game';

interface HighscoreDialogProps {
    score: number;
    level: number;
    platformsClimbed: number;
    walletAddress?: string;
    onClose: () => void;
    onSubmitSuccess?: (response: ScoreSubmitResponse) => void;
}

export default function HighscoreDialog({
    score,
    level,
    platformsClimbed,
    walletAddress,
    onClose,
    onSubmitSuccess,
}: HighscoreDialogProps) {
    const [playerName, setPlayerName] = useState('');
    const [includeWallet, setIncludeWallet] = useState(!!walletAddress);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Update includeWallet wenn sich walletAddress ändert
    useEffect(() => {
        setIncludeWallet(!!walletAddress);
    }, [walletAddress]);

    const handleSubmit = async () => {
        // Validation
        if (!playerName && !includeWallet) {
            setError('Please enter a name or check "Include Wallet Address"');
            return;
        }

        if (playerName && playerName.length > 20) {
            setError('Name must be 20 characters or less');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            const submission: GameScoreSubmission = {
                score,
                level,
                platformsClimbed,
                playerName: playerName.trim() || undefined,
                walletAddress: includeWallet ? walletAddress : undefined,
            };

            const response = await fetch('/api/game/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submission),
            });

            const data: ScoreSubmitResponse = await response.json();

            if (!data.success) {
                setError(data.message || 'Failed to submit score');
                return;
            }

            setSuccess(true);
            onSubmitSuccess?.(data);

            // Close after showing success message
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err) {
            setError('Network error. Please try again.');
            console.error('Score submission error:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    if (success) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 text-center">
                    <div className="text-6xl mb-4">ðŸŽ‰</div>
                    <h2 className="text-2xl font-bold text-green-600 mb-2">Score Saved!</h2>
                    <p className="text-gray-600">Your achievement has been recorded!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
                <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
                    Game Over!
                </h2>

                {/* Score Summary */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-sm opacity-90">Score</p>
                            <p className="text-3xl font-bold">{score.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm opacity-90">Level</p>
                            <p className="text-3xl font-bold">{level}</p>
                        </div>
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-sm opacity-90">Platforms Climbed</p>
                        <p className="text-xl font-semibold">{platformsClimbed}</p>
                    </div>
                </div>

                {/* Input Form */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
                            Your Name (optional)
                        </label>
                        <input
                            id="playerName"
                            type="text"
                            maxLength={20}
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Enter your name..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">{playerName.length}/20 characters</p>
                    </div>

                    {walletAddress && (
                        <div className="flex items-center">
                            <input
                                id="includeWallet"
                                type="checkbox"
                                checked={includeWallet}
                                onChange={(e) => setIncludeWallet(e.target.checked)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="includeWallet" className="ml-2 text-sm text-gray-700">
                                Save with wallet address
                            </label>
                        </div>
                    )}

                    {walletAddress && includeWallet && (
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 font-mono">
                            ✓ Wallet: {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                        </div>
                    )}

                    {!walletAddress && (
                        <p className="text-sm text-gray-500 italic">
                            ðŸ’¡ Connect your wallet to verify your scores
                        </p>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleSkip}
                        disabled={isSubmitting}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        Skip
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || (!playerName && !includeWallet)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                        {isSubmitting ? 'Saving...' : 'Save Score'}
                    </button>
                </div>
            </div>
        </div>
    );
}
