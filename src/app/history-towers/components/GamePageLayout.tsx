'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import HistoryJumperV2 from './HistoryJumperV2';
import MarketplaceInfo from './MarketplaceInfo';
import LeaderboardSidebar from './LeaderboardSidebar';

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

            {/* Mobile/Tablet: Game Only */}
            <div className="xl:hidden h-full">
                <HistoryJumperV2
                    onGameStateChange={setIsGameActive}
                    onLeaderboardRefresh={setLeaderboardRefresh}
                />
            </div>
        </>
    );
}
