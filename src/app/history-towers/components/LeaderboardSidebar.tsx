'use client';

import { useState } from 'react';
import HighscoreTable from './HighscoreTable';

interface LeaderboardSidebarProps {
    walletAddress?: string;
    refreshTrigger: number;
    isGameActive: boolean;
}

export default function LeaderboardSidebar({
    walletAddress,
    refreshTrigger,
    isGameActive
}: LeaderboardSidebarProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className={`h-full transition-all duration-300 ${isGameActive ? 'blur-sm opacity-50' : ''}`}>
            <div className="h-full bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full flex items-center justify-between hover:bg-gray-50 rounded-xl p-3 transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-3xl">🏆</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
                        </div>
                        <svg
                            className={`w-6 h-6 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''
                                }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {/* Expanded State with Internal Scroll */}
                {isExpanded && (
                    <div className="flex-1 overflow-y-auto p-4 min-h-0" style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#CBD5E1 #F1F5F9'
                    }}>
                        <HighscoreTable
                            walletAddress={walletAddress}
                            refreshTrigger={refreshTrigger}
                        />
                    </div>
                )}

                {/* Collapsed State */}
                {!isExpanded && (
                    <div className="p-6 text-center">
                        <p className="text-base text-gray-500">Klicke zum Öffnen</p>
                    </div>
                )}
            </div>
        </div>
    );
}
