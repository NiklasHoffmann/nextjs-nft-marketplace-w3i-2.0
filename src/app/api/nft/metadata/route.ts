// app/api/nft-metadata/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';
import { createPublicClient, http } from 'viem';
import { sepolia, mainnet } from 'viem/chains';

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

// Response cache with compression headers
const responseCache = new LRUCache<string, Response>({
    max: 500,
    ttl: 1000 * 60 * 15, // 15 Minuten für Response Cache
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
        // Check cache first
        const cachedMetadata = metadataCache.get(cacheKey);
        if (cachedMetadata) {
            // Return with optimized headers
            const response = NextResponse.json({
                metadata: cachedMetadata.metadata,
                imageUrl: cachedMetadata.imageUrl,
                cached: true
            });

            // Add cache headers for client-side caching
            response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
            response.headers.set('CDN-Cache-Control', 'public, max-age=86400');
            return response;
        }

        // Fetch tokenURI from blockchain (simulate for now)
        // In production, you would call your Web3 provider here
        const tokenURI = await fetchTokenURIFromBlockchain(nftAddress, tokenId);

        if (!tokenURI) {
            return NextResponse.json(
                { error: 'Could not fetch tokenURI from blockchain' },
                { status: 404 }
            );
        }

        // Process metadata
        const { metadata, imageUrl } = await processMetadata(tokenURI);

        // Cache the result
        metadataCache.set(cacheKey, { metadata, imageUrl });
        if (imageUrl) {
            imageCache.set(`image-${cacheKey}`, imageUrl);
        }

        return NextResponse.json({
            metadata,
            imageUrl,
            cached: false
        });

    } catch (error) {
        console.error('Error fetching NFT metadata:', error);
        return NextResponse.json(
            { error: 'Failed to fetch NFT metadata' },
            { status: 500 }
        );
    }
}

async function fetchTokenURIFromBlockchain(nftAddress: string, tokenId: string): Promise<string | null> {
    try {
        // ERC721 ABI für tokenURI
        const ERC721_ABI = [
            {
                name: 'tokenURI',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'tokenId', type: 'uint256' }],
                outputs: [{ name: '', type: 'string' }],
            },
        ] as const;

        // Konfiguration für verschiedene Chains
        const getChainConfig = () => {
            const sepoliaRpcUrl = process.env.ALCHEMY_URL || process.env.INFURA_URL || 'https://rpc.sepolia.org';
            return {
                chain: sepolia,
                rpcUrl: sepoliaRpcUrl
            };
        };

        // Validate address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(nftAddress)) {
            console.error('Invalid NFT address format');
            return null;
        }

        // Convert tokenId to BigInt with validation
        let tokenIdBigInt: bigint;
        try {
            tokenIdBigInt = BigInt(tokenId);
        } catch (error) {
            console.error('Invalid tokenId - must be a valid number');
            return null;
        }

        const chainConfig = getChainConfig();
        const publicClient = createPublicClient({
            chain: chainConfig.chain,
            transport: http(chainConfig.rpcUrl)
        });

        // Call tokenURI function on the contract with timeout
        const tokenURI = await Promise.race([
            publicClient.readContract({
                address: nftAddress as `0x${string}`,
                abi: ERC721_ABI,
                functionName: 'tokenURI',
                args: [tokenIdBigInt],
            }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            )
        ]);

        return tokenURI as string;
    } catch (error) {
        console.error('Error calling Web3 directly:', error);
        return null;
    }
}

async function processMetadata(tokenURI: string): Promise<{ metadata: any; imageUrl: string | null }> {
    let metadataUri = tokenURI;

    // Convert IPFS URLs to HTTP
    if (metadataUri.startsWith('ipfs://')) {
        metadataUri = metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    let metadata: any;

    try {
        // Handle data URIs
        if (metadataUri.startsWith('data:application/json;base64,')) {
            const base64Data = metadataUri.replace('data:application/json;base64,', '');
            const jsonString = atob(base64Data);
            metadata = JSON.parse(jsonString);
        } else {
            // Fetch from HTTP/HTTPS with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

            const response = await fetch(metadataUri, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'NFT-Marketplace/1.0',
                    'Cache-Control': 'public, max-age=3600',
                    'Accept': 'application/json',
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            metadata = await response.json();
        }

        // Process image URL
        let imageUrl: string | null = null;
        if (metadata.image) {
            imageUrl = metadata.image.startsWith('ipfs://')
                ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/')
                : metadata.image;
        }

        return { metadata, imageUrl };
    } catch (error) {
        console.error('Error processing metadata:', error);
        return { metadata: null, imageUrl: null };
    }
}
