'use client';

/**
 * Wallet NFTs Service
 *
 * Handles all API interactions for wallet NFT data.
 * Separated from context to follow Single Responsibility Principle.
 */

import { devLog } from '@/utils';
import { authFetch } from '@/lib/auth/user-session-client';
import type { EnrichedNFTDocument } from '@/types/marketplace/enriched-nft';

// External NFT data from Alchemy/Moralis
export interface ExternalNFT {
    contractAddress: string;
    tokenId: string;
    name?: string;
    description?: string;
    image?: string;
    imageOriginal?: string;
    images?: {
        thumb?: string | null;
        small?: string | null;
        card?: string | null;
        detail?: string | null;
        original?: string | null;
    };
    imageMeta?: {
        width?: number | null;
        height?: number | null;
        mimeType?: string | null;
    };
    blurDataURL?: string | null;
    animationUrl?: string;
    attributes?: Array<{
        trait_type: string;
        value: string | number;
    }>;
    contractName?: string;
    contractSymbol?: string;
    tokenType?: 'ERC721' | 'ERC1155';
    balance?: string;
}

// Enriched wallet NFT with marketplace data
export interface WalletNFT extends ExternalNFT {
    // Marketplace enrichment
    isListed?: boolean;
    listingPrice?: string;
    listingId?: string;
    seller?: string;
    currency?: string; // Payment token address (ETH = 0x0, WETH/USDC/etc = token address)
    listingType?: 'PURE_ETH' | 'SWAP_AND_ETH' | 'PURE_SWAP';
    listingStatus?: 'LISTED' | 'PARTIALLY_FILLED' | 'SOLD_OUT' | 'CANCELED' | 'INVALIDATED' | null;
    listingTokenStandard?: 'ERC721' | 'ERC1155' | null;
    erc1155QuantityListed?: string | null;
    remainingQuantity?: string | null;
    unitPrice?: string | null;
    partialBuyEnabled?: boolean;
    desiredContractAddress?: string;
    desiredTokenAddress?: string;
    desiredTokenId?: string;
    // Contract data from blockchain
    totalSupply?: number | null;
    owner?: string | null;
    tokenURI?: string | null;
    approved?: string | null;
    ownerBalance?: number | null;
    // Metadata enrichment from MongoDB
    category?: string;
    rarity?: string;
    insights?: {
        customTitle?: string;
        cardDescriptions?: string[];
        category?: string;
        rarity?: string;
    };
    // Stats from nft_stats collection
    stats?: {
        likeCount?: number;
        viewCount?: number;
        averageRating?: number;
        watchlistCount?: number;
        ratingCount?: number;
    };
    // Data quality flags
    hasMarketplaceData: boolean;
    hasInsightsData: boolean;
}

export class WalletNFTsService {
    private static readonly BACKGROUND_SYNC_COOLDOWN_MS = 75_000;
    private static readonly SNAPSHOT_CACHE_TTL_MS = 45_000;
    private static readonly COMPLETENESS_FORCE_SYNC_COOLDOWN_MS = 180_000;
    private static readonly DISCOVERY_GAP_CHECK_COOLDOWN_MS = 180_000;
    private static readonly DB_OUTAGE_COOLDOWN_MS = 60_000;
    private static readonly lastBackgroundSyncByWallet = new Map<string, number>();
    private static readonly lastCompletenessForceSyncByWallet = new Map<string, number>();
    private static readonly lastDiscoveryGapCheckByWallet = new Map<string, number>();
    private static readonly walletSnapshotCache = new Map<string, { expiresAt: number; nfts: WalletNFT[] }>();
    private static readonly walletFetchInFlight = new Map<string, Promise<WalletNFT[]>>();
    private static readonly backgroundSyncInFlight = new Map<string, Promise<void>>();
    private static readonly discoveryPersistInFlight = new Map<string, Promise<void>>();
    private static dbUnavailableUntil = 0;

    private static isDbLikelyUnavailable(): boolean {
        return Date.now() < this.dbUnavailableUntil;
    }

    private static markDbUnavailable(): void {
        this.dbUnavailableUntil = Date.now() + this.DB_OUTAGE_COOLDOWN_MS;
    }

    private static markDbAvailable(): void {
        this.dbUnavailableUntil = 0;
    }

    private static getCachedWalletSnapshot(walletAddress: string): WalletNFT[] | null {
        const normalizedWallet = walletAddress.toLowerCase();
        const cached = this.walletSnapshotCache.get(normalizedWallet);
        if (!cached) {
            return null;
        }

        if (cached.expiresAt <= Date.now()) {
            this.walletSnapshotCache.delete(normalizedWallet);
            return null;
        }

        return cached.nfts;
    }

    private static setCachedWalletSnapshot(walletAddress: string, nfts: WalletNFT[]): void {
        const normalizedWallet = walletAddress.toLowerCase();
        this.walletSnapshotCache.set(normalizedWallet, {
            expiresAt: Date.now() + this.SNAPSHOT_CACHE_TTL_MS,
            nfts,
        });
    }

    private static shouldRunCompletenessForceSync(walletAddress: string): boolean {
        const normalizedWallet = walletAddress.toLowerCase();
        const lastForcedAt = this.lastCompletenessForceSyncByWallet.get(normalizedWallet) || 0;
        return Date.now() - lastForcedAt >= this.COMPLETENESS_FORCE_SYNC_COOLDOWN_MS;
    }

    private static markCompletenessForceSync(walletAddress: string): void {
        this.lastCompletenessForceSyncByWallet.set(walletAddress.toLowerCase(), Date.now());
    }

    private static shouldRunDiscoveryGapCheck(walletAddress: string): boolean {
        const normalizedWallet = walletAddress.toLowerCase();
        const lastCheckedAt = this.lastDiscoveryGapCheckByWallet.get(normalizedWallet) || 0;
        return Date.now() - lastCheckedAt >= this.DISCOVERY_GAP_CHECK_COOLDOWN_MS;
    }

    private static markDiscoveryGapCheck(walletAddress: string): void {
        this.lastDiscoveryGapCheckByWallet.set(walletAddress.toLowerCase(), Date.now());
    }

    private static parseWalletNftsPayload(rawPayload: any): ExternalNFT[] {
        const payload = rawPayload?.data ?? rawPayload;
        const nestedPayload = payload?.data ?? payload?.nfts ?? null;

        const extracted: unknown[] = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.nfts)
                ? payload.nfts
                : Array.isArray(payload?.data)
                    ? payload.data
                    : Array.isArray(payload?.data?.nfts)
                        ? payload.data.nfts
                        : Array.isArray(nestedPayload)
                            ? nestedPayload
                            : [];

        return extracted
            .filter((nft): nft is ExternalNFT => Boolean(
                nft
                && typeof nft === 'object'
                && (nft as any).contractAddress
                && (nft as any).tokenId !== undefined
                && (nft as any).tokenId !== null
            ))
            .map((nft) => ({
                ...(nft as ExternalNFT),
                contractAddress: String((nft as any).contractAddress).toLowerCase(),
                tokenId: String((nft as any).tokenId),
            }));
    }

    private static async fetchDiscoveredWalletNFTs(walletAddress: string): Promise<ExternalNFT[] | null> {
        try {
            const response = await fetch(`/api/wallet/nfts?address=${walletAddress}&skipPersist=true`);
            if (!response.ok) {
                return null;
            }

            const body = await response.json();
            return this.parseWalletNftsPayload(body);
        } catch {
            return null;
        }
    }

    private static triggerDiscoveryPersistence(walletAddress: string): void {
        const normalizedWallet = walletAddress.toLowerCase();

        if (this.isDbLikelyUnavailable()) {
            return;
        }

        if (this.discoveryPersistInFlight.has(normalizedWallet)) {
            return;
        }

        const persistPromise = fetch(`/api/wallet/nfts?address=${walletAddress}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Discovery persistence failed (${response.status})`);
                }
            })
            .catch((error) => {
                devLog.warn('wallet-nfts', '⚠️ Background discovery persistence failed', error);
            })
            .finally(() => {
                this.discoveryPersistInFlight.delete(normalizedWallet);
            });

        this.discoveryPersistInFlight.set(normalizedWallet, persistPromise);
    }

    private static mergeDbSnapshotWithDiscoveredIdentifiers(
        dbNFTs: WalletNFT[],
        discoveredNFTs: ExternalNFT[]
    ): WalletNFT[] {
        const existingKeys = new Set(
            dbNFTs.map((nft) => `${nft.contractAddress.toLowerCase()}-${nft.tokenId}`)
        );

        const missingIdentifiers = discoveredNFTs.filter((nft) => {
            const key = `${nft.contractAddress.toLowerCase()}-${nft.tokenId}`;
            return !existingKeys.has(key);
        });

        if (missingIdentifiers.length === 0) {
            return dbNFTs;
        }

        const placeholders: WalletNFT[] = missingIdentifiers.map((nft) => ({
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            hasMarketplaceData: false,
            hasInsightsData: false,
        }));

        return [...dbNFTs, ...placeholders];
    }

    private static async performSync(walletAddress: string, force: boolean = false): Promise<void> {
        const syncUrl = force ? '/api/user/nfts/sync?force=true' : '/api/user/nfts/sync';
        const response = await authFetch(syncUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const syncResult = await response.json();
        if (syncResult?.success) {
            const { new: newCount, transferred, updated } = syncResult.data || {};
            devLog.success(`Background sync complete: ${newCount || 0} new, ${transferred || 0} transferred, ${updated || 0} updated`);
        }
    }

    private static triggerBackgroundSync(walletAddress: string, options: { force?: boolean } = {}): void {
        const normalizedWallet = walletAddress.toLowerCase();
        const force = options.force === true;

        if (this.backgroundSyncInFlight.has(normalizedWallet)) {
            devLog.info('wallet-nfts', `⏸️ Background sync already running for ${normalizedWallet.slice(0, 10)}...`);
            return;
        }

        const now = Date.now();
        const lastSyncAt = this.lastBackgroundSyncByWallet.get(normalizedWallet) || 0;
        const elapsed = now - lastSyncAt;

        if (!force && elapsed < this.BACKGROUND_SYNC_COOLDOWN_MS) {
            const waitSeconds = Math.ceil((this.BACKGROUND_SYNC_COOLDOWN_MS - elapsed) / 1000);
            devLog.info('wallet-nfts', `⏱️ Skipping background sync (cooldown ${waitSeconds}s remaining)`);
            return;
        }

        this.lastBackgroundSyncByWallet.set(normalizedWallet, now);

        const syncPromise = this.performSync(walletAddress, force)
            .catch(err => devLog.warn('Background sync failed:', err))
            .finally(() => {
                this.backgroundSyncInFlight.delete(normalizedWallet);
            });

        this.backgroundSyncInFlight.set(normalizedWallet, syncPromise);
    }

    private static mapDbNftToWalletNft(nft: any): WalletNFT {
        return {
            contractAddress: nft.contractAddress,
            tokenId: nft.tokenId,
            name: nft.metadata?.name,
            description: nft.metadata?.description,
            image: nft.metadata?.image,
            imageOriginal: nft.metadata?.imageOriginal,
            images: nft.metadata?.images,
            imageMeta: nft.metadata?.imageMeta,
            blurDataURL: nft.metadata?.blurDataURL,
            animationUrl: nft.metadata?.animationUrl,
            attributes: nft.metadata?.attributes,
            contractName: nft.contract?.name,
            contractSymbol: nft.contract?.symbol,
            tokenType: nft.contract?.contractType || 'ERC721',
            totalSupply: nft.contract?.totalSupply,
            owner: nft.contract?.owner || nft.currentOwner,
            tokenURI: nft.contract?.tokenURI,
            approved: nft.contract?.approved,
            ownerBalance: nft.contract?.ownerBalance,
            isListed: nft.isListed || false,
            listingPrice: nft.price ?? nft.listings?.[0]?.price,
            listingId: nft.listingId ?? nft.listings?.[0]?.listingId,
            seller: nft.seller ?? nft.listings?.[0]?.seller,
            currency: nft.currency ?? nft.listings?.[0]?.currency,
            listingType: nft.listingType ?? nft.listings?.[0]?.listingType,
            listingStatus: nft.listingStatus ?? nft.listings?.[0]?.status ?? null,
            listingTokenStandard: nft.listingTokenStandard ?? nft.listings?.[0]?.tokenStandard ?? null,
            erc1155QuantityListed: nft.erc1155QuantityListed ?? nft.listings?.[0]?.erc1155QuantityListed ?? null,
            remainingQuantity: nft.remainingQuantity ?? nft.listings?.[0]?.remainingQuantity ?? null,
            unitPrice: nft.unitPrice ?? nft.listings?.[0]?.unitPrice ?? null,
            partialBuyEnabled: nft.partialBuyEnabled ?? nft.listings?.[0]?.partialBuyEnabled ?? false,
            desiredContractAddress: nft.desiredContractAddress ?? nft.desiredTokenAddress ?? nft.listings?.[0]?.desiredContractAddress ?? nft.listings?.[0]?.desiredTokenAddress,
            desiredTokenAddress: nft.desiredTokenAddress ?? nft.desiredContractAddress ?? nft.listings?.[0]?.desiredTokenAddress ?? nft.listings?.[0]?.desiredContractAddress,
            desiredTokenId: nft.desiredTokenId ?? nft.listings?.[0]?.desiredTokenId,
            hasMarketplaceData: !!nft.listings?.length,
            hasInsightsData: !!nft.insights,
            insights: nft.insights,
            stats: nft.stats ? {
                likeCount: nft.stats.likeCount,
                viewCount: nft.stats.viewCount,
                averageRating: nft.stats.averageRating,
                watchlistCount: nft.stats.watchlistCount,
                ratingCount: nft.stats.ratingCount
            } : undefined
        };
    }

    private static async fetchWalletNFTsFromDb(walletAddress: string): Promise<WalletNFT[]> {
        if (this.isDbLikelyUnavailable()) {
            return [];
        }

        const dbResponse = await authFetch(`/api/user/nfts?walletAddress=${walletAddress}`);
        if (!dbResponse.ok) {
            if (dbResponse.status >= 500) {
                this.markDbUnavailable();
                devLog.warn('wallet-nfts', `⚠️ DB endpoint unavailable (${dbResponse.status}), temporarily switching to discovery-only mode`);
            }
            return [];
        }

        this.markDbAvailable();

        const dbResult = await dbResponse.json();
        if (!dbResult?.success || !Array.isArray(dbResult?.data?.nfts)) {
            return [];
        }

        return dbResult.data.nfts.map((nft: any) => this.mapDbNftToWalletNft(nft));
    }

    private static hasMeaningfulName(value: unknown): boolean {
        if (typeof value !== 'string') return false;
        const normalized = value.trim();
        if (!normalized) return false;
        if (/^unknown( nft)?$/i.test(normalized)) return false;
        if (/^0x[a-f0-9]{40}$/i.test(normalized)) return false;
        return true;
    }

    private static hasImageData(nft: WalletNFT): boolean {
        const candidates = [
            nft.image,
            nft.imageOriginal,
            nft.images?.thumb,
            nft.images?.small,
            nft.images?.card,
            nft.images?.detail,
            nft.images?.original,
        ];

        return candidates.some((value) => typeof value === 'string' && value.trim().length > 0);
    }

    private static isMetadataComplete(nft: WalletNFT): boolean {
        const hasName = this.hasMeaningfulName(nft.name);
        const hasImage = this.hasImageData(nft);
        const hasTokenURI = typeof nft.tokenURI === 'string' && nft.tokenURI.trim().length > 0;
        return hasName && hasImage && hasTokenURI;
    }

    /**
     * Fetch NFTs for the connected wallet from DB-first approach
     */
    static async fetchWalletNFTs(walletAddress: string, options: { forceSync?: boolean } = {}): Promise<WalletNFT[]> {
        devLog.info('\n🔵 [WalletNFTsService] ========== START (DB-First) ==========');
        devLog.info(`📍 Wallet: ${walletAddress}`);

        const normalizedWallet = walletAddress.toLowerCase();

        if (!options.forceSync) {
            const cachedSnapshot = this.getCachedWalletSnapshot(normalizedWallet);
            if (cachedSnapshot) {
                devLog.info(`⚡ Returning in-memory snapshot (${cachedSnapshot.length} NFTs)`);
                this.triggerBackgroundSync(walletAddress);
                return cachedSnapshot;
            }

            const existingInFlight = this.walletFetchInFlight.get(normalizedWallet);
            if (existingInFlight) {
                devLog.info('⏳ Reusing in-flight wallet fetch request');
                return existingInFlight;
            }
        }

        const fetchPromise = (async (): Promise<WalletNFT[]> => {

            if (options.forceSync) {
                devLog.info('🔄 Force sync requested - syncing first and bypassing cooldown/cache...');
                try {
                    await this.performSync(walletAddress, true);
                } catch (syncError) {
                    devLog.warn('wallet-nfts', '⚠️ Force sync failed, falling back to DB snapshot', syncError);
                }
            }

            // Step 1: Fast load from DB (instant)
            devLog.info('⚡ Step 1/2: Loading from database (instant)...');
            const walletNFTsFromDb = await this.fetchWalletNFTsFromDb(walletAddress);

            if (walletNFTsFromDb.length > 0) {
                const incompleteCount = walletNFTsFromDb.filter((nft) => !this.isMetadataComplete(nft)).length;

                if (incompleteCount > 0) {
                    if (this.shouldRunCompletenessForceSync(normalizedWallet)) {
                        devLog.warn('wallet-nfts', `⚠️ Detected ${incompleteCount}/${walletNFTsFromDb.length} incomplete DB NFTs, forcing sync before returning data`);
                        this.markCompletenessForceSync(normalizedWallet);
                        try {
                            await this.performSync(walletAddress, true);
                            const refreshedWalletNFTs = await this.fetchWalletNFTsFromDb(walletAddress);
                            if (refreshedWalletNFTs.length > 0) {
                                this.setCachedWalletSnapshot(normalizedWallet, refreshedWalletNFTs);
                                devLog.success(`Step 1/2 Complete: ${refreshedWalletNFTs.length} NFTs from refreshed database`);
                                devLog.info('🔄 Step 2/2: Background sync starting...');
                                this.triggerBackgroundSync(walletAddress);
                                devLog.success('[WalletNFTsService] ========== SUCCESS (DB Refreshed) ==========\n');
                                return refreshedWalletNFTs;
                            }
                        } catch (syncError) {
                            devLog.warn('wallet-nfts', '⚠️ Forced completeness sync failed, returning best available DB snapshot', syncError);
                        }
                    } else {
                        devLog.info('wallet-nfts', '⏱️ Skipping repeated completeness force-sync (cooldown active)');
                    }
                }

                if (!options.forceSync && this.shouldRunDiscoveryGapCheck(normalizedWallet)) {
                    this.markDiscoveryGapCheck(normalizedWallet);
                    const discoveredNFTs = await this.fetchDiscoveredWalletNFTs(walletAddress);

                    if (discoveredNFTs && discoveredNFTs.length > 0) {
                        const mergedWalletNFTs = this.mergeDbSnapshotWithDiscoveredIdentifiers(
                            walletNFTsFromDb,
                            discoveredNFTs
                        );

                        if (mergedWalletNFTs.length > walletNFTsFromDb.length) {
                            devLog.warn(
                                'wallet-nfts',
                                `⚠️ Discovery gap detected: db=${walletNFTsFromDb.length}, discovered=${discoveredNFTs.length}, merged=${mergedWalletNFTs.length}`
                            );

                            // Persist/enrich discovered gap NFTs in background so next loads are DB-fast.
                            this.triggerDiscoveryPersistence(walletAddress);

                            this.setCachedWalletSnapshot(normalizedWallet, mergedWalletNFTs);
                            this.triggerBackgroundSync(walletAddress);
                            return mergedWalletNFTs;
                        }
                    }
                }

                this.setCachedWalletSnapshot(normalizedWallet, walletNFTsFromDb);
                devLog.success(`Step 1/2 Complete: ${walletNFTsFromDb.length} NFTs from database`);
                devLog.info('🔄 Step 2/2: Background sync starting...');
                this.triggerBackgroundSync(walletAddress);
                devLog.success('[WalletNFTsService] ========== SUCCESS (DB Cache) ==========\n');
                return walletNFTsFromDb;
            }

            // Fallback: No DB data yet - run discovery and force DB enrichment via worker.
            devLog.warn('No DB data found, running discovery + forced DB enrichment...');
            devLog.info('⏳ Step 1/3: Fetching from /api/wallet/nfts...');
            const shouldSkipPersist = this.isDbLikelyUnavailable();
            const fallbackUrl = shouldSkipPersist
                ? `/api/wallet/nfts?address=${walletAddress}&skipPersist=true`
                : `/api/wallet/nfts?address=${walletAddress}`;

            let response = await fetch(fallbackUrl);

            if (!response.ok && !shouldSkipPersist) {
                // If DB persistence path fails, retry with side effects disabled.
                response = await fetch(`/api/wallet/nfts?address=${walletAddress}&skipPersist=true`);
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch wallet NFTs: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch wallet NFTs');
            }

            const externalNFTsRaw = result.data;
            const nestedPayload = externalNFTsRaw && typeof externalNFTsRaw === 'object'
                ? ((externalNFTsRaw as any).data ?? (externalNFTsRaw as any).nfts)
                : null;

            const externalNFTs: ExternalNFT[] = Array.isArray(externalNFTsRaw)
                ? externalNFTsRaw
                : Array.isArray((externalNFTsRaw as any)?.nfts)
                    ? (externalNFTsRaw as any).nfts
                    : Array.isArray((externalNFTsRaw as any)?.data)
                        ? (externalNFTsRaw as any).data
                        : Array.isArray((externalNFTsRaw as any)?.data?.nfts)
                            ? (externalNFTsRaw as any).data.nfts
                            : Array.isArray(nestedPayload)
                                ? nestedPayload
                                : [];

            if (
                !Array.isArray(externalNFTsRaw)
                && !Array.isArray((externalNFTsRaw as any)?.nfts)
                && !Array.isArray((externalNFTsRaw as any)?.data)
                && !Array.isArray((externalNFTsRaw as any)?.data?.nfts)
                && !Array.isArray(nestedPayload)
            ) {
                devLog.warn('Unexpected /api/wallet/nfts payload shape, defaulting to empty array', {
                    type: typeof externalNFTsRaw,
                    keys: externalNFTsRaw && typeof externalNFTsRaw === 'object' ? Object.keys(externalNFTsRaw) : []
                });
            }

            devLog.success(`Step 1/3 Complete: ${externalNFTs.length} NFTs from ${result.source || 'external API'}`);

            if (externalNFTs.length === 0) {
                this.setCachedWalletSnapshot(normalizedWallet, []);
                return [];
            }

            devLog.info('⏳ Step 2/3: Running forced sync worker...');
            try {
                await this.performSync(walletAddress, true);
            } catch (syncError) {
                devLog.warn('wallet-nfts', 'Forced sync failed after discovery', syncError);
            }

            devLog.info('⏳ Step 3/3: Waiting for DB-enriched wallet snapshot...');
            const DB_POLL_ATTEMPTS = 15;
            const DB_POLL_DELAY_MS = 800;

            for (let attempt = 1; attempt <= DB_POLL_ATTEMPTS; attempt++) {
                const refreshedFromDb = await this.fetchWalletNFTsFromDb(walletAddress);
                if (refreshedFromDb.length > 0) {
                    this.setCachedWalletSnapshot(normalizedWallet, refreshedFromDb);
                    devLog.success(`Step 3/3 Complete: DB enrichment ready on attempt ${attempt}/${DB_POLL_ATTEMPTS}`);
                    devLog.success('[WalletNFTsService] ========== SUCCESS (DB Enriched) ==========\n');
                    return refreshedFromDb;
                }

                if (attempt < DB_POLL_ATTEMPTS) {
                    await new Promise((resolve) => setTimeout(resolve, DB_POLL_DELAY_MS));
                }
            }

            devLog.warn('DB enrichment not ready in time; returning temporary discovery fallback to avoid false empty wallet state');
            const fallback = externalNFTs.map((nft) => ({
                ...nft,
                hasMarketplaceData: false,
                hasInsightsData: false,
            }));
            this.setCachedWalletSnapshot(normalizedWallet, fallback);
            return fallback;
        })();

        if (options.forceSync) {
            return fetchPromise;
        }

        this.walletFetchInFlight.set(normalizedWallet, fetchPromise);
        try {
            return await fetchPromise;
        } finally {
            this.walletFetchInFlight.delete(normalizedWallet);
        }
    }

    /**
     * Enrich external NFTs with marketplace data
     */
    static async enrichWithMarketplaceData(nfts: ExternalNFT[]): Promise<WalletNFT[]> {
        if (nfts.length === 0) return [];

        try {
            // Fetch all marketplace items to check listing status
            const response = await fetch('/api/marketplace/items?limit=100');
            const result = await response.json();

            if (!result.success) {
                devLog.warn('Failed to fetch marketplace data for enrichment');
                return nfts.map(nft => ({ ...nft, hasMarketplaceData: false, hasInsightsData: false }));
            }

            const marketplaceItems: EnrichedNFTDocument[] = result.data.items || [];

            // Create lookup map
            const marketplaceLookup = new Map<string, EnrichedNFTDocument>();
            marketplaceItems.forEach(item => {
                if (!item.contractAddress) return; // Skip invalid items
                const key = `${item.contractAddress.toLowerCase()}-${item.tokenId}`;
                marketplaceLookup.set(key, item);
            });

            // Enrich NFTs
            return nfts.map(nft => {
                // Return default state if missing contractAddress
                if (!nft.contractAddress) {
                    return {
                        ...nft,
                        isListed: false,
                        hasMarketplaceData: false,
                        hasInsightsData: false
                    };
                }

                const key = `${nft.contractAddress.toLowerCase()}-${nft.tokenId}`;
                const marketplaceData = marketplaceLookup.get(key);

                if (marketplaceData?.marketplace?.isListed) {
                    return {
                        ...nft,
                        isListed: true,
                        listingPrice: marketplaceData.marketplace.price?.toString(),
                        listingId: marketplaceData.listingId || undefined,
                        seller: marketplaceData.marketplace.seller || undefined,
                        currency: marketplaceData.marketplace.currency || undefined,
                        listingType: marketplaceData.marketplace.listingType || undefined,
                        hasMarketplaceData: true,
                        hasInsightsData: false
                    };
                }

                return {
                    ...nft,
                    isListed: false,
                    hasMarketplaceData: false,
                    hasInsightsData: false
                };
            });

        } catch (error) {
            devLog.error('Error enriching with marketplace data:', error);
            return nfts.map(nft => ({ ...nft, hasMarketplaceData: false, hasInsightsData: false }));
        }
    }

    /**
     * Fetch insights data for multiple contracts in parallel
     */
    static async fetchInsightsData(nfts: ExternalNFT[]): Promise<Map<string, any>> {
        if (nfts.length === 0) return new Map();

        try {
            const uniqueContracts = [...new Set(nfts.map(n => n.contractAddress))];

            const insightsPromises = uniqueContracts.map(async (contractAddress) => {
                try {
                    const response = await fetch(`/api/nft/insights?contractAddress=${contractAddress}`);
                    if (!response.ok) return { contractAddress, insights: [] };

                    const result = await response.json();
                    return {
                        contractAddress,
                        insights: result.success && result.data ? result.data : []
                    };
                } catch (error) {
                    devLog.warn(`Failed to fetch insights for ${contractAddress}`);
                    return { contractAddress, insights: [] };
                }
            });

            const insightsResults = await Promise.allSettled(insightsPromises);

            // Build lookup map
            const insightsLookup = new Map<string, any>();
            insightsResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    const { contractAddress, insights } = result.value;
                    if (!contractAddress || !Array.isArray(insights)) return; // Skip invalid data
                    insights.forEach(insight => {
                        const key = `${contractAddress.toLowerCase()}-${insight.tokenId || ''}`;
                        insightsLookup.set(key, insight);
                    });
                }
            });

            return insightsLookup;
        } catch (error) {
            devLog.error('Error fetching insights data:', error);
            return new Map();
        }
    }

    /**
     * Apply insights data to NFTs
     */
    static applyInsights(nfts: WalletNFT[], insightsLookup: Map<string, any>): WalletNFT[] {
        return nfts.map(nft => {
            // Skip insights lookup if missing contractAddress
            if (!nft.contractAddress) {
                return {
                    ...nft,
                    hasInsightsData: false
                };
            }

            const key = `${nft.contractAddress.toLowerCase()}-${nft.tokenId}`;
            const keyWithoutToken = `${nft.contractAddress.toLowerCase()}-`; // Collection-wide

            const specificInsights = insightsLookup.get(key);
            const collectionInsights = insightsLookup.get(keyWithoutToken);
            const insights = specificInsights || collectionInsights;

            if (insights) {
                return {
                    ...nft,
                    category: insights.category,
                    rarity: insights.rarity,
                    insights: {
                        customTitle: insights.customTitle,
                        cardDescriptions: insights.cardDescriptions,
                        category: insights.category,
                        rarity: insights.rarity
                    },
                    hasInsightsData: true
                };
            }

            return nft;
        });
    }
}