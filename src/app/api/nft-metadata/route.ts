// app/api/nft-metadata/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { LRUCache } from 'lru-cache';

// Server-side cache für NFT Metadaten (LRU Cache mit TTL)
const metadataCache = new LRUCache<string, any>({
    max: 1000, // Maximum 1000 NFT Metadaten im Cache
    ttl: 1000 * 60 * 30, // 30 Minuten TTL
});

// Image URL cache für optimierte Bildabrufe
const imageCache = new LRUCache<string, string>({
    max: 500,
    ttl: 1000 * 60 * 60, // 1 Stunde TTL für Bilder
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
            return NextResponse.json({
                metadata: cachedMetadata.metadata,
                imageUrl: cachedMetadata.imageUrl,
                cached: true
            });
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
        // Verwende die richtige Base URL basierend auf Environment
        const baseUrl = process.env.NODE_ENV === 'production'
            ? process.env.NEXTAUTH_URL || 'https://your-production-domain.com'
            : 'http://localhost:3000';

        // Use our Web3 API route to fetch tokenURI from blockchain
        const response = await fetch(`${baseUrl}/api/web3/tokenURI?address=${nftAddress}&tokenId=${tokenId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`Web3 API error: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data.error) {
            console.error('Web3 API returned error:', data.error);
            return null;
        }

        return data.tokenURI;
    } catch (error) {
        console.error('Error calling Web3 API:', error);
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
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(metadataUri, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'NFT-Marketplace/1.0',
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
