/**
 * Leaderboard Modal (REFACTORED)
 * 
 * Uses BaseModal for consistent modal behavior.
 * Migrated from custom modal implementation.
 * 
 * ✅ Reduced from ~90 lines to ~60 lines (30 lines saved)
 * ✅ Eliminated duplicate modal infrastructure
 * ✅ Consistent with other modals (BuyNow, Cancel, Update)
 */
'use client';

import { useState, useEffect } from 'react';
import { BaseModal } from '@/components/core/Modal';
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
        <BaseModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title={
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-3xl">🏆</span>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">Leaderboard</div>
                        <p className="text-sm text-gray-600">Top Spieler & Highscores</p>
                    </div>
                </div>
            }
            size="lg"
            footer={
                <button
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all"
                >
                    Schließen
                </button>
            }
        >
            <HighscoreTable
                walletAddress={walletAddress}
                refreshTrigger={refreshTrigger}
            />
        </BaseModal>
    );
}
