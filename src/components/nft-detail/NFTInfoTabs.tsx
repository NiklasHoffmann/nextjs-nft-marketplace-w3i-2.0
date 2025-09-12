import { memo, useMemo } from 'react';
import NFTTabNavigation from './NFTTabNavigation';
import ProjectTab from './tabs/ProjectTab';
import FunctionalitiesTab from './tabs/FunctionalitiesTab';
import TokenomicsTab from './tabs/TokenomicsTab';
import { NFTInfoTabsProps } from '@/types/nft-detail';

// Memoized tab content components for better performance
const MemoizedProjectTab = memo(ProjectTab);
const MemoizedFunctionalitiesTab = memo(FunctionalitiesTab);
const MemoizedTokenomicsTab = memo(TokenomicsTab);

function NFTInfoTabs({
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
    royaltyInfo
}: NFTInfoTabsProps) {
    // Memoize props objects to prevent unnecessary re-renders
    const projectTabProps = useMemo(() => ({
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
        seller: nftDetails.seller,
        description,
        rarityRank,
        rarityScore,
        attributes
    }), [
        nftAddress, tokenId, contractName, collection, contractSymbol,
        tokenStandard, blockchain, totalSupply, currentOwner, creator,
        nftDetails.seller, description, rarityRank, rarityScore, attributes
    ]);

    const functionalitiesTabProps = useMemo(() => ({
        attributes,
        blockchain,
        tokenStandard,
        supportsRoyalty,
        royaltyInfo
    }), [attributes, blockchain, tokenStandard, supportsRoyalty, royaltyInfo]);

    const tokenomicsTabProps = useMemo(() => ({
        price: nftDetails.price,
        totalSupply,
        rarityRank,
        supportsRoyalty,
        royaltyInfo,
        tokenStandard,
        blockchain,
        currentOwner
    }), [
        nftDetails.price, totalSupply, rarityRank, supportsRoyalty,
        royaltyInfo, tokenStandard, blockchain, currentOwner
    ]);

    // Render active tab content only for performance
    const renderActiveTabContent = useMemo(() => {
        switch (activeTab) {
            case 'project':
                return <MemoizedProjectTab {...projectTabProps} />;
            case 'functionalities':
                return <MemoizedFunctionalitiesTab {...functionalitiesTabProps} />;
            case 'tokenomics':
                return <MemoizedTokenomicsTab {...tokenomicsTabProps} />;
            default:
                return null;
        }
    }, [activeTab, projectTabProps, functionalitiesTabProps, tokenomicsTabProps]);

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <NFTTabNavigation activeTab={activeTab} onTabChange={onTabChange} />

            <div className="p-6">
                {renderActiveTabContent}
            </div>
        </div>
    );
}

export default memo(NFTInfoTabs);