'use client';

import { useState, useEffect } from 'react';
import HighscoreTable from './HighscoreTable';

interface LeaderboardModalProps {
    walletAddress?: string;
    refreshTrigger: number;
}

export default function LeaderboardModal({ walletAddress, refreshTrigger }: LeaderboardModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Listen for custom event from game component
    useEffect(() => {
        const handleOpenLeaderboard = () => setIsOpen(true);
        window.addEventListener('openLeaderboard', handleOpenLeaderboard);
        return () => window.removeEventListener('openLeaderboard', handleOpenLeaderboard);
    }, []);

    return (
        <>
            {/* Modal Overlay - nur angezeigt wenn geöffnet */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setIsOpen(false)}
                >
                    {/* Modal Content */}
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-3xl">🏆</span>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
                                        <p className="text-sm text-gray-600">Top Spieler & Highscores</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 min-h-0" style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#CBD5E1 #F1F5F9'
                        }}>
                            <HighscoreTable
                                walletAddress={walletAddress}
                                refreshTrigger={refreshTrigger}
                            />
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0 rounded-b-2xl">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all"
                            >
                                Schließen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
