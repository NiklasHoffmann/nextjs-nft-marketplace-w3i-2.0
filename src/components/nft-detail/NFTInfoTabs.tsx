import NFTTabNavigation from './NFTTabNavigation';
import ProjectTab from './tabs/ProjectTab';
import FunctionalitiesTab from './tabs/FunctionalitiesTab';
import TokenomicsTab from './tabs/TokenomicsTab';

type TabType = 'project' | 'functionalities' | 'tokenomics';

interface NFTAttribute {
    trait_type: string;
    value: string | number;
    display_type?: string;
    max_value?: number;
}

interface NFTDetails {
    price: string;
    seller: string;
}

interface RoyaltyInfo {
    percentage?: number | null;
    receiver?: string;
    amount?: string;
}

interface NFTInfoTabsProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    nftAddress: string;
    tokenId: string;
    contractName?: string | null;
    collection?: string | null;
    contractSymbol?: string | null;
    tokenStandard: string;
    blockchain: string;
    totalSupply?: number | null;
    currentOwner?: string | null;
    creator?: string | null;
    nftDetails: NFTDetails;
    description?: string | null;
    rarityRank?: number | null;
    rarityScore?: number | null;
    attributes?: NFTAttribute[] | null;
    supportsRoyalty: boolean;
    royaltyInfo?: RoyaltyInfo | null;
}

export default function NFTInfoTabs({
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
    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <NFTTabNavigation activeTab={activeTab} onTabChange={onTabChange} />
            
            <div className="p-6">
                {activeTab === 'project' && (
                    <ProjectTab
                        nftAddress={nftAddress}
                        tokenId={tokenId}
                        contractName={contractName}
                        collection={collection}
                        contractSymbol={contractSymbol}
                        tokenStandard={tokenStandard}
                        blockchain={blockchain}
                        totalSupply={totalSupply}
                        currentOwner={currentOwner}
                        creator={creator}
                        seller={nftDetails.seller}
                        description={description}
                        rarityRank={rarityRank}
                        rarityScore={rarityScore}
                        attributes={attributes}
                    />
                )}

                {activeTab === 'functionalities' && (
                    <FunctionalitiesTab
                        attributes={attributes}
                        blockchain={blockchain}
                        tokenStandard={tokenStandard}
                        supportsRoyalty={supportsRoyalty}
                        royaltyInfo={royaltyInfo}
                    />
                )}

                {activeTab === 'tokenomics' && (
                    <TokenomicsTab
                        price={nftDetails.price}
                        totalSupply={totalSupply}
                        rarityRank={rarityRank}
                        supportsRoyalty={supportsRoyalty}
                        royaltyInfo={royaltyInfo}
                        tokenStandard={tokenStandard}
                        blockchain={blockchain}
                        currentOwner={currentOwner}
                    />
                )}
            </div>
        </div>
    );
}