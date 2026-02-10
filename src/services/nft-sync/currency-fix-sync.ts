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

    constructor(
        marketplaceAddress: string = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || '',
        rpcUrl: string = process.env.NEXT_PUBLIC_RPC_URL || ''
    ) {
        this.marketplaceAddress = marketplaceAddress as Address;
        this.chainId = 11155111; // Sepolia

        // Create blockchain client
        this.client = createPublicClient({
            chain: sepolia,
            transport: http(rpcUrl)
        });
    }

    /**
     * Fix currency for all listings with missing/incorrect currency
     */
    async fixAllListings(): Promise<{ fixed: number; errors: number }> {
        if (!this.client) {
            console.error('❌ [Currency Fix] Client not initialized');
            return { fixed: 0, errors: 0 };
        }

        console.log('\n🔧 [Currency Fix] Starting currency correction...');

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

        console.log(`📊 [Currency Fix] Found ${listings.length} listings to check`);

        let fixed = 0;
        let errors = 0;

        for (const listing of listings) {
            try {
                // Read listing from contract
                const contractListing = await this.client.readContract({
                    address: this.marketplaceAddress,
                    abi: GETTER_FACET_ABI,
                    functionName: 'getListingByListingId',
                    args: [BigInt(listing.listingId)]
                }) as ListingFromContract;

                console.log(`🔍 [Currency Fix] Listing ${listing.listingId} from contract:`, contractListing);
                
                // Skip if no currency available from contract
                if (!contractListing || typeof contractListing !== 'object') {
                    console.warn(`⚠️ [Currency Fix] Invalid contract data for listing ${listing.listingId}`);
                    errors++;
                    continue;
                }

                const contractCurrency = contractListing.currency?.toLowerCase();
                if (!contractCurrency) {
                    console.warn(`⚠️ [Currency Fix] Missing currency in contract data for listing ${listing.listingId}`);
                    errors++;
                    continue;
                }

                const currentCurrency = (listing.currency || '0x0000000000000000000000000000000000000000').toLowerCase();
                if (contractCurrency !== currentCurrency) {
                    await collection.updateOne(
                        { _id: listing._id },
                        { $set: { currency: contractCurrency } }
                    );
                    console.log(`✅ [Currency Fix] Updated listing ${listing.listingId} currency to ${contractCurrency}`);
                    fixed++;
                }
            } catch (error) {
                console.error(`❌ [Currency Fix] Error fixing listing ${listing.listingId}:`, error);
                errors++;
            }
        }

        console.log(`✅ [Currency Fix] Completed: ${fixed} fixed, ${errors} errors`);
        return { fixed, errors };
    }

    /**
     * Fix currency for a specific listing
     */
    async fixListing(listingId: string): Promise<boolean> {
        if (!this.client) {
            console.error('❌ [Currency Fix] Client not initialized');
            return false;
        }

        try {
            console.log(`🔧 [Currency Fix] Fixing listing ${listingId}...`);

            // Read from contract
            const contractListing = await this.client.readContract({
                address: this.marketplaceAddress,
                abi: GETTER_FACET_ABI,
                functionName: 'getListingByListingId',
                args: [BigInt(listingId)]
            }) as ListingFromContract;

            console.log(`🔍 [Currency Fix] Contract data:`, contractListing);

            const contractCurrency = contractListing.currency?.toLowerCase();
            if (!contractCurrency) {
                console.warn(`⚠️ [Currency Fix] Missing currency in contract data for listing ${listingId}`);
                return false;
            }

            const db = await getDatabase();
            const collection = db.collection('marketplace_items');
            await collection.updateOne(
                { listingId },
                { $set: { currency: contractCurrency } }
            );
            console.log(`✅ [Currency Fix] Updated listing ${listingId} currency to ${contractCurrency}`);
            return true;
        } catch (error) {
            console.error(`❌ [Currency Fix] Error fixing listing ${listingId}:`, error);
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
