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

    constructor(
        marketplaceAddress: `0x${string}`,
        createListingFn: any,
        ensureApprovalFn: any,
        checkWhitelistFn: any,
        notifications: any
    ) {
        this.marketplaceAddress = marketplaceAddress;
        this.createListingFn = createListingFn;
        this.ensureApprovalFn = ensureApprovalFn;
        this.checkWhitelistFn = checkWhitelistFn;
        this.notifications = notifications;
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

        const notifId = this.notifications.loading(
            'Creating Sale Listing',
            'Preparing your NFT for sale...'
        );

        try {
            // 1. Check collection whitelist
            console.log('🔍 [Step 1] Checking whitelist for:', data.selectedNFT.contractAddress);
            const isWhitelisted = await this.checkWhitelistFn(data.selectedNFT.contractAddress);
            console.log('✓ Whitelist status:', isWhitelisted);
            if (!isWhitelisted) {
                this.notifications.removeNotification(notifId);
                this.notifications.error(
                    'Collection Not Whitelisted',
                    'This collection is not approved for listing on the marketplace. Please contact an admin to request approval.'
                );
                return; // Exit gracefully
            }

            // 2. Ensure approval (smart - only if needed)
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
                this.notifications.removeNotification(notifId);
                this.notifications.warning(
                    'Approval Cancelled',
                    'NFT approval was cancelled. Your listing was not created.'
                );
                return; // Exit gracefully
            }

            // 3. Create listing
            console.log('🔍 [Step 3] Creating listing with params:', {
                tokenAddress: data.selectedNFT.contractAddress,
                tokenId: data.selectedNFT.tokenId,
                price: data.price,
                marketplaceAddress: this.marketplaceAddress
            });
            await this.createListingFn({
                tokenAddress: data.selectedNFT.contractAddress,
                tokenId: data.selectedNFT.tokenId,
                price: data.price,
                desiredTokenAddress: '0x0000000000000000000000000000000000000000',
                desiredTokenId: '0',
                buyerWhitelistEnabled: false,
                allowedBuyers: []
            });

            console.log('✅ [Step 3] Listing transaction sent to wallet');
            // Update to pending state - waiting for blockchain confirmation
            this.notifications.removeNotification(notifId);
            this.notifications.info(
                'Transaction Pending',
                'Waiting for blockchain confirmation...',
                { duration: 0 } // Don't auto-dismiss - SellPage useEffect will handle success/error
            );
        } catch (error: any) {
            console.error('❌ [ListingService] Error during listing:', {
                message: error.message,
                code: error.code,
                data: error.data,
                stack: error.stack
            });
            this.notifications.removeNotification(notifId);
            this.notifications.error(
                'Listing Failed',
                error.message || 'Failed to create listing'
            );
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

        const notifId = this.notifications.loading(
            'Creating Trade Offer',
            'Preparing your NFT for trade...'
        );

        try {
            // 1. Check collection whitelist
            const isWhitelisted = await this.checkWhitelistFn(data.selectedNFT.contractAddress);
            if (!isWhitelisted) {
                this.notifications.removeNotification(notifId);
                this.notifications.error(
                    'Collection Not Whitelisted',
                    'This collection is not approved for listing on the marketplace. Please contact an admin to request approval.'
                );
                return; // Exit gracefully
            }

            // 2. Ensure approval (smart - only if needed)
            const approved = await this.ensureApprovalFn();
            if (!approved) {
                this.notifications.removeNotification(notifId);
                this.notifications.warning(
                    'Approval Cancelled',
                    'NFT approval was cancelled. Your listing was not created.'
                );
                return; // Exit gracefully
            }

            // 3. Create trade listing
            await this.createListingFn({
                tokenAddress: data.selectedNFT.contractAddress,
                tokenId: data.selectedNFT.tokenId,
                price: '0', // No ETH price for pure trade
                desiredTokenAddress: data.targetNFT.contractAddress,
                desiredTokenId: data.targetNFT.tokenId,
                buyerWhitelistEnabled: false,
                allowedBuyers: []
            });

            // Update to pending state - waiting for blockchain confirmation
            this.notifications.removeNotification(notifId);
            this.notifications.info(
                'Transaction Pending',
                'Waiting for blockchain confirmation...',
                { duration: 0 } // Don't auto-dismiss - SellPage useEffect will handle success/error
            );
        } catch (error: any) {
            this.notifications.removeNotification(notifId);
            this.notifications.error(
                'Trade Offer Failed',
                error.message || 'Failed to create trade offer'
            );
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

        const notifId = this.notifications.loading(
            'Creating Hybrid Offer',
            'Preparing your NFT for hybrid listing...'
        );

        try {
            // 1. Check collection whitelist
            const isWhitelisted = await this.checkWhitelistFn(data.selectedNFT.contractAddress);
            if (!isWhitelisted) {
                this.notifications.removeNotification(notifId);
                this.notifications.error(
                    'Collection Not Whitelisted',
                    'This collection is not approved for listing on the marketplace. Please contact an admin to request approval.'
                );
                return; // Exit gracefully
            }

            // 2. Ensure approval
            const approved = await this.ensureApprovalFn();
            if (!approved) {
                this.notifications.removeNotification(notifId);
                this.notifications.warning(
                    'Approval Cancelled',
                    'NFT approval was cancelled. Your hybrid offer was not created.'
                );
                return; // Exit gracefully
            }

            // 3. Create hybrid listing
            await this.createListingFn({
                tokenAddress: data.selectedNFT.contractAddress,
                tokenId: data.selectedNFT.tokenId,
                price: data.price,
                desiredTokenAddress: data.targetNFT.contractAddress,
                desiredTokenId: data.targetNFT.tokenId,
                buyerWhitelistEnabled: false,
                allowedBuyers: []
            });

            // Update to pending state - waiting for blockchain confirmation
            this.notifications.removeNotification(notifId);
            this.notifications.info(
                'Transaction Pending',
                'Waiting for blockchain confirmation...',
                { duration: 0 } // Don't auto-dismiss - SellPage useEffect will handle success/error
            );
        } catch (error: any) {
            this.notifications.removeNotification(notifId);
            this.notifications.error(
                'Hybrid Offer Failed',
                error.message || 'Failed to create hybrid offer'
            );
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

        const notifId = this.notifications.loading(
            'Creating Batch Listings',
            `Preparing ${data.selectedNFTs.length} NFTs for listing...`
        );

        try {
            // 1. Check all collections are whitelisted
            const whitelistChecks = await Promise.all(
                data.selectedNFTs.map(nft => this.checkWhitelistFn(nft.contractAddress))
            );

            const notWhitelisted = data.selectedNFTs.filter((_, i) => !whitelistChecks[i]);
            if (notWhitelisted.length > 0) {
                this.notifications.removeNotification(notifId);
                throw new Error(`${notWhitelisted.length} collection(s) not whitelisted`);
            }

            // 2. Ensure approval for all (recommend approveAll)
            const approved = await this.ensureApprovalFn(true); // preferAll = true
            if (!approved) {
                this.notifications.removeNotification(notifId);
                throw new Error('Approval was cancelled or failed');
            }

            // 3. Create listings sequentially
            const results = { success: 0, failed: 0 };
            let currentNotifId = notifId;
            
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
                    
                    // Update progress during batch processing
                    const progress = results.success + results.failed;
                    const total = data.selectedNFTs.length;
                    this.notifications.removeNotification(currentNotifId);
                    currentNotifId = this.notifications.loading(
                        'Creating Batch Listings',
                        `Processing ${progress}/${total} NFTs...`
                    );
                } catch (err) {
                    results.failed++;
                    console.error(`Failed to list NFT ${nft.tokenId}:`, err);
                }
            }

            this.notifications.removeNotification(currentNotifId);
            
            if (results.failed === 0) {
                this.notifications.success(
                    'Batch Listing Complete!',
                    `Successfully listed ${results.success} NFTs`,
                    { duration: 8000 }
                );
            } else {
                this.notifications.warning(
                    'Batch Listing Partial Success',
                    `Listed ${results.success} NFTs, ${results.failed} failed`,
                    { duration: 10000 }
                );
            }
        } catch (error: any) {
            this.notifications.removeNotification(notifId);
            this.notifications.error(
                'Batch Listing Failed',
                error.message || 'Failed to create batch listings'
            );
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
