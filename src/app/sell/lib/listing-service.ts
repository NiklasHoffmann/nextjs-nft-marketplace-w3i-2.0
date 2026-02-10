/**
 * Business logic for handling marketplace listings
 * 
 * Integrates with:
 * - useNFTApproval: Check & handle NFT approvals
 * - useMarketplaceListing: Create/update/cancel listings
 * - useCollectionWhitelist: Validate collection is allowed
 * - useNotifications: User feedback
 */

import { TransactionData, BatchTransactionData } from '../types';

/**
 * Service class for marketplace operations
 * Requires hooks to be called from React context
 */
export class ListingService {
    private marketplaceAddress: `0x${string}`;
    private createListingFn: any;
    private ensureApprovalFn: any;
    private checkWhitelistFn: any;
    private notifications: any;
    private onProgressCallback?: (step: 'whitelist' | 'approval' | 'signing' | 'pending' | 'success' | 'error', txHash?: string) => void;

    constructor(
        marketplaceAddress: `0x${string}`,
        createListingFn: any,
        ensureApprovalFn: any,
        checkWhitelistFn: any,
        notifications: any,
        onProgress?: (step: 'whitelist' | 'approval' | 'signing' | 'pending' | 'success' | 'error', txHash?: string) => void
    ) {
        this.marketplaceAddress = marketplaceAddress;
        this.createListingFn = createListingFn;
        this.ensureApprovalFn = ensureApprovalFn;
        this.checkWhitelistFn = checkWhitelistFn;
        this.notifications = notifications;
        this.onProgressCallback = onProgress;
    }

    private reportProgress(step: 'whitelist' | 'approval' | 'signing' | 'pending' | 'success' | 'error', txHash?: string) {
        if (this.onProgressCallback) {
            this.onProgressCallback(step, txHash);
        }
    }

    /**
     * Creates a single NFT listing for sale
     */
    async listNFTForSale(data: TransactionData): Promise<void> {
        console.log('🔵 [ListingService] Starting listNFTForSale');
        console.log('📦 NFT Data:', {
            contractAddress: data.selectedNFT?.contractAddress,
            tokenId: data.selectedNFT?.tokenId,
            price: data.price,
            currency: data.currency
        });

        if (!data.selectedNFT || !data.price) {
            console.error('❌ Missing required data');
            throw new Error('Missing required data for sale listing');
        }

        try {
            // 1. Check collection whitelist
            this.reportProgress('whitelist');
            console.log('🔍 [Step 1] Checking whitelist for:', data.selectedNFT.contractAddress);
            const isWhitelisted = await this.checkWhitelistFn(data.selectedNFT.contractAddress);
            console.log('✓ Whitelist status:', isWhitelisted);
            if (!isWhitelisted) {
                this.reportProgress('error');
                throw new Error('Collection Not Whitelisted');
            }

            // 2. Ensure approval (smart - only if needed)
            this.reportProgress('approval');
            console.log('🔍 [Step 2] Checking/Ensuring NFT approval');
            console.log('📋 Approval params:', {
                nftContract: data.selectedNFT.contractAddress,
                tokenId: data.selectedNFT.tokenId,
                marketplace: this.marketplaceAddress
            });

            if (!this.ensureApprovalFn) {
                console.error('❌ ensureApprovalFn is not defined!');
                throw new Error('Approval function not available');
            }

            const approved = await this.ensureApprovalFn();
            console.log('✓ Approval status:', approved);
            if (!approved) {
                console.warn('⚠️ User cancelled approval');
                this.reportProgress('error');
                throw new Error('Approval Cancelled');
            }

            // 3. Create listing
            this.reportProgress('signing');
            console.log('🔍 [Step 3] Creating listing with params:', {
                tokenAddress: data.selectedNFT.contractAddress,
                tokenId: data.selectedNFT.tokenId,
                price: data.price,
                currency: data.currency,
                marketplaceAddress: this.marketplaceAddress
            });
            await this.createListingFn({
                tokenAddress: data.selectedNFT.contractAddress,
                tokenId: data.selectedNFT.tokenId,
                price: data.price,
                currency: data.currency, // Pass currency to contract
                desiredTokenAddress: '0x0000000000000000000000000000000000000000',
                desiredTokenId: '0',
                buyerWhitelistEnabled: data.buyerWhitelistEnabled || false,
                allowedBuyers: data.allowedBuyers || []
            });

            console.log('✅ [Step 3] Listing transaction sent to wallet');
        } catch (error: any) {
            this.reportProgress('error');
            console.error('❌ [ListingService] Error during listing:', error.message);
            throw error;
        }
    }

    /**
     * Creates a trade offer for an NFT
     */
    async createTradeOffer(data: TransactionData): Promise<void> {
        if (!data.selectedNFT || !data.targetNFT) {
            throw new Error('Missing required data for trade offer');
        }

        try {
            // 1. Check collection whitelist
            const isWhitelisted = await this.checkWhitelistFn(data.selectedNFT.contractAddress);
            if (!isWhitelisted) {
                throw new Error('Collection Not Whitelisted');
            }

            // 2. Ensure approval (smart - only if needed)
            const approved = await this.ensureApprovalFn();
            if (!approved) {
                throw new Error('Approval Cancelled');
            }

            // 3. Create trade listing
            await this.createListingFn({
                tokenAddress: data.selectedNFT.contractAddress,
                tokenId: data.selectedNFT.tokenId,
                price: '0', // No ETH price for pure trade
                desiredTokenAddress: data.targetNFT.contractAddress,
                desiredTokenId: data.targetNFT.tokenId,
                buyerWhitelistEnabled: data.buyerWhitelistEnabled || false,
                allowedBuyers: data.allowedBuyers || []
            });
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Creates a hybrid offer (trade + sale)
     */
    async createHybridOffer(data: TransactionData): Promise<void> {
        if (!data.selectedNFT || !data.price || !data.targetNFT) {
            throw new Error('Missing required data for hybrid offer');
        }

        try {
            // 1. Check collection whitelist
            const isWhitelisted = await this.checkWhitelistFn(data.selectedNFT.contractAddress);
            if (!isWhitelisted) {
                throw new Error('Collection Not Whitelisted');
            }

            // 2. Ensure approval
            const approved = await this.ensureApprovalFn();
            if (!approved) {
                throw new Error('Approval Cancelled');
            }

            // 3. Create hybrid listing
            await this.createListingFn({
                tokenAddress: data.selectedNFT.contractAddress,
                tokenId: data.selectedNFT.tokenId,
                price: data.price,
                desiredTokenAddress: data.targetNFT.contractAddress,
                desiredTokenId: data.targetNFT.tokenId,
                buyerWhitelistEnabled: data.buyerWhitelistEnabled || false,
                allowedBuyers: data.allowedBuyers || []
            });
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Creates multiple listings in batch
     */
    async createBatchListings(data: BatchTransactionData): Promise<void> {
        if (!data.selectedNFTs || data.selectedNFTs.length === 0) {
            throw new Error('No NFTs selected for batch listing');
        }

        try {
            // 1. Check all collections are whitelisted
            const whitelistChecks = await Promise.all(
                data.selectedNFTs.map(nft => this.checkWhitelistFn(nft.contractAddress))
            );

            const notWhitelisted = data.selectedNFTs.filter((_, i) => !whitelistChecks[i]);
            if (notWhitelisted.length > 0) {
                throw new Error(`${notWhitelisted.length} collection(s) not whitelisted`);
            }

            // 2. Ensure approval for all (recommend approveAll)
            const approved = await this.ensureApprovalFn(true); // preferAll = true
            if (!approved) {
                throw new Error('Approval was cancelled or failed');
            }

            // 3. Create listings sequentially
            const results = { success: 0, failed: 0 };

            for (let i = 0; i < data.selectedNFTs.length; i++) {
                const nft = data.selectedNFTs[i];
                if (!nft) {
                    results.failed++;
                    continue;
                }

                const price = this.calculateBatchPrice(data, i);

                try {
                    await this.createListingFn({
                        tokenAddress: nft.contractAddress,
                        tokenId: nft.tokenId,
                        price: price.toString(),
                        desiredTokenAddress: '0x0000000000000000000000000000000000000000',
                        desiredTokenId: '0',
                        buyerWhitelistEnabled: false,
                        allowedBuyers: []
                    });
                    results.success++;
                } catch (err) {
                    results.failed++;
                    console.error(`Failed to list NFT ${nft.tokenId}:`, err);
                }
            }

            console.log(`Batch listing complete: ${results.success} success, ${results.failed} failed`);
        } catch (error: any) {
            throw error;
        }
    }

    /**
     * Calculate price for NFT in batch listing
     */
    private calculateBatchPrice(data: BatchTransactionData, index: number): string {
        if (data.pricingType === 'fixed') {
            return data.fixedPrice || '0';
        } else {
            // Variable pricing (linear interpolation)
            const start = parseFloat(data.startPrice || '0');
            const end = parseFloat(data.endPrice || '0');
            const step = (end - start) / (data.selectedNFTs.length - 1);
            return (start + step * index).toFixed(4);
        }
    }
}
