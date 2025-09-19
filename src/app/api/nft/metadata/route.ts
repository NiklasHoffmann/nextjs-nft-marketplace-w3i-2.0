// app/api/nft-metadata/route.ts - Optimized Version
import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';
import { fetchComprehensiveNFTDataNew } from '@/utils/04-blockchain/nft-data-fetcher';
import { createRobustPublicClient, getTimeoutConfig } from '@/utils/04-blockchain/rpc-config';

// Enhanced server-side cache für NFT Metadaten mit größerem TTL und besserer Performance
const metadataCache = new LRUCache<string, any>({
    max: 2000, // Increased cache size
    ttl: 1000 * 60 * 60 * 2, // 2 Stunden TTL für bessere Performance
    maxSize: 50 * 1024 * 1024, // 50MB max memory
    sizeCalculation: (value) => JSON.stringify(value).length,
});

// Enhanced image URL cache
const imageCache = new LRUCache<string, string>({
    max: 1000,
    ttl: 1000 * 60 * 60 * 6, // 6 Stunden TTL für Images
});

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const nftAddress = searchParams.get('address');
    const tokenId = searchParams.get('tokenId');

    if (!nftAddress || !tokenId) {
        return NextResponse.json(
            { error: 'Missing nftAddress or tokenId parameter' },
            { status: 400 }
        );
    }

    const cacheKey = `${nftAddress}-${tokenId}`;

    try {
        // Clear cache for custom NFTs during development
        if (process.env.NODE_ENV === 'development') {
            metadataCache.delete(cacheKey);
        }

        // Check cache first
        const cachedMetadata = metadataCache.get(cacheKey);
        if (cachedMetadata) {
            // Return with optimized headers
            const response = NextResponse.json({
                ...cachedMetadata,
                cached: true
            });

            response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=7200');
            response.headers.set('CDN-Cache-Control', 'public, max-age=86400');
            response.headers.set('Vary', 'Accept-Encoding');

            return response;
        }

        // Use the optimized blockchain data fetcher
        const blockchainData = await fetchComprehensiveNFTDataNew(nftAddress, tokenId);

        if (!blockchainData?.tokenURI) {
            console.warn('No tokenURI available, cannot fetch metadata');
            return NextResponse.json({ error: 'No tokenURI available' }, { status: 404 });
        }

        // Process metadata from tokenURI
        let metadata = null;
        let imageUrl = null;

        try {
            const { metadata: processedMetadata, imageUrl: processedImageUrl } = await processMetadata(blockchainData.tokenURI);
            metadata = processedMetadata;
            imageUrl = processedImageUrl;
        } catch (metadataError) {
            console.error('Error processing metadata:', metadataError);
            // Continue with blockchain data even if metadata processing fails
        }

        // Prepare comprehensive response
        const result = {
            nftAddress,
            tokenId,
            metadata,
            imageUrl,
            blockchain: {
                tokenURI: blockchainData.tokenURI,
                name: blockchainData.contractName,
                symbol: blockchainData.contractSymbol,
                totalSupply: blockchainData.totalSupply,
                owner: blockchainData.owner,
                ownerBalance: blockchainData.ownerBalance,
                approvedAddress: blockchainData.approvedAddress,
            },
            cached: false
        };

        // Cache the result
        metadataCache.set(cacheKey, result);
        if (imageUrl) {
            imageCache.set(`image-${cacheKey}`, imageUrl);
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Error fetching NFT metadata:', error);
        return NextResponse.json(
            { error: 'Failed to fetch NFT metadata' },
            { status: 500 }
        );
    }
}

async function processMetadata(tokenURI: string): Promise<{ metadata: any; imageUrl: string | null }> {
    let metadataUri = tokenURI;

    // Convert IPFS URLs to HTTP
    if (metadataUri.startsWith('ipfs://')) {
        metadataUri = metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    // Fetch metadata with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
        const metadataResponse = await fetch(metadataUri, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
            },
        });

        clearTimeout(timeoutId);

        if (!metadataResponse.ok) {
            throw new Error(`Failed to fetch metadata: ${metadataResponse.status}`);
        }

        const metadata = await metadataResponse.json();

        // Extract and process image URL
        let imageUrl = metadata.image || metadata.image_url || metadata.imageUrl || null;

        if (imageUrl && imageUrl.startsWith('ipfs://')) {
            imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
        }

        return { metadata, imageUrl };

    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error fetching metadata from URI:', error);
        return { metadata: null, imageUrl: null };
    }
}

async function getTokenURIWithFallback(nftAddress: string, tokenId: string): Promise<string | null> {
    try {
        // Enhanced ERC721 ABI for tokenURI function
        const ERC721_ABI = [
            {
                name: 'tokenURI',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'tokenId', type: 'uint256' }],
                outputs: [{ name: '', type: 'string' }],
            },
        ] as const;

        // Validate inputs
        if (!/^0x[a-fA-F0-9]{40}$/.test(nftAddress)) {
            console.error('Invalid NFT address format');
            return null;
        }

        let tokenIdBigInt: bigint;
        try {
            tokenIdBigInt = BigInt(tokenId);
        } catch (error) {
            console.error('Invalid tokenId - must be a valid number');
            return null;
        }

        // Verwende den robusten PublicClient
        const publicClient = createRobustPublicClient();

        // Call tokenURI function on the contract with timeout
        const tokenURI = await Promise.race([
            publicClient.readContract({
                address: nftAddress as `0x${string}`,
                abi: ERC721_ABI,
                functionName: 'tokenURI',
                args: [tokenIdBigInt],
            }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), getTimeoutConfig('critical'))
            )
        ]);

        return tokenURI as string;
    } catch (error) {
        console.error('Error calling Web3 directly:', error);
        return null;
    }
}