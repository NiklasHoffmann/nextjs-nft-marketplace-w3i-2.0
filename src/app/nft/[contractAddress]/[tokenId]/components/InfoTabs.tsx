import { memo, useMemo } from 'react';
import { NFTInfoTabsProps, PublicNFTInsights, UserNFTInteractions, AdminNFTInsight, AdminCollectionInsight, NFTStats } from '@/types';
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

const MemoizedProjektTab = memo(ProjektTab);
const MemoizedOverviewTab = memo(OverviewTab);
const MemoizedTechnicalTab = memo(TechnicalTab);
const MemoizedInvestmentTab = memo(InvestmentTab);
const MemoizedMarketInsightsTab = memo(MarketInsightsTab);
const MemoizedPersonalTab = memo(PersonalTab);
const MemoizedFunctionalitiesTab = memo(FunctionalitiesTab);
const MemoizedTokenomicsTab = memo(TokenomicsTab);

interface NewNFTInfoTabsProps extends NFTInfoTabsProps {
    publicInsights?: PublicNFTInsights | null;
    userInteractions?: UserNFTInteractions | null;
    userWalletAddress?: string;
    isWalletConnected?: boolean;
    insightsLoading?: boolean;
    onUpdateUserInteraction?: (data: Partial<UserNFTInteractions>) => Promise<void>;
    onToggleFavorite?: () => Promise<void>;
    onToggleWatchlist?: () => Promise<void>;
    onSetRating?: (rating: number) => Promise<void>;
    stats?: NFTStats;
    userRating?: number;
    isWatchlisted?: boolean;
    isFavorited?: boolean;
    adminInsights?: AdminNFTInsight | PublicNFTInsights | null;
    collectionInsights?: AdminCollectionInsight | null;
    adminInsightsLoading?: boolean;
    isValid?: boolean;
    invalidReasons?: string[] | null;
    invalidatedAt?: Date | null;
    ownerBalance?: number | null;
    approved?: string | null;
    isApprovedForAll?: boolean;
    tokenURI?: string | null;
}

function NewNFTInfoTabs({
    activeTab,
    onTabChange,
    contractAddress,
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
    isWalletConnected = false,
    insightsLoading,
    onUpdateUserInteraction,
    onToggleFavorite,
    onToggleWatchlist,
    onSetRating,
    stats: _stats,
    userRating: _userRating,
    isWatchlisted: _isWatchlisted,
    isFavorited: _isFavorited,
    adminInsights,
    collectionInsights,
    adminInsightsLoading,
    isValid,
    invalidReasons,
    invalidatedAt,
    ownerBalance,
    approved,
    isApprovedForAll,
    tokenURI
}: NewNFTInfoTabsProps) {
    const effectivePublicInsights = publicInsights || (adminInsights as any);
    const effectiveInsightsLoading = insightsLoading || adminInsightsLoading;

    const renderActiveTabContent = useMemo(() => {
        switch (activeTab) {
            case 'overview':
                return (
                    <MemoizedOverviewTab
                        contractAddress={contractAddress}
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
                        isValid={isValid}
                        invalidReasons={invalidReasons}
                        invalidatedAt={invalidatedAt}
                        nftDetails={nftDetails}
                    />
                );
            case 'technical':
                return (
                    <MemoizedTechnicalTab
                        contractAddress={contractAddress}
                        tokenId={tokenId}
                        contractName={contractName}
                        contractSymbol={contractSymbol}
                        tokenStandard={tokenStandard}
                        blockchain={blockchain}
                        totalSupply={totalSupply}
                        currentOwner={currentOwner}
                        creator={creator}
                        attributes={attributes}
                        supportsRoyalty={supportsRoyalty}
                        royaltyInfo={royaltyInfo}
                        rarityRank={rarityRank}
                        rarityScore={rarityScore}
                        ownerBalance={ownerBalance}
                        approved={approved}
                        isApprovedForAll={isApprovedForAll}
                        tokenURI={tokenURI}
                    />
                );
            case 'market-insights':
                return (
                    <MemoizedMarketInsightsTab
                        contractAddress={contractAddress}
                        tokenId={tokenId}
                        publicInsights={effectivePublicInsights}
                        loading={effectiveInsightsLoading}
                    />
                );
            case 'personal':
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
                        contractAddress={contractAddress}
                        tokenId={tokenId}
                        userInteractions={userInteractions as any}
                        userWalletAddress={userWalletAddress}
                        loading={effectiveInsightsLoading}
                        onUpdateInteraction={onUpdateUserInteraction as any}
                        onToggleFavorite={onToggleFavorite}
                        onToggleWatchlist={onToggleWatchlist}
                        onSetRating={onSetRating}
                    />
                );
            case 'investment':
                return (
                    <MemoizedInvestmentTab
                        price={nftDetails.price}
                        currency={nftDetails.currency}
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
                        adminInsights={adminInsights as AdminNFTInsight || undefined}
                        collectionInsights={collectionInsights || undefined}
                        loading={adminInsightsLoading}
                    />
                );
            case 'tokenomics':
                return (
                    <MemoizedTokenomicsTab
                        price={nftDetails.price}
                        currency={nftDetails.currency}
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
        contractAddress,
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
        isWalletConnected,
        effectiveInsightsLoading,
        onUpdateUserInteraction,
        onToggleFavorite,
        onToggleWatchlist,
        onSetRating,
        adminInsights,
        collectionInsights,
        adminInsightsLoading,
        isValid,
        invalidReasons,
        invalidatedAt,
        ownerBalance,
        approved,
        isApprovedForAll,
        tokenURI
    ]);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <TabNavigation
                activeTab={activeTab}
                onTabChange={onTabChange}
                isWalletConnected={isWalletConnected}
            />
            <div className="p-6">
                {renderActiveTabContent}
            </div>
        </div>
    );
}

export default memo(NewNFTInfoTabs);
export { NewNFTInfoTabs as NFTInfoTabs };
