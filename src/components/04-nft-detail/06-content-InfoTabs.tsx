import { memo, useMemo } from 'react';
import { NFTInfoTabsProps } from '@/types';
import { PublicNFTInsights } from '@/types';
import { UserNFTInteractions } from '@/types';
import { AdminNFTInsight, AdminCollectionInsight, NFTStats } from '@/types';
import { TabNavigation } from './';
import {
    ProjektTab,
    OverviewTab,
    TechnicalTab,
    InvestmentTab,
    MarketInsightsTab,
    PersonalTab,
    FunctionalitiesTab,
    TokenomicsTab
} from './tabs';


// Memoized tab content components for better performance
const MemoizedProjektTab = memo(ProjektTab);
const MemoizedOverviewTab = memo(OverviewTab);
const MemoizedTechnicalTab = memo(TechnicalTab);
const MemoizedInvestmentTab = memo(InvestmentTab);
const MemoizedMarketInsightsTab = memo(MarketInsightsTab);
const MemoizedPersonalTab = memo(PersonalTab);
const MemoizedFunctionalitiesTab = memo(FunctionalitiesTab);
const MemoizedTokenomicsTab = memo(TokenomicsTab);

interface NewNFTInfoTabsProps extends NFTInfoTabsProps {
    // Legacy props (optional for backward compatibility)
    publicInsights?: PublicNFTInsights | null;
    userInteractions?: UserNFTInteractions | null;
    userWalletAddress?: string;
    isWalletConnected?: boolean; // Add wallet connection state
    insightsLoading?: boolean;
    onUpdateUserInteraction?: (data: Partial<UserNFTInteractions>) => Promise<void>;

    // User action handlers
    onToggleFavorite?: () => Promise<void>;
    onToggleWatchlist?: () => Promise<void>;
    onSetRating?: (rating: number) => Promise<void>;

    // Current data structure (flexible - can be AdminNFTInsight or PublicNFTInsights)
    stats?: NFTStats;
    userRating?: number;
    isWatchlisted?: boolean;
    isFavorited?: boolean;
    adminInsights?: AdminNFTInsight | PublicNFTInsights | null; // Accept both types
    collectionInsights?: AdminCollectionInsight | null;
    adminInsightsLoading?: boolean;
}

function NewNFTInfoTabs({
    activeTab,
    onTabChange,
    nftAddress,
    tokenId,
    contractName,
    collection,
    contractSymbol,
    tokenStandard,
    blockchain,
    totalSupply,
    currentOwner,
    creator,
    nftDetails,
    description,
    rarityRank,
    rarityScore,
    attributes,
    supportsRoyalty,
    royaltyInfo,
    publicInsights,
    userInteractions,
    userWalletAddress,
    isWalletConnected = false, // Default to false if not provided
    insightsLoading,
    onUpdateUserInteraction,
    // User action handlers
    onToggleFavorite,
    onToggleWatchlist,
    onSetRating,
    // New clean data structure props
    stats,
    userRating,
    isWatchlisted,
    isFavorited,
    adminInsights,
    collectionInsights,
    adminInsightsLoading
}: NewNFTInfoTabsProps) {

    // Use adminInsights as fallback for publicInsights if not provided
    const effectivePublicInsights = publicInsights || (adminInsights as any);
    const effectiveInsightsLoading = insightsLoading || adminInsightsLoading;

    // Render active tab content only for performance
    const renderActiveTabContent = useMemo(() => {
        switch (activeTab) {
            case 'overview':
                return (
                    <MemoizedOverviewTab
                        nftAddress={nftAddress}
                        tokenId={tokenId}
                        contractName={contractName}
                        collection={collection}
                        contractSymbol={contractSymbol}
                        description={description}
                        price={nftDetails.price}
                        isListed={nftDetails.isListed}
                        seller={nftDetails.seller}
                        rarityRank={rarityRank}
                        rarityScore={rarityScore}
                        attributes={attributes}
                        currentOwner={currentOwner}
                        creator={creator}
                        insights={effectivePublicInsights}
                        totalSupply={totalSupply}
                        blockchain={blockchain}
                        tokenStandard={tokenStandard}
                    />
                );
            case 'technical':
                return (
                    <MemoizedTechnicalTab
                        nftAddress={nftAddress}
                        tokenId={tokenId}
                        contractName={contractName}
                        contractSymbol={contractSymbol}
                        tokenStandard={tokenStandard}
                        blockchain={blockchain}
                        totalSupply={totalSupply}
                        supportsRoyalty={supportsRoyalty}
                        royaltyInfo={royaltyInfo}
                    />
                );
            case 'market-insights':
                return (
                    <MemoizedMarketInsightsTab
                        contractAddress={nftAddress}
                        tokenId={tokenId}
                        publicInsights={effectivePublicInsights}
                        loading={effectiveInsightsLoading}
                    />
                );
            case 'personal':
                // Only render personal tab if wallet is connected
                if (!isWalletConnected) {
                    return (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">Wallet Connection Required</h3>
                                <p className="text-gray-500">Please connect your wallet to access personal features.</p>
                            </div>
                        </div>
                    );
                }
                return (
                    <MemoizedPersonalTab
                        contractAddress={nftAddress}
                        tokenId={tokenId}
                        userInteractions={userInteractions as any} // Type compatibility
                        userWalletAddress={userWalletAddress}
                        loading={effectiveInsightsLoading}
                        onUpdateInteraction={onUpdateUserInteraction as any} // Type compatibility
                        // New direct action props
                        onToggleFavorite={onToggleFavorite}
                        onToggleWatchlist={onToggleWatchlist}
                        onSetRating={onSetRating}
                    />
                );
            case 'investment':
                return (
                    <MemoizedInvestmentTab
                        price={nftDetails.price}
                        isListed={nftDetails.isListed}
                        totalSupply={totalSupply}
                        rarityRank={rarityRank}
                        rarityScore={rarityScore}
                        supportsRoyalty={supportsRoyalty}
                        royaltyInfo={royaltyInfo}
                        insights={effectivePublicInsights}
                        blockchain={blockchain}
                        tokenStandard={tokenStandard}
                    />
                );
            case 'project':
                return (
                    <MemoizedProjektTab
                        adminInsights={adminInsights as AdminNFTInsight || undefined}
                        collectionInsights={collectionInsights || undefined}
                        loading={adminInsightsLoading}
                    />
                );
            case 'functionalities':
                return (
                    <MemoizedFunctionalitiesTab
                        attributes={attributes}
                        blockchain={blockchain}
                        tokenStandard={tokenStandard}
                        supportsRoyalty={supportsRoyalty}
                        royaltyInfo={royaltyInfo}
                    />
                );
            case 'tokenomics':
                return (
                    <MemoizedTokenomicsTab
                        price={nftDetails.price}
                        totalSupply={totalSupply}
                        rarityRank={rarityRank}
                        supportsRoyalty={supportsRoyalty}
                        royaltyInfo={royaltyInfo}
                        tokenStandard={tokenStandard}
                        blockchain={blockchain}
                        currentOwner={currentOwner}
                    />
                );
            default:
                return (
                    <div className="text-center py-12">
                        <p className="text-gray-600">Select a tab to view content</p>
                    </div>
                );
        }
    }, [
        activeTab,
        nftAddress,
        tokenId,
        contractName,
        collection,
        contractSymbol,
        tokenStandard,
        blockchain,
        totalSupply,
        currentOwner,
        creator,
        nftDetails,
        description,
        rarityRank,
        rarityScore,
        attributes,
        supportsRoyalty,
        royaltyInfo,
        effectivePublicInsights,
        userInteractions,
        userWalletAddress,
        effectiveInsightsLoading,
        onUpdateUserInteraction,
        // User action handlers
        onToggleFavorite,
        onToggleWatchlist,
        onSetRating,
        // New clean data structure dependencies
        stats,
        userRating,
        isWatchlisted,
        isFavorited,
        adminInsights,
        collectionInsights,
        adminInsightsLoading
    ]);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Tab Navigation */}
            <TabNavigation
                activeTab={activeTab}
                onTabChange={onTabChange}
                isWalletConnected={isWalletConnected}
            />

            {/* Tab Content */}
            <div className="p-6">
                {renderActiveTabContent}
            </div>
        </div>
    );
}

// Export as NFTInfoTabs for backward compatibility
export default memo(NewNFTInfoTabs);
export { NewNFTInfoTabs as NFTInfoTabs };
