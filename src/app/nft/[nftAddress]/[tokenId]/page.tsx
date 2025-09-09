"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatEther } from '@/utils/formatters';
import { useETHPrice, useCurrency } from '@/contexts/CurrencyContext';
import { useNFTMetadata } from '@/hooks/useNFTMetadata';
import {
    NFTDetailHeader,
    CategoryPills,
    NFTMediaSection,
    NFTPriceCard,
    NFTInfoTabs,
    PropertiesDisplay,
    SwapTargetInfo,
    CollectionItemsList,
    LoadingSpinner,
    ErrorDisplay
} from '@/components/nft-detail';

interface NFTMetadata {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
}

interface NFTDetails {
    listingId: string;
    nftAddress: string;
    tokenId: string;
    isListed: boolean;
    price: string;
    seller: string;
    buyer?: string;
    desiredNftAddress: string;
    desiredTokenId: string;
    metadata?: NFTMetadata;
}

export default function NFTDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { selectedCurrency } = useCurrency();

    const [nftDetails, setNftDetails] = useState<NFTDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFavorited, setIsFavorited] = useState(false);
    const [activeTab, setActiveTab] = useState<'project' | 'functionalities' | 'tokenomics'>('project');

    const nftAddress = params.nftAddress as string;
    const tokenId = params.tokenId as string;

    // Use the extended NFT metadata hook
    const {
        data: extendedData,
        name,
        description,
        imageUrl,
        attributes,
        categories,
        tags,
        animationUrl,
        audioUrl,
        videoUrl,
        externalUrl,
        websiteUrl,
        twitterUrl,
        creator,
        collection,
        rarityRank,
        rarityScore,
        contractAddress,
        tokenStandard,
        blockchain,
        loading: metadataLoading,
        error: metadataError,
        // New contract-specific data
        contractName,
        contractSymbol,
        currentOwner,
        totalSupply,
        supportsRoyalty,
        royaltyInfo
    } = useNFTMetadata(nftAddress, tokenId);

    // Get converted price
    const ethPrice = nftDetails ? parseFloat(formatEther(nftDetails.price)) : 0;
    const { convertedPrice, loading: priceLoading } = useETHPrice(ethPrice);

    useEffect(() => {
        const fetchListingData = async () => {
            if (!nftAddress || !tokenId) return;

            try {
                setLoading(true);

                // For now, create mock listing data
                // In a real app, you'd fetch this from your marketplace contract
                const mockNFTDetails: NFTDetails = {
                    listingId: `${nftAddress}-${tokenId}`,
                    nftAddress,
                    tokenId,
                    isListed: true,
                    price: "50000000000000000", // 0.05 ETH in Wei
                    seller: "0x742d35Cc6634C0532925a3b8D0C1C4C9C68F82D4",
                    desiredNftAddress: "0x0000000000000000000000000000000000000000",
                    desiredTokenId: "0"
                };

                setNftDetails(mockNFTDetails);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load NFT details');
            } finally {
                setLoading(false);
            }
        };

        fetchListingData();
    }, [nftAddress, tokenId]);

    const handleBack = () => {
        router.back();
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: name || 'NFT',
                    text: description || 'Check out this NFT',
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const toggleFavorite = () => {
        setIsFavorited(!isFavorited);
    };

    if (loading || metadataLoading) {
        return <LoadingSpinner />;
    }

    if (error || metadataError || !nftDetails) {
        return <ErrorDisplay error={error || metadataError || 'NFT not found'} onBack={handleBack} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-32">
            <NFTDetailHeader
                name={name}
                tokenId={tokenId}
                contractName={contractName}
                collection={collection}
                contractSymbol={contractSymbol}
                nftAddress={nftAddress}
                isFavorited={isFavorited}
                onToggleFavorite={toggleFavorite}
                onShare={handleShare}
            />

            <CategoryPills
                categories={categories}
                tags={tags}
                externalUrl={externalUrl}
                websiteUrl={websiteUrl}
                twitterUrl={twitterUrl}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Side - NFT Information & Details (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        <NFTInfoTabs
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
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
                            nftDetails={nftDetails}
                            description={description}
                            rarityRank={rarityRank}
                            rarityScore={rarityScore}
                            attributes={attributes}
                            supportsRoyalty={supportsRoyalty}
                            royaltyInfo={royaltyInfo}
                        />


                        {extendedData?.properties && Object.keys(extendedData.properties).length > 0 && (
                            <PropertiesDisplay properties={extendedData.properties} />
                        )}

                        <SwapTargetInfo
                            desiredNftAddress={nftDetails.desiredNftAddress}
                            desiredTokenId={nftDetails.desiredTokenId}
                        />

                        <CollectionItemsList
                            collection={collection}
                            nftAddress={nftAddress}
                            tokenId={tokenId}
                            name={name}
                            price={nftDetails.price}
                        />
                    </div>

                    {/* Right Side - Media & Price (1/3 width) */}
                    <div className="lg:col-span-1 space-y-6">
                        <NFTMediaSection
                            imageUrl={imageUrl}
                            animationUrl={animationUrl}
                            videoUrl={videoUrl}
                            audioUrl={audioUrl}
                            name={name}
                            tokenId={tokenId}
                        />

                        <NFTPriceCard
                            price={nftDetails.price}
                            isListed={nftDetails.isListed}
                            convertedPrice={convertedPrice}
                            priceLoading={priceLoading}
                            selectedCurrencySymbol={selectedCurrency.symbol}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
