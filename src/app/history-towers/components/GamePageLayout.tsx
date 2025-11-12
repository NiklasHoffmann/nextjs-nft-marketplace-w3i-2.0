'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import HistoryJumperV2 from './HistoryJumperV2';
import MarketplaceInfo from './MarketplaceInfo';
import MarketplaceDropdown from './MarketplaceDropdown';
import LeaderboardSidebar from './LeaderboardSidebar';
import LeaderboardModal from './LeaderboardModal';

export default function GamePageLayout() {
    const { address } = useAccount();
    const [isGameActive, setIsGameActive] = useState(false);
    const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);

    return (
        <>
            {/* Desktop Layout: 3 Equal Columns with Fixed Height */}
            <div className="hidden xl:block h-full">
                <div className="h-full grid grid-cols-3 gap-6 px-4 sm:px-6 lg:px-8 py-4">
                    {/* Left: Marketplace Info */}
                    <div className="h-full min-h-0">
                        <MarketplaceInfo isGameActive={isGameActive} />
                    </div>

                    {/* Center: Game */}
                    <div className="h-full min-h-0 flex items-center justify-center">
                        <HistoryJumperV2
                            onGameStateChange={setIsGameActive}
                            onLeaderboardRefresh={setLeaderboardRefresh}
                        />
                    </div>

                    {/* Right: Leaderboard */}
                    <div className="h-full min-h-0">
                        <LeaderboardSidebar
                            isGameActive={isGameActive}
                            walletAddress={address}
                            refreshTrigger={leaderboardRefresh}
                        />
                    </div>
                </div>
            </div>

            {/* Tablet/Mobile Layout: Stacked with Dropdown & Modal */}
            <div className="xl:hidden h-full flex flex-col relative">
                {/* Game - Takes Full Space */}
                <div className="flex-1 min-h-0">
                    <HistoryJumperV2
                        onGameStateChange={setIsGameActive}
                        onLeaderboardRefresh={setLeaderboardRefresh}
                    />
                </div>

                {/* Marketplace Dropdown (als Overlay über dem Spiel) */}
                {!isGameActive && (
                    <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4 pb-2">
                        <MarketplaceDropdown isGameActive={isGameActive} />
                    </div>
                )}

                {/* Leaderboard Modal - nur Modal ohne Floating Button */}
                <LeaderboardModal
                    walletAddress={address}
                    refreshTrigger={leaderboardRefresh}
                />
            </div>
        </>
    );
}
