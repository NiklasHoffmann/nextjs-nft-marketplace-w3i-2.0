"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useReadContract } from 'wagmi';
import { erc721Abi } from 'viem';

// EIP-2981 ABI für Royalty Informationen (nicht in wagmi standardmäßig enthalten)
const EIP2981_ABI = [
    {
        name: 'royaltyInfo',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'salePrice', type: 'uint256' }
        ],
        outputs: [
            { name: 'receiver', type: 'address' },
            { name: 'royaltyAmount', type: 'uint256' }
        ],
    },
    {
        name: 'supportsInterface',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'interfaceId', type: 'bytes4' }],
        outputs: [{ name: '', type: 'bool' }],
    },
] as const;

interface NFTAttribute {
    trait_type: string;
    value: string | number;
    display_type?: string;
    max_value?: number;
}

interface NFTMetadata {
    // Standard OpenSea/ERC721 fields
    name?: string;
    description?: string;
    image?: string;
    animation_url?: string;
    external_url?: string;
    youtube_url?: string;

    // Attributes/Properties
    attributes?: NFTAttribute[];
    properties?: Record<string, any>;

    // Additional common fields
    background_color?: string;
    category?: string | string[];
    tags?: string[];
    collection?: string;
    creator?: string;
    royalty_percentage?: number;

    // Media fields
    image_data?: string;
    image_url?: string;
    audio_url?: string;
    video_url?: string;

    // Social/Marketing
    twitter_url?: string;
    discord_url?: string;
    website_url?: string;

    // Technical fields
    token_id?: string;
    contract_address?: string;
    blockchain?: string;
    token_standard?: string;

    // Rarity/Stats
    rarity_rank?: number;
    rarity_score?: number;
    total_supply?: number;

    // Custom fields (for flexibility)
    [key: string]: any;
}

interface ExtendedNFTData {
    // Basic info
    name: string | null;
    description: string | null;

    // Media
    imageUrl: string | null;
    animationUrl: string | null;
    audioUrl: string | null;
    videoUrl: string | null;

    // Links
    externalUrl: string | null;
    youtubeUrl: string | null;
    twitterUrl: string | null;
    discordUrl: string | null;
    websiteUrl: string | null;

    // Attributes
    attributes: NFTAttribute[];
    properties: Record<string, any>;

    // Categories & Tags
    categories: string[];
    tags: string[];

    // Creator & Collection info
    creator: string | null;
    collection: string | null;
    royaltyPercentage: number | null;

    // Visual
    backgroundColor: string | null;

    // Rarity
    rarityRank: number | null;
    rarityScore: number | null;
    totalSupply: number | null;

    // Technical
    tokenStandard: string | null;
    blockchain: string | null;

    // Raw metadata for custom access
    rawMetadata: NFTMetadata | null;
}

export function useNFTMetadata(nftAddress: string, tokenId: string) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
    const [extendedData, setExtendedData] = useState<ExtendedNFTData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [metadataLoading, setMetadataLoading] = useState(false);

    // Refs für Caching und Fetch-Status
    const fetchingRef = useRef(false);
    const lastTokenURIRef = useRef<string | null>(null);
    const [processedTokenURI, setProcessedTokenURI] = useState<string | null>(null);

    // Helper function to extract media URLs
    const extractMediaUrls = (metadata: NFTMetadata) => {
        const processUrl = (url: string | undefined) => {
            if (!url) return null;
            if (url.startsWith('ipfs://')) {
                return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            return url;
        };

        return {
            image: processUrl(metadata.image || metadata.image_url || metadata.image_data),
            animation: processUrl(metadata.animation_url),
            audio: processUrl(metadata.audio_url),
            video: processUrl(metadata.video_url),
        };
    };

    // Helper function to normalize categories
    const normalizeCategories = (metadata: NFTMetadata): string[] => {
        const categories: string[] = [];

        if (metadata.category) {
            if (Array.isArray(metadata.category)) {
                categories.push(...metadata.category);
            } else {
                categories.push(metadata.category);
            }
        }

        // Extract categories from attributes
        if (metadata.attributes) {
            metadata.attributes.forEach(attr => {
                if (attr.trait_type.toLowerCase().includes('category') ||
                    attr.trait_type.toLowerCase().includes('type')) {
                    categories.push(String(attr.value));
                }
            });
        }

        return [...new Set(categories)]; // Remove duplicates
    };

    // Helper function to process all metadata
    const processMetadata = (rawMetadata: NFTMetadata): ExtendedNFTData => {
        const mediaUrls = extractMediaUrls(rawMetadata);
        const categories = normalizeCategories(rawMetadata);

        // Calculate royalty percentage if available
        let royaltyPercentage: number | null = null;
        if (royaltyInfo && Array.isArray(royaltyInfo) && royaltyInfo.length >= 2) {
            const [, royaltyAmount] = royaltyInfo;
            // Calculate percentage: (royaltyAmount / salePrice) * 100
            royaltyPercentage = Number((BigInt(royaltyAmount) * BigInt(10000)) / salePrice) / 100;
        }

        return {
            // Basic info
            name: rawMetadata.name || null,
            description: rawMetadata.description || null,

            // Media
            imageUrl: mediaUrls.image,
            animationUrl: mediaUrls.animation,
            audioUrl: mediaUrls.audio,
            videoUrl: mediaUrls.video,

            // Links
            externalUrl: rawMetadata.external_url || null,
            youtubeUrl: rawMetadata.youtube_url || null,
            twitterUrl: rawMetadata.twitter_url || null,
            discordUrl: rawMetadata.discord_url || null,
            websiteUrl: rawMetadata.website_url || null,

            // Attributes
            attributes: rawMetadata.attributes || [],
            properties: rawMetadata.properties || {},

            // Categories & Tags
            categories,
            tags: rawMetadata.tags || [],

            // Creator & Collection info - prioritize contract data
            creator: rawMetadata.creator || null,
            collection: rawMetadata.collection || (contractName ? String(contractName) : null),
            royaltyPercentage: rawMetadata.royalty_percentage || royaltyPercentage,

            // Visual
            backgroundColor: rawMetadata.background_color || null,

            // Rarity
            rarityRank: rawMetadata.rarity_rank || null,
            rarityScore: rawMetadata.rarity_score || null,
            totalSupply: rawMetadata.total_supply || (totalSupplyData ? Number(totalSupplyData) : null),

            // Technical - prioritize contract data
            tokenStandard: rawMetadata.token_standard || 'ERC721',
            blockchain: rawMetadata.blockchain || 'Ethereum',

            // Raw metadata for custom access
            rawMetadata,
        };
    };

    // Memoize contract args to prevent re-renders
    const contractArgs = useMemo(() => {
        if (!tokenId || !nftAddress) return undefined;
        try {
            return [BigInt(tokenId)] as const;
        } catch {
            return undefined;
        }
    }, [tokenId, nftAddress]);

    // Contract Calls
    // 1. TokenURI
    const {
        data: tokenURI,
        error: contractError,
        isLoading: contractLoading
    } = useReadContract({
        address: nftAddress as `0x${string}`,
        abi: erc721Abi,
        functionName: 'tokenURI',
        args: contractArgs,
        query: {
            enabled: !!contractArgs && !!nftAddress,
        }
    });

    // 2. Contract Name
    const {
        data: contractName,
        isLoading: nameLoading
    } = useReadContract({
        address: nftAddress as `0x${string}`,
        abi: erc721Abi,
        functionName: 'name',
        query: {
            enabled: !!nftAddress,
        }
    });

    // 3. Contract Symbol
    const {
        data: contractSymbol,
        isLoading: symbolLoading
    } = useReadContract({
        address: nftAddress as `0x${string}`,
        abi: erc721Abi,
        functionName: 'symbol',
        query: {
            enabled: !!nftAddress,
        }
    });

    // 4. Current Owner
    const {
        data: currentOwner,
        isLoading: ownerLoading
    } = useReadContract({
        address: nftAddress as `0x${string}`,
        abi: erc721Abi,
        functionName: 'ownerOf',
        args: contractArgs,
        query: {
            enabled: !!contractArgs && !!nftAddress,
        }
    });

    // 5. Total Supply
    const {
        data: totalSupplyData,
        isLoading: supplyLoading
    } = useReadContract({
        address: nftAddress as `0x${string}`,
        abi: erc721Abi,
        functionName: 'totalSupply',
        query: {
            enabled: !!nftAddress,
        }
    });

    // 6. Check EIP-2981 support
    const EIP2981_INTERFACE_ID = '0x2a55205a';
    const {
        data: supportsRoyalty,
        isLoading: royaltyCheckLoading
    } = useReadContract({
        address: nftAddress as `0x${string}`,
        abi: EIP2981_ABI,
        functionName: 'supportsInterface',
        args: [EIP2981_INTERFACE_ID as `0x${string}`],
        query: {
            enabled: !!nftAddress,
        }
    });

    // 7. Royalty Info (if supported)
    const salePrice = BigInt(1000000000000000000); // 1 ETH in wei for royalty calculation
    const {
        data: royaltyInfo,
        isLoading: royaltyLoading
    } = useReadContract({
        address: nftAddress as `0x${string}`,
        abi: EIP2981_ABI,
        functionName: 'royaltyInfo',
        args: contractArgs ? [contractArgs[0], salePrice] : undefined,
        query: {
            enabled: !!contractArgs && !!nftAddress && !!supportsRoyalty,
        }
    });

    // Calculate if all contract calls are loading
    const allContractLoading = contractLoading || nameLoading || symbolLoading || ownerLoading || supplyLoading || royaltyCheckLoading || royaltyLoading;

    useEffect(() => {
        async function fetchMetadata() {
            const uri = tokenURI;

            // Skip if no URI, already fetching, or already fetched this URI
            if (!uri || typeof uri !== 'string' || fetchingRef.current || lastTokenURIRef.current === uri) {
                return;
            }

            fetchingRef.current = true;
            lastTokenURIRef.current = uri;
            setMetadataLoading(true);
            setError(null);

            try {
                let metadataUri = uri;

                // IPFS URLs umwandeln
                if (metadataUri.startsWith('ipfs://')) {
                    metadataUri = metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
                }

                // Data URI unterstützen (base64 encoded JSON)
                if (metadataUri.startsWith('data:application/json;base64,')) {
                    const base64Data = metadataUri.replace('data:application/json;base64,', '');
                    const jsonString = atob(base64Data);
                    const rawMetadata = JSON.parse(jsonString);

                    // Add technical info
                    rawMetadata.token_id = tokenId;
                    rawMetadata.contract_address = nftAddress;

                    setMetadata(rawMetadata);
                    const processedData = processMetadata(rawMetadata);
                    setExtendedData(processedData);
                    setImageUrl(processedData.imageUrl);
                    return;
                }

                // HTTP/HTTPS Metadaten laden
                const response = await fetch(metadataUri);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const rawMetadata = await response.json();

                // Add technical info
                rawMetadata.token_id = tokenId;
                rawMetadata.contract_address = nftAddress;

                setMetadata(rawMetadata);
                const processedData = processMetadata(rawMetadata);
                setExtendedData(processedData);
                setImageUrl(processedData.imageUrl);
            } catch (err) {
                console.error('Error fetching NFT metadata:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch metadata');
                setMetadata(null);
                setExtendedData(null);
                setImageUrl(null);
                // Reset the lastTokenURIRef on error so it can be retried
                lastTokenURIRef.current = null;
            } finally {
                setMetadataLoading(false);
                fetchingRef.current = false;
            }
        }

        fetchMetadata();
    }, [tokenURI]); // Only depend on tokenURI

    // Memoize error message to prevent re-renders from error object changes
    const errorMessage = useMemo(() => {
        if (error) return error;
        if (contractError) return contractError.message;
        return null;
    }, [error, contractError?.message]);

    // Memoize the return value to prevent unnecessary re-renders
    return useMemo(() => ({
        // Legacy compatibility
        metadata,
        imageUrl,
        loading: allContractLoading || metadataLoading,
        error: errorMessage,

        // Extended data access
        data: extendedData,

        // Quick access to common fields
        name: extendedData?.name || null,
        description: extendedData?.description || null,
        attributes: extendedData?.attributes || [],
        categories: extendedData?.categories || [],
        tags: extendedData?.tags || [],

        // Media URLs
        animationUrl: extendedData?.animationUrl || null,
        audioUrl: extendedData?.audioUrl || null,
        videoUrl: extendedData?.videoUrl || null,

        // Links
        externalUrl: extendedData?.externalUrl || null,
        websiteUrl: extendedData?.websiteUrl || null,
        twitterUrl: extendedData?.twitterUrl || null,

        // Creator info
        creator: extendedData?.creator || null,
        collection: extendedData?.collection || null,

        // Rarity
        rarityRank: extendedData?.rarityRank || null,
        rarityScore: extendedData?.rarityScore || null,

        // Technical
        contractAddress: nftAddress,
        tokenId: tokenId,
        tokenStandard: extendedData?.tokenStandard || 'ERC721',
        blockchain: extendedData?.blockchain || 'Ethereum',

        // Contract-specific data
        contractName: contractName ? String(contractName) : null,
        contractSymbol: contractSymbol ? String(contractSymbol) : null,
        currentOwner: currentOwner ? String(currentOwner) : null,
        totalSupply: totalSupplyData ? Number(totalSupplyData) : null,
        supportsRoyalty: !!supportsRoyalty,
        royaltyInfo: royaltyInfo ? {
            receiver: String(royaltyInfo[0]),
            amount: String(royaltyInfo[1]),
            percentage: extendedData?.royaltyPercentage || null
        } : null,

    }), [
        metadata,
        imageUrl,
        allContractLoading,
        metadataLoading,
        errorMessage,
        extendedData,
        nftAddress,
        tokenId,
        contractName,
        contractSymbol,
        currentOwner,
        totalSupplyData,
        supportsRoyalty,
        royaltyInfo
    ]);
}
