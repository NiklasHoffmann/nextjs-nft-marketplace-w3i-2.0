import { NextRequest } from 'next/server';
import { apiBadRequest, apiHandler, apiSuccess } from '@/lib/api';
import { getWalletNFTsFromBlockchain, getKnownContractAddresses } from '@/lib/blockchain';
import { upsertNFTMetadata } from '@/lib/db';
import { incrementRequestCounter } from '@/lib/monitoring/request-counter';
import { getSharedCacheValue, setSharedCacheValue } from '@/lib/redis/shared-cache';
import { fetchComprehensiveNFTDataNew } from '@/services/blockchain/nft-fetcher';
import type { Address } from 'viem';
import { devLog } from '@/utils';

const METADATA_FETCH_VERSION = 2;

// Interface for NFT response from external APIs
interface ExternalNFT {
    contractAddress: string;
    tokenId: string;
    name?: string;
    description?: string;
    image?: string;
    animationUrl?: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
    contractName?: string;
    contractSymbol?: string;
    tokenType?: 'ERC721' | 'ERC1155';
    balance?: string; // For ERC1155
}

interface WalletNFTsResponse {
    success: boolean;
    data?: ExternalNFT[];
    total?: number;
    error?: string;
    source?: 'alchemy' | 'moralis' | 'blockchain' | 'hybrid';
}

interface WalletNFTsCacheEntry {
    expiresAt: number;
    payload: WalletNFTsResponse;
}

type MetadataAttribute = {
    trait_type: string;
    value: string | number;
    display_type?: string;
};

type TokenMetadataPayload = {
    name: string | null;
    description: string | null;
    image: string | null;
    attributes: MetadataAttribute[];
    [key: string]: any;
};



// Lightweight NFT discovery interface
interface NFTIdentifier {
    contractAddress: string;
    tokenId: string;
}

const DISCOVERY_PAGE_SIZE = 100;
const DISCOVERY_MAX_PAGES = Number.parseInt(process.env.WALLET_DISCOVERY_MAX_PAGES || '10', 10);

function normalizeTokenId(tokenId: unknown): string {
    if (tokenId === undefined || tokenId === null) {
        return '';
    }

    const raw = String(tokenId).trim();
    if (!raw) {
        return '';
    }

    try {
        return BigInt(raw).toString();
    } catch {
        return raw;
    }
}

function normalizeMetadataUri(tokenURI: string, tokenId: string): string {
    let normalized = tokenURI.trim();

    try {
        const hexTokenId = BigInt(tokenId).toString(16).padStart(64, '0').toLowerCase();
        normalized = normalized
            .replace(/\{id\}/gi, hexTokenId)
            .replace(/%7Bid%7D/gi, hexTokenId);
    } catch {
        // Keep original URI when tokenId cannot be parsed.
    }

    if (normalized.startsWith('ipfs://')) {
        return normalized.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    return normalized;
}

function normalizeMetadataAssetUrl(value: unknown): string | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    if (trimmed.startsWith('ipfs://')) {
        return trimmed.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    if (trimmed.startsWith('ipfs/')) {
        return `https://ipfs.io/ipfs/${trimmed.slice(5)}`;
    }

    return trimmed;
}

function normalizeMetadataAttributes(value: unknown): MetadataAttribute[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((entry) => {
            if (!entry || typeof entry !== 'object') {
                return null;
            }

            const raw = entry as Record<string, unknown>;
            const trait = typeof raw.trait_type === 'string'
                ? raw.trait_type
                : typeof raw.traitType === 'string'
                    ? raw.traitType
                    : '';

            if (!trait) {
                return null;
            }

            const valueRaw = raw.value;
            const normalizedValue = typeof valueRaw === 'number' || typeof valueRaw === 'string'
                ? valueRaw
                : JSON.stringify(valueRaw);

            const normalized: MetadataAttribute = {
                trait_type: trait,
                value: normalizedValue,
            };

            if (typeof raw.display_type === 'string') {
                normalized.display_type = raw.display_type;
            }

            return normalized;
        })
        .filter((entry): entry is MetadataAttribute => entry !== null);
}

function normalizeFetchedMetadataPayload(metadataJson: unknown): TokenMetadataPayload {
    const raw = metadataJson && typeof metadataJson === 'object'
        ? { ...(metadataJson as Record<string, unknown>) }
        : {};

    const image = normalizeMetadataAssetUrl(raw.image ?? raw.image_url ?? raw.imageUrl);
    const animationUrl = normalizeMetadataAssetUrl(raw.animationUrl ?? raw.animation_url);
    const externalUrl = typeof raw.externalUrl === 'string'
        ? raw.externalUrl.trim()
        : typeof raw.external_url === 'string'
            ? raw.external_url.trim()
            : null;

    const normalized: TokenMetadataPayload = {
        ...(raw as Record<string, any>),
        name: typeof raw.name === 'string'
            ? raw.name
            : (typeof raw.title === 'string' ? raw.title : null),
        description: typeof raw.description === 'string' ? raw.description : null,
        image,
        attributes: normalizeMetadataAttributes(raw.attributes),
    };

    if (image && !normalized.imageOriginal) {
        normalized.imageOriginal = image;
    }

    if (animationUrl) {
        normalized.animationUrl = animationUrl;
        if (!normalized.animation_url) {
            normalized.animation_url = animationUrl;
        }
    }

    if (externalUrl) {
        normalized.externalUrl = externalUrl;
        if (!normalized.external_url) {
            normalized.external_url = externalUrl;
        }
    }

    return normalized;
}

function hasFetchedMetadataPayload(metadata: TokenMetadataPayload): boolean {
    const hasName = typeof metadata.name === 'string' && metadata.name.trim().length > 0;
    const hasDescription = typeof metadata.description === 'string' && metadata.description.trim().length > 0;
    const hasImage = typeof metadata.image === 'string' && metadata.image.trim().length > 0;
    const hasAttributes = Array.isArray(metadata.attributes) && metadata.attributes.length > 0;

    const knownKeys = new Set([
        'name',
        'title',
        'description',
        'image',
        'image_url',
        'imageUrl',
        'imageOriginal',
        'images',
        'imageMeta',
        'blurDataURL',
        'attributes',
        'animationUrl',
        'animation_url',
        'externalUrl',
        'external_url',
        'background_color',
    ]);
    const hasAdditionalFields = Object.keys(metadata).some((key) => {
        if (knownKeys.has(key)) {
            return false;
        }

        const value = metadata[key];
        if (value === null || value === undefined) {
            return false;
        }

        if (typeof value === 'string') {
            return value.trim().length > 0;
        }

        if (Array.isArray(value)) {
            return value.length > 0;
        }

        if (typeof value === 'object') {
            return Object.keys(value as Record<string, unknown>).length > 0;
        }

        return true;
    });

    return hasName || hasDescription || hasImage || hasAttributes || hasAdditionalFields;
}

async function fetchMetadataFromTokenURI(tokenURI: string | null, tokenId: string): Promise<TokenMetadataPayload> {
    if (!tokenURI || typeof tokenURI !== 'string' || tokenURI.trim().length === 0) {
        return {
            name: null,
            description: null,
            image: null,
            attributes: []
        };
    }

    try {
        const metadataURL = normalizeMetadataUri(tokenURI, tokenId);
        const metadataResponse = await fetch(metadataURL, {
            signal: AbortSignal.timeout(5000)
        });

        if (!metadataResponse.ok) {
            return {
                name: null,
                description: null,
                image: null,
                attributes: []
            };
        }

        const metadataJson = await metadataResponse.json();
        return normalizeFetchedMetadataPayload(metadataJson);
    } catch {
        return {
            name: null,
            description: null,
            image: null,
            attributes: []
        };
    }
}

async function persistWalletNFTsToDatabase(walletAddress: string, nfts: ExternalNFT[]): Promise<void> {
    if (!Array.isArray(nfts) || nfts.length === 0) {
        return;
    }

    const normalizedWallet = walletAddress.toLowerCase();
    const deduped = Array.from(
        new Map(
            nfts
                .filter((nft) => nft.contractAddress && nft.tokenId !== undefined && nft.tokenId !== null)
                .map((nft) => {
                    const contractAddress = String(nft.contractAddress).toLowerCase();
                    const tokenId = String(nft.tokenId);
                    return [`${contractAddress}-${tokenId}`, { contractAddress, tokenId }];
                })
        ).values()
    );

    if (deduped.length === 0) {
        return;
    }

    devLog.info(`💾 [Wallet NFTs API] Persisting ${deduped.length} NFTs for ${normalizedWallet}`);

    // Phase 1: Ensure every discovered NFT exists in DB immediately.
    await Promise.all(
        deduped.map(({ contractAddress, tokenId }) =>
            upsertNFTMetadata(contractAddress, tokenId, {
                ownershipBalances: {
                    [normalizedWallet]: 1,
                },
                lastVerified: new Date().toISOString()
            } as any)
        )
    );

    // Phase 2: Fill missing contract/metadata fields now.
    const batchSize = 3;
    for (let i = 0; i < deduped.length; i += batchSize) {
        const batch = deduped.slice(i, i + batchSize);

        await Promise.all(
            batch.map(async ({ contractAddress, tokenId }) => {
                try {
                    const blockchainData = await fetchComprehensiveNFTDataNew(
                        contractAddress,
                        tokenId,
                        normalizedWallet
                    );

                    if (!blockchainData) {
                        return;
                    }

                    const metadata = await fetchMetadataFromTokenURI(blockchainData.tokenURI || null, tokenId);
                    const tokenStandard = blockchainData.tokenStandard || null;
                    const parsedOwnerBalance = blockchainData.ownerBalance
                        ? parseInt(blockchainData.ownerBalance)
                        : null;
                    const erc1155Balance = parsedOwnerBalance !== null && Number.isFinite(parsedOwnerBalance)
                        ? Math.max(parsedOwnerBalance, 0)
                        : 1;

                    const updatePayload: any = {
                        contract: {
                            name: blockchainData.contractName || null,
                            symbol: blockchainData.contractSymbol || null,
                            totalSupply: blockchainData.totalSupply ? parseInt(blockchainData.totalSupply) : null,
                            contractType: tokenStandard,
                            tokenURI: blockchainData.tokenURI || null,
                            owner: blockchainData.owner || normalizedWallet,
                            ownerBalance: parsedOwnerBalance,
                            approved: blockchainData.approvedAddress || null
                        },
                        lastVerified: new Date().toISOString(),
                    };

                    if (tokenStandard === 'ERC1155') {
                        updatePayload[`ownershipBalances.${normalizedWallet}`] = erc1155Balance;
                    } else {
                        updatePayload.currentOwner = normalizedWallet;
                        updatePayload['blockchain.owner'] = blockchainData.owner || normalizedWallet;
                    }

                    if (hasFetchedMetadataPayload(metadata)) {
                        updatePayload.metadata = metadata;
                        updatePayload.metadataFetchVersion = METADATA_FETCH_VERSION;
                        const metadataUpdateTimestamp = new Date().toISOString();
                        updatePayload.lastMetadataUpdate = metadataUpdateTimestamp;
                        updatePayload.metadataLastUpdated = metadataUpdateTimestamp;
                    }

                    await upsertNFTMetadata(contractAddress, tokenId, updatePayload);
                } catch (error) {
                    devLog.warn(
                        `⚠️ [Wallet NFTs API] Persist enrichment failed for ${contractAddress}/${tokenId}`,
                        error
                    );
                }
            })
        );

        if (i + batchSize < deduped.length) {
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
    }
}

function normalizeIdentifiers(rawItems: unknown[], source: 'alchemy' | 'moralis'): NFTIdentifier[] {
    const normalized = rawItems
        .map((item: any) => {
            const contractAddress = source === 'alchemy'
                ? (item?.contract?.address || item?.contractAddress)
                : item?.token_address;
            const rawTokenId = source === 'alchemy'
                ? (item?.tokenId || item?.id?.tokenId)
                : item?.token_id;
            const tokenId = normalizeTokenId(rawTokenId);

            if (!contractAddress || !tokenId) {
                return null;
            }

            // Discovery payload is intentionally limited to wallet ownership identifiers.
            return {
                contractAddress: String(contractAddress).toLowerCase(),
                tokenId: String(tokenId),
            };
        })
        .filter(Boolean) as NFTIdentifier[];

    const sample = normalized.slice(0, 10).map((nft) => `${nft.contractAddress}:${nft.tokenId}`);
    devLog.info(`🧭 [Discovery:${source}] Loaded ${normalized.length} wallet NFT identifiers`);
    devLog.info(`   ↳ Identifiers sample (${sample.length}):`, sample);

    return normalized;
}

function mapDiscoveredToFallbackNFTs(discovered: NFTIdentifier[]): ExternalNFT[] {
    return discovered.map((nft) => ({
        contractAddress: nft.contractAddress,
        tokenId: nft.tokenId,
    }));
}

const WALLET_NFTS_CACHE_TTL_MS = 15_000;
const WALLET_NFTS_SHARED_CACHE_TTL_SECONDS = Math.ceil(WALLET_NFTS_CACHE_TTL_MS / 1000);
const WALLET_NFTS_MAX_CACHE_ENTRIES = 500;

const walletNftsResponseCache = new Map<string, WalletNFTsCacheEntry>();
const walletNftsInFlight = new Map<string, Promise<WalletNFTsResponse>>();

function buildWalletCacheKey(walletAddress: string, source: string, skipPersist: boolean): string {
    const mode = skipPersist ? 'no-persist' : 'persist';
    return `${walletAddress.toLowerCase()}:${source}:${mode}`;
}

function buildSharedWalletCacheKey(cacheKey: string): string {
    return `wallet-nfts:${cacheKey}`;
}

function cleanupWalletNftsCache(): void {
    const now = Date.now();

    for (const [key, entry] of walletNftsResponseCache.entries()) {
        if (entry.expiresAt <= now) {
            walletNftsResponseCache.delete(key);
        }
    }

    if (walletNftsResponseCache.size <= WALLET_NFTS_MAX_CACHE_ENTRIES) {
        return;
    }

    const entries = Array.from(walletNftsResponseCache.entries())
        .sort((a, b) => a[1].expiresAt - b[1].expiresAt);

    const toRemove = walletNftsResponseCache.size - WALLET_NFTS_MAX_CACHE_ENTRIES;
    for (let i = 0; i < toRemove; i++) {
        const entry = entries[i];
        if (entry) {
            walletNftsResponseCache.delete(entry[0]);
        }
    }
}

/**
 * Alchemy API - LIGHTWEIGHT MODE (Rate Limit Friendly)
 * Only fetches contract addresses + token IDs (minimal data)
 * Metadata is fetched separately via blockchain + IPFS
 */
async function discoverNFTsViaAlchemy(walletAddress: string): Promise<NFTIdentifier[]> {
    try {
        incrementRequestCounter('alchemy.discovery.wallet_nfts.attempt');

        const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY;
        if (!apiKey) {
            throw new Error('Alchemy API key not configured. Please set NEXT_PUBLIC_ALCHEMY_API_KEY in .env.local');
        }

        const baseURL = `https://eth-sepolia.g.alchemy.com/nft/v3/${apiKey}`;

        const maxPages = Number.isFinite(DISCOVERY_MAX_PAGES) && DISCOVERY_MAX_PAGES > 0
            ? DISCOVERY_MAX_PAGES
            : 10;
        let pageKey: string | undefined;
        const allDiscovered: NFTIdentifier[] = [];
        const dedupe = new Set<string>();

        for (let page = 1; page <= maxPages; page++) {
            const query = new URLSearchParams({
                owner: walletAddress,
                withMetadata: 'false',
                pageSize: String(DISCOVERY_PAGE_SIZE),
            });

            if (pageKey) {
                query.set('pageKey', pageKey);
            }

            // IMPORTANT: withMetadata=false to save rate limit!
            const response = await fetch(`${baseURL}/getNFTsForOwner?${query.toString()}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                }
            });

            if (!response.ok) {
                incrementRequestCounter('alchemy.discovery.wallet_nfts.error');
                const errorText = await response.text();
                devLog.error('? Alchemy API error:', response.status, errorText);
                throw new Error(`Alchemy API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const pageItems = normalizeIdentifiers(Array.isArray(data?.ownedNfts) ? data.ownedNfts : [], 'alchemy');

            for (const nft of pageItems) {
                const key = `${nft.contractAddress}-${nft.tokenId}`;
                if (!dedupe.has(key)) {
                    dedupe.add(key);
                    allDiscovered.push(nft);
                }
            }

            const nextPageKey = typeof data?.pageKey === 'string' && data.pageKey.trim().length > 0
                ? data.pageKey
                : undefined;

            devLog.info(`? [Alchemy Discovery] Page ${page}: +${pageItems.length} NFTs, total=${allDiscovered.length}, hasNext=${!!nextPageKey}`);

            if (!nextPageKey) {
                break;
            }

            pageKey = nextPageKey;
        }

        incrementRequestCounter('alchemy.discovery.wallet_nfts.success');
        devLog.info(`? [Alchemy Discovery] Mapped ${allDiscovered.length} NFTs (paginated)`);
        return allDiscovered;
    } catch (error) {
        devLog.error('? [Alchemy Discovery] Error:', error);
        throw error;
    }
}

/**
 * Moralis lightweight discovery fallback (contract + tokenId only)
 */
async function discoverNFTsViaMoralis(walletAddress: string): Promise<NFTIdentifier[]> {
    incrementRequestCounter('moralis.discovery.wallet_nfts.attempt');

    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
        throw new Error('Moralis API key not configured. Add MORALIS_API_KEY to .env.local');
    }

    const chain = process.env.MORALIS_CHAIN || 'sepolia';
    const maxPages = Number.isFinite(DISCOVERY_MAX_PAGES) && DISCOVERY_MAX_PAGES > 0
        ? DISCOVERY_MAX_PAGES
        : 10;
    let cursor: string | undefined;
    const allDiscovered: NFTIdentifier[] = [];
    const dedupe = new Set<string>();

    for (let page = 1; page <= maxPages; page++) {
        const query = new URLSearchParams({
            chain,
            format: 'decimal',
            media_items: 'false',
            limit: String(DISCOVERY_PAGE_SIZE),
        });

        if (cursor) {
            query.set('cursor', cursor);
        }

        const response = await fetch(
            `https://deep-index.moralis.io/api/v2.2/${walletAddress}/nft?${query.toString()}`,
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-API-Key': apiKey
                }
            }
        );

        if (!response.ok) {
            incrementRequestCounter('moralis.discovery.wallet_nfts.error');
            const errorText = await response.text();
            throw new Error(`Moralis API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const pageItems = normalizeIdentifiers(Array.isArray(data?.result) ? data.result : [], 'moralis');

        for (const nft of pageItems) {
            const key = `${nft.contractAddress}-${nft.tokenId}`;
            if (!dedupe.has(key)) {
                dedupe.add(key);
                allDiscovered.push(nft);
            }
        }

        const nextCursor = typeof data?.cursor === 'string' && data.cursor.trim().length > 0
            ? data.cursor
            : undefined;

        if (!nextCursor) {
            break;
        }

        cursor = nextCursor;
    }

    incrementRequestCounter('moralis.discovery.wallet_nfts.success');
    return allDiscovered;
}

/**
 * DEPRECATED: Old Alchemy with full metadata
 * Use discoverNFTsViaAlchemy() + blockchain fetching instead
 */
async function fetchFromAlchemy(walletAddress: string): Promise<ExternalNFT[]> {
    // Use your specific Alchemy API key from .env.local
    const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY;
    if (!apiKey) {
        throw new Error('Alchemy API key not configured. Please set NEXT_PUBLIC_ALCHEMY_API_KEY in .env.local');
    }

    // Use Sepolia network as configured in your .env.local
    const baseURL = `https://eth-sepolia.g.alchemy.com/nft/v3/${apiKey}`;

    const response = await fetch(
        `${baseURL}/getNFTsForOwner?owner=${walletAddress}&withMetadata=true&pageSize=100`,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        devLog.error('❌ Alchemy API error:', response.status, errorText);
        throw new Error(`Alchemy API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return data.ownedNfts?.map((nft: any) => {
        // Skip if NFT is undefined or invalid
        if (!nft || !nft.contract) {
            devLog.warn('⚠️ Skipping invalid NFT:', nft);
            return null;
        }

        // Handle image URL - could be string or object
        let imageUrl: string | undefined;
        if (typeof nft.image === 'string') {
            imageUrl = nft.image;
        } else if (nft.image && typeof nft.image === 'object') {
            imageUrl = nft.image.originalUrl || nft.image.cachedUrl || nft.image.thumbnailUrl || nft.image.pngUrl;
        }
        // Fallback to raw.metadata.image if available
        if (!imageUrl && nft?.raw?.metadata?.image) {
            imageUrl = typeof nft.raw.metadata.image === 'string'
                ? nft.raw.metadata.image
                : undefined;
        }

        return {
            contractAddress: nft.contract.address,
            tokenId: nft.tokenId,
            name: nft.name || nft.title || `NFT #${nft.tokenId}`,
            description: nft.description,
            image: imageUrl,
            animationUrl: nft.animation_url,
            attributes: nft.attributes || [],
            contractName: nft.contract.name,
            contractSymbol: nft.contract.symbol,
            tokenType: nft.contract.tokenType,
            balance: nft.balance
        };
    }).filter(Boolean) || [];
}

// Moralis API integration (alternative)
async function fetchFromMoralis(walletAddress: string): Promise<ExternalNFT[]> {
    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
        throw new Error('Moralis API key not configured. Add MORALIS_API_KEY to .env.local if you want to use Moralis as fallback');
    }

    // Use Sepolia chain to match your setup
    const chain = process.env.MORALIS_CHAIN || 'sepolia';


    const response = await fetch(
        `https://deep-index.moralis.io/api/v2.2/${walletAddress}/nft?chain=${chain}&format=decimal&media_items=true`,
        {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-API-Key': apiKey
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        devLog.error('❌ Moralis API error:', response.status, errorText);
        throw new Error(`Moralis API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return data.result?.map((nft: any) => ({
        contractAddress: nft.token_address,
        tokenId: nft.token_id,
        name: nft.metadata?.name || `NFT #${nft.token_id}`,
        description: nft.metadata?.description,
        image: nft.metadata?.image,
        animationUrl: nft.metadata?.animation_url,
        attributes: nft.metadata?.attributes || [],
        contractName: nft.name,
        contractSymbol: nft.symbol,
        tokenType: nft.contract_type,
        balance: nft.amount
    })) || [];
}

// GET /api/wallet/nfts - Get all NFTs for a wallet address
export const GET = apiHandler(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('address');
    const source = searchParams.get('source') || 'auto'; // 'alchemy', 'moralis', 'auto'
    const skipPersist = searchParams.get('skipPersist') === 'true';

    // Validation
    if (!walletAddress) {
        return apiBadRequest('Wallet address is required');
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return apiBadRequest('Invalid wallet address format');
    }

    cleanupWalletNftsCache();

    const cacheKey = buildWalletCacheKey(walletAddress, source, skipPersist);
    const now = Date.now();

    const cachedEntry = walletNftsResponseCache.get(cacheKey);
    if (cachedEntry && cachedEntry.expiresAt > now) {
        const cachedResponse = apiSuccess(cachedEntry.payload);
        cachedResponse.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=20');
        cachedResponse.headers.set('X-Cache', 'HIT');
        return cachedResponse;
    }

    const sharedCacheKey = buildSharedWalletCacheKey(cacheKey);
    const sharedPayload = await getSharedCacheValue<WalletNFTsResponse>(sharedCacheKey);
    if (sharedPayload) {
        walletNftsResponseCache.set(cacheKey, {
            expiresAt: Date.now() + WALLET_NFTS_CACHE_TTL_MS,
            payload: sharedPayload,
        });

        const sharedResponse = apiSuccess(sharedPayload);
        sharedResponse.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=20');
        sharedResponse.headers.set('X-Cache', 'HIT-SHARED');
        return sharedResponse;
    }

    const inFlightRequest = walletNftsInFlight.get(cacheKey);
    if (inFlightRequest) {
        const inFlightPayload = await inFlightRequest;
        const inFlightResponse = apiSuccess(inFlightPayload);
        inFlightResponse.headers.set('Cache-Control', 'private, max-age=5, stale-while-revalidate=15');
        inFlightResponse.headers.set('X-Cache', 'HIT-INFLIGHT');
        return inFlightResponse;
    }

    const requestPromise = (async (): Promise<WalletNFTsResponse> => {
        let nfts: ExternalNFT[] = [];
        let usedSource: 'alchemy' | 'moralis' | 'blockchain' | 'hybrid' = 'blockchain';

        try {
            const startTime = Date.now();

            // Strategy: Parallel execution for 'auto' mode (best performance)
            // - Blockchain: Known marketplace contracts (fast, no rate limits)
            // - Alchemy: Complete wallet inventory (1 API call)

            let blockchainNFTs: ExternalNFT[] = [];
            let alchemyNFTs: ExternalNFT[] = [];

            // PARALLEL execution in auto mode for best performance
            if (source === 'auto') {
                devLog.info('?? [Hybrid] Starting parallel fetch: Blockchain + Alchemy Discovery');

                const [blockchainResult, alchemyDiscoveryResult] = await Promise.allSettled([
                    // Step 1: Blockchain query (known contracts, identifiers only)
                    (async () => {
                        const contracts = await getKnownContractAddresses();
                        devLog.info(`  ? Found ${contracts.length} known contracts in marketplace`);
                        if (contracts.length === 0) return [];

                        const bcNFTs = await getWalletNFTsFromBlockchain(
                            walletAddress as Address,
                            contracts,
                            { identifiersOnly: true }
                        );
                        return mapDiscoveredToFallbackNFTs(bcNFTs);
                    })(),
                    // Step 2: Alchemy discovery (lightweight - only contract+tokenId)
                    discoverNFTsViaAlchemy(walletAddress)
                ]);

                // Process blockchain result (known contracts)
                if (blockchainResult.status === 'fulfilled') {
                    blockchainNFTs = blockchainResult.value;
                    devLog.info(`? Blockchain: ${blockchainNFTs.length} NFTs from known contracts (${Date.now() - startTime}ms)`);
                } else {
                    devLog.warn('?? Blockchain query failed:', blockchainResult.reason);
                }

                // Process Alchemy discovery result
                if (alchemyDiscoveryResult.status === 'fulfilled') {
                    const discoveredNFTs = alchemyDiscoveryResult.value;
                    devLog.info(`? Alchemy Discovery: ${discoveredNFTs.length} NFTs found`);

                    // Step 3: Filter out already-fetched NFTs
                    const knownKeys = new Set(
                        blockchainNFTs.map(nft => `${nft.contractAddress.toLowerCase()}-${nft.tokenId}`)
                    );

                    const unknownNFTs = discoveredNFTs.filter(nft => {
                        const key = `${nft.contractAddress.toLowerCase()}-${nft.tokenId}`;
                        return !knownKeys.has(key);
                    });

                    devLog.info(`  ? ${unknownNFTs.length} unknown NFTs (not in marketplace contracts)`);

                    // Step 4: Discovery-only contract for unknown NFTs.
                    // Metadata enrichment happens via standard DB sync worker path.
                    if (unknownNFTs.length > 0) {
                        alchemyNFTs = mapDiscoveredToFallbackNFTs(unknownNFTs);
                        devLog.info(`  ? Discovery-only fallback: ${alchemyNFTs.length} unknown NFTs queued for DB enrichment`);
                    }
                } else {
                    devLog.error('? Alchemy discovery failed:', alchemyDiscoveryResult.reason);
                    devLog.error('   Error details:', JSON.stringify(alchemyDiscoveryResult.reason, null, 2));

                    // Fallback 1: Moralis discovery (if key configured)
                    try {
                        devLog.info('?? [Hybrid] Trying Moralis discovery fallback...');
                        const moralisDiscoveredNFTs = await discoverNFTsViaMoralis(walletAddress);
                        devLog.info(`? Moralis Discovery: ${moralisDiscoveredNFTs.length} NFTs found`);

                        const knownKeys = new Set(
                            blockchainNFTs.map(nft => `${nft.contractAddress.toLowerCase()}-${nft.tokenId}`)
                        );

                        const unknownNFTs = moralisDiscoveredNFTs.filter(nft => {
                            const key = `${nft.contractAddress.toLowerCase()}-${nft.tokenId}`;
                            return !knownKeys.has(key);
                        });

                        if (unknownNFTs.length > 0) {
                            alchemyNFTs = mapDiscoveredToFallbackNFTs(unknownNFTs);
                            devLog.info(`? Moralis discovery-only fallback queued ${alchemyNFTs.length} NFTs for DB enrichment`);
                        }
                    } catch (moralisFallbackError) {
                        devLog.warn('?? Moralis discovery fallback failed, keeping blockchain-only result', moralisFallbackError);
                    }
                }
            }
            // SEQUENTIAL execution for specific source modes
            else if (source === 'blockchain') {
                devLog.info('?? Using blockchain-only mode');
                const contracts = await getKnownContractAddresses();
                devLog.info(`  ? ${contracts.length} known contracts`);

                if (contracts.length > 0) {
                    const bcNFTs = await getWalletNFTsFromBlockchain(
                        walletAddress as Address,
                        contracts,
                        { identifiersOnly: true }
                    );
                    blockchainNFTs = mapDiscoveredToFallbackNFTs(bcNFTs);
                    devLog.info(`? Found ${blockchainNFTs.length} NFTs via blockchain`);
                }
            }
            else if (source === 'alchemy') {
                const discovered = await discoverNFTsViaAlchemy(walletAddress);
                alchemyNFTs = mapDiscoveredToFallbackNFTs(discovered);
                devLog.info(`? Found ${alchemyNFTs.length} NFT identifiers via Alchemy discovery`);
            }
            else if (source === 'moralis') {
                const discovered = await discoverNFTsViaMoralis(walletAddress);
                alchemyNFTs = mapDiscoveredToFallbackNFTs(discovered);
                devLog.info(`? Found ${alchemyNFTs.length} NFT identifiers via Moralis discovery`);
            }

            // SIMPLE MERGE: Combine both lists (no deduplication needed now)
            if (source === 'auto' && (blockchainNFTs.length > 0 || alchemyNFTs.length > 0)) {
                // In new mode: blockchain + additional (non-overlapping)
                nfts = [...blockchainNFTs, ...alchemyNFTs];
                usedSource = 'hybrid';

                const totalTime = Date.now() - startTime;
                devLog.info(`? [Hybrid] ${nfts.length} total NFTs (${blockchainNFTs.length} known + ${alchemyNFTs.length} additional) in ${totalTime}ms`);
            } else if (blockchainNFTs.length > 0) {
                nfts = blockchainNFTs;
                usedSource = 'blockchain';
                devLog.info(`? Blockchain-only: ${nfts.length} NFTs in ${Date.now() - startTime}ms`);
            } else if (alchemyNFTs.length > 0) {
                nfts = alchemyNFTs;
                usedSource = 'alchemy';
                devLog.info(`? Alchemy-only: ${nfts.length} NFTs in ${Date.now() - startTime}ms`);
            }

            devLog.info(`🧾 [Wallet NFTs API] Final source=${usedSource}, total=${nfts.length}`);
            devLog.info('   ↳ Final identifier sample:', nfts.slice(0, 10).map((nft) => `${nft.contractAddress}:${nft.tokenId}`));

            if (!skipPersist) {
                // Persist opportunistically. If DB is unavailable, still return discovery response.
                try {
                    await persistWalletNFTsToDatabase(walletAddress, nfts);
                } catch (persistError) {
                    devLog.warn(
                        '⚠️ [Wallet NFTs API] Persistence unavailable, returning discovery-only payload',
                        persistError
                    );
                }
            } else {
                devLog.info('⏭️ [Wallet NFTs API] skipPersist=true - skipping DB persistence/enrichment side effects');
            }

            // Empty result is OK (wallet might be empty)

        } catch (apiError) {
            devLog.error('❌ API request failed:', apiError);
            throw apiError;
        }

        return {
            success: true,
            data: nfts,
            total: nfts.length,
            source: usedSource
        };
    })();

    walletNftsInFlight.set(cacheKey, requestPromise);

    try {
        const payload = await requestPromise;

        walletNftsResponseCache.set(cacheKey, {
            expiresAt: Date.now() + WALLET_NFTS_CACHE_TTL_MS,
            payload
        });

        await setSharedCacheValue(sharedCacheKey, payload, WALLET_NFTS_SHARED_CACHE_TTL_SECONDS);

        const response = apiSuccess(payload);
        response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=20');
        response.headers.set('X-Cache', 'MISS');
        return response;
    } finally {
        walletNftsInFlight.delete(cacheKey);
    }
}, {
    rateLimit: {
        maxRequests: 20,
        windowSeconds: 60,
    }
});

export { type ExternalNFT, type WalletNFTsResponse };
