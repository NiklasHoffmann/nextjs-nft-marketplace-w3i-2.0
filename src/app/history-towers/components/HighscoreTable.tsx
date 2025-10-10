'use client';

import { useState, useEffect } from 'react';
import type { GameScore, TopScoresResponse } from '@/types/game';

interface HighscoreTableProps {
    walletAddress?: string;
    refreshTrigger?: number;
}

type FilterType = 'all-time' | 'week' | 'my-scores';

export default function HighscoreTable({ walletAddress, refreshTrigger }: HighscoreTableProps) {
    const [scores, setScores] = useState<GameScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<FilterType>('all-time');

    const fetchScores = async (showLoader = false) => {
        if (showLoader) {
            setLoading(true);
        } else {
            setIsRefreshing(true);
        }
        setError('');

        try {
            let url = '/api/game/scores';

            if (filter === 'week') {
                url += '?type=week';
            } else if (filter === 'my-scores' && walletAddress) {
                url += `?type=user&address=${walletAddress}`;
            }

            // Verhindere Browser-Caching mit cache: 'no-store'
            const response = await fetch(url, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            const data: TopScoresResponse = await response.json();

            if (!data.success) {
                setError('Failed to load scores');
                return;
            }

            setScores(data.scores);
        } catch (err) {
            setError('Network error');
            console.error('Error fetching scores:', err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        // Nur beim ersten Laden den vollen Loader zeigen
        fetchScores(loading);
    }, [filter, walletAddress, refreshTrigger]);

    const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getDisplayName = (score: GameScore) => {
        if (score.playerName) return score.playerName;
        if (score.walletAddress) return formatAddress(score.walletAddress);
        return 'Anonymous';
    };

    const isOwnScore = (score: GameScore) => {
        return walletAddress && score.walletAddress === walletAddress;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 bg-gray-100 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center text-red-600">
                    <p className="text-lg font-semibold">⚠️ {error}</p>
                    <button
                        onClick={() => fetchScores(true)}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Header with Filters */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">🏆 Leaderboard</h2>
                    <button
                        onClick={() => fetchScores(false)}
                        disabled={loading || isRefreshing}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                        title="Aktualisieren"
                    >
                        <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setFilter('all-time')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'all-time'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        All Time
                    </button>
                    <button
                        onClick={() => setFilter('week')}
                        className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'week'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Letzte 7 Tage
                    </button>
                    {walletAddress && (
                        <button
                            onClick={() => setFilter('my-scores')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${filter === 'my-scores'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            My Scores
                        </button>
                    )}
                </div>
            </div>

            {/* Scores List */}
            {scores.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">
                        {filter === 'week' && '📅 Keine Scores in den letzten 7 Tagen'}
                        {filter === 'my-scores' && '🎮 Du hast noch keine Scores'}
                        {filter === 'all-time' && '🎮 Noch keine Scores. Sei der Erste!'}
                    </p>
                    <p className="text-sm">
                        {filter !== 'all-time' && 'Spiele eine Runde und speichere deinen Score!'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Desktop: Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Rank</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Player</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Score</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Level</th>
                                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scores.map((score, index) => (
                                    <tr
                                        key={score._id}
                                        className={`border-b border-gray-100 transition ${isOwnScore(score)
                                            ? 'bg-blue-50 font-semibold'
                                            : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <td className="px-4 py-4">
                                            <div className="flex items-center">
                                                {index === 0 && <span className="text-2xl mr-2">🥇</span>}
                                                {index === 1 && <span className="text-2xl mr-2">🥈</span>}
                                                {index === 2 && <span className="text-2xl mr-2">🥉</span>}
                                                <span className="text-lg">{index + 1}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <span>{getDisplayName(score)}</span>
                                                {isOwnScore(score) && (
                                                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">You</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono font-semibold text-lg">
                                            {score.score.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-semibold">
                                                {score.level}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right text-sm text-gray-600">
                                            {formatDate(score.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile: Card View */}
                    <div className="md:hidden space-y-3">
                        {scores.map((score, index) => (
                            <div
                                key={score._id}
                                className={`rounded-lg p-4 ${isOwnScore(score)
                                    ? 'bg-blue-50 border-2 border-blue-500'
                                    : 'bg-gray-50 border border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {index === 0 && <span className="text-2xl">🥇</span>}
                                        {index === 1 && <span className="text-2xl">🥈</span>}
                                        {index === 2 && <span className="text-2xl">🥉</span>}
                                        <span className="text-lg font-bold">#{index + 1}</span>
                                    </div>
                                    {isOwnScore(score) && (
                                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">You</span>
                                    )}
                                </div>

                                <div className="mb-2">
                                    <p className="font-semibold text-gray-800">{getDisplayName(score)}</p>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-2xl font-bold font-mono">{score.score.toLocaleString()}</p>
                                        <p className="text-sm text-gray-600">Level {score.level}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">{formatDate(score.createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
