/**
 * Currency Fix Sync Service
 * 
 * Fixes currency field for listings where SubGraph didn't capture it correctly.
 * Reads currency directly from marketplace contract's getListing() function.
 * 
 * Run this after subgraph sync to fix missing currency data.
 */

import { createPublicClient, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { getDatabase } from '@/lib/mongodb';
import { GETTER_FACET_ABI } from '@/config/abis/getter-facet';
import { devLog } from '@/utils';

interface ListingFromContract {
    listingId: bigint;
    tokenAddress: Address;
    tokenId: bigint;
    erc1155Quantity: bigint;
    price: bigint;
    currency: Address;
    feeRate: number;
    seller: Address;
    buyerWhitelistEnabled: boolean;
    partialBuyEnabled: boolean;
    desiredTokenAddress: Address;
    desiredTokenId: bigint;
    desiredErc1155Quantity: bigint;
    // Note: currency might not be in the struct, we'll handle this separately
}

export class CurrencyFixSync {
    private client: ReturnType<typeof createPublicClient> | null = null;
    private marketplaceAddress: Address;
    private chainId: number;
    private rateLimitedUntil = 0;

    private static readonly MAX_RPC_RETRIES = 3;
    private static readonly RETRY_BASE_DELAY_MS = 1200;
    private static readonly CALL_DELAY_MS = 200;
    private static readonly RATE_LIMIT_COOLDOWN_MS = 90_000;

    constructor(
        marketplaceAddress: string = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '',
        rpcUrl: string = process.env.NEXT_PUBLIC_RPC_URL || ''
    ) {
        this.marketplaceAddress = marketplaceAddress as Address;
        this.chainId = 11155111; // Sepolia

        const resolvedRpcUrl = this.resolveRpcUrl(rpcUrl);

        if (!this.marketplaceAddress) {
            devLog.error('❌ [Currency Fix] Missing marketplace address');
            return;
        }

        if (!resolvedRpcUrl) {
            devLog.error('❌ [Currency Fix] No RPC URL configured. Set JSON_RPC_URL or ALCHEMY_URL/INFURA_URL to avoid public rate-limited RPC.');
            return;
        }

        // Create blockchain client
        this.client = createPublicClient({
            chain: sepolia,
            transport: http(resolvedRpcUrl)
        });

        devLog.info(`🔗 [Currency Fix] Using RPC endpoint: ${this.redactRpcUrl(resolvedRpcUrl)}`);
    }

    private resolveRpcUrl(explicitRpcUrl?: string): string {
        const candidates = [
            explicitRpcUrl,
            process.env.JSON_RPC_URL,
            process.env.ALCHEMY_URL,
            process.env.INFURA_URL,
            process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
            process.env.NEXT_PUBLIC_RPC_SEPOLIA,
            process.env.NEXT_PUBLIC_RPC_URL,
            'https://ethereum-sepolia-rpc.publicnode.com'
        ];

        const selected = candidates.find((url) => typeof url === 'string' && url.trim().length > 0);
        return selected?.trim() || '';
    }

    private redactRpcUrl(url: string): string {
        try {
            const parsed = new URL(url);
            return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
        } catch {
            return 'invalid-rpc-url';
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private isRateLimitError(error: unknown): boolean {
        const stack: unknown[] = [error];
        let depth = 0;

        while (stack.length > 0 && depth < 12) {
            const current = stack.pop();
            depth++;

            if (!current || typeof current !== 'object') {
                continue;
            }

            const maybeStatus = (current as { status?: unknown }).status;
            if (typeof maybeStatus === 'number' && maybeStatus === 429) {
                return true;
            }

            const maybeDetails = (current as { details?: unknown }).details;
            if (typeof maybeDetails === 'string' && maybeDetails.includes('429')) {
                return true;
            }

            const maybeMessage = (current as { message?: unknown }).message;
            if (typeof maybeMessage === 'string' && maybeMessage.includes('429')) {
                return true;
            }

            const maybeMeta = (current as { metaMessages?: unknown }).metaMessages;
            if (Array.isArray(maybeMeta) && maybeMeta.some((msg) => typeof msg === 'string' && msg.includes('429'))) {
                return true;
            }

            const maybeCause = (current as { cause?: unknown }).cause;
            if (maybeCause) {
                stack.push(maybeCause);
            }
        }

        return false;
    }

    private async readListingFromContract(listingId: bigint): Promise<ListingFromContract> {
        if (!this.client) {
            throw new Error('Currency Fix client not initialized');
        }

        let lastError: unknown = null;

        for (let attempt = 1; attempt <= CurrencyFixSync.MAX_RPC_RETRIES; attempt++) {
            try {
                const listing = await this.client.readContract({
                    address: this.marketplaceAddress,
                    abi: GETTER_FACET_ABI,
                    functionName: 'getListingByListingId',
                    args: [listingId]
                }) as ListingFromContract;

                return listing;
            } catch (error) {
                lastError = error;

                if (!this.isRateLimitError(error) || attempt === CurrencyFixSync.MAX_RPC_RETRIES) {
                    throw error;
                }

                const delayMs = CurrencyFixSync.RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
                devLog.warn(`⏳ [Currency Fix] RPC 429 for listing ${listingId.toString()} (attempt ${attempt}/${CurrencyFixSync.MAX_RPC_RETRIES}), retrying in ${delayMs}ms`);
                await this.sleep(delayMs);
            }
        }

        throw lastError instanceof Error ? lastError : new Error('Unknown contract read error');
    }

    /**
     * Fix currency for all listings with missing/incorrect currency
     */
    async fixAllListings(): Promise<{ fixed: number; errors: number }> {
        if (!this.client) {
            devLog.error('❌ [Currency Fix] Client not initialized');
            return { fixed: 0, errors: 0 };
        }

        devLog.info('\n🔧 [Currency Fix] Starting currency correction...');

        const db = await getDatabase();
        const collection = db.collection('marketplace_items');

        // Find all active listings with ETH (0x0) currency that might be incorrect
        const listings = await collection.find({
            active: true,
            isListed: true,
            $or: [
                { currency: '0x0000000000000000000000000000000000000000' },
                { currency: { $exists: false } },
                { currency: null }
            ]
        }).toArray();

        devLog.debug(`📊 [Currency Fix] Found ${listings.length} listings to check`);

        let fixed = 0;
        let errors = 0;

        if (this.rateLimitedUntil > Date.now()) {
            const secondsLeft = Math.ceil((this.rateLimitedUntil - Date.now()) / 1000);
            devLog.warn(`⏸️ [Currency Fix] Skipping run due to RPC cooldown (${secondsLeft}s remaining)`);
            return { fixed, errors };
        }

        for (const listing of listings) {
            try {
                // Read listing from contract
                const contractListing = await this.readListingFromContract(BigInt(listing.listingId));

                devLog.debug(`🔍 [Currency Fix] Listing ${listing.listingId} from contract:`, contractListing);
                
                // Skip if no currency available from contract
                if (!contractListing || typeof contractListing !== 'object') {
                    devLog.warn(`⚠️ [Currency Fix] Invalid contract data for listing ${listing.listingId}`);
                    errors++;
                    continue;
                }

                const contractCurrency = contractListing.currency?.toLowerCase();
                if (!contractCurrency) {
                    devLog.warn(`⚠️ [Currency Fix] Missing currency in contract data for listing ${listing.listingId}`);
                    errors++;
                    continue;
                }

                const currentCurrency = (listing.currency || '0x0000000000000000000000000000000000000000').toLowerCase();
                if (contractCurrency !== currentCurrency) {
                    await collection.updateOne(
                        { _id: listing._id },
                        { $set: { currency: contractCurrency } }
                    );
                    devLog.info(`✅ [Currency Fix] Updated listing ${listing.listingId} currency to ${contractCurrency}`);
                    fixed++;
                }

                // Small pacing delay to avoid bursting provider quotas.
                await this.sleep(CurrencyFixSync.CALL_DELAY_MS);
            } catch (error) {
                if (this.isRateLimitError(error)) {
                    this.rateLimitedUntil = Date.now() + CurrencyFixSync.RATE_LIMIT_COOLDOWN_MS;
                    const cooldownSeconds = Math.ceil(CurrencyFixSync.RATE_LIMIT_COOLDOWN_MS / 1000);
                    devLog.warn(`⏸️ [Currency Fix] RPC limit hit. Entering cooldown for ${cooldownSeconds}s.`);
                    errors++;
                    break;
                }

                devLog.error(`❌ [Currency Fix] Error fixing listing ${listing.listingId}:`, error);
                errors++;
            }
        }

        devLog.info(`✅ [Currency Fix] Completed: ${fixed} fixed, ${errors} errors`);
        return { fixed, errors };
    }

    /**
     * Fix currency for a specific listing
     */
    async fixListing(listingId: string): Promise<boolean> {
        if (!this.client) {
            devLog.error('❌ [Currency Fix] Client not initialized');
            return false;
        }

        try {
            devLog.debug(`🔧 [Currency Fix] Fixing listing ${listingId}...`);

            if (this.rateLimitedUntil > Date.now()) {
                const secondsLeft = Math.ceil((this.rateLimitedUntil - Date.now()) / 1000);
                devLog.warn(`⏸️ [Currency Fix] Skipping listing ${listingId} due to RPC cooldown (${secondsLeft}s remaining)`);
                return false;
            }

            // Read from contract
            const contractListing = await this.readListingFromContract(BigInt(listingId));

            devLog.debug(`🔍 [Currency Fix] Contract data:`, contractListing);

            const contractCurrency = contractListing.currency?.toLowerCase();
            if (!contractCurrency) {
                devLog.warn(`⚠️ [Currency Fix] Missing currency in contract data for listing ${listingId}`);
                return false;
            }

            const db = await getDatabase();
            const collection = db.collection('marketplace_items');
            await collection.updateOne(
                { listingId },
                { $set: { currency: contractCurrency } }
            );
            devLog.info(`✅ [Currency Fix] Updated listing ${listingId} currency to ${contractCurrency}`);
            return true;
        } catch (error) {
            if (this.isRateLimitError(error)) {
                this.rateLimitedUntil = Date.now() + CurrencyFixSync.RATE_LIMIT_COOLDOWN_MS;
                const cooldownSeconds = Math.ceil(CurrencyFixSync.RATE_LIMIT_COOLDOWN_MS / 1000);
                devLog.warn(`⏸️ [Currency Fix] RPC limit hit while fixing ${listingId}. Cooldown ${cooldownSeconds}s.`);
                return false;
            }

            devLog.error(`❌ [Currency Fix] Error fixing listing ${listingId}:`, error);
            return false;
        }
    }
}

// Singleton instance
let currencyFixSyncInstance: CurrencyFixSync | null = null;

export function getCurrencyFixSync(): CurrencyFixSync {
    if (!currencyFixSyncInstance) {
        currencyFixSyncInstance = new CurrencyFixSync();
    }
    return currencyFixSyncInstance;
}
