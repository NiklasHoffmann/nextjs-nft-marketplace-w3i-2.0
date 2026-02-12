/**
 * Cancel Listing Modal (REFACTORED)
 * 
 * Uses BaseModal for consistent modal behavior.
 * Reduced from 140 lines to ~80 lines.
 */
'use client'
import { memo, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BaseModal } from '@/components/core/Modal';
import { useTransactionService } from '@/services/blockchain';
import { useMarketplaceItems } from '@/contexts/marketplace-items';
import { useWalletNFTs } from '@/contexts/wallet-nfts';
import { useAccount } from 'wagmi';
import { devLog } from '@/utils';

interface CancelListingModalProps {
    isOpen: boolean;
    onClose: () => void; listingId: string; contractAddress: string;
    tokenId: string;
    nftName?: string;
    price: string;
}

function CancelListingModal({
    isOpen,
    onClose,
    listingId,
    contractAddress,
    tokenId,
    nftName,
    price
}: CancelListingModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelStep, setCancelStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Hooks
    const router = useRouter();
    const { address } = useAccount();
    const txService = useTransactionService();
    const { removeNFT } = useMarketplaceItems();
    const { refresh: refreshWallet } = useWalletNFTs();

    // Auto-close and reload on success after 2 seconds
    useEffect(() => {
        if (cancelStep === 'success') {
            const timer = setTimeout(() => {
                onClose();
                // Reload the page to reflect the updated listing status
                window.location.reload();
            }, 2000);

            return () => clearTimeout(timer);
        }
        return undefined;
    }, [cancelStep, onClose]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setCancelStep('confirm');
            setErrorMessage(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleConfirm = useCallback(async () => {
        setIsSubmitting(true);
        setCancelStep('processing');
        setErrorMessage(null);

        try {
            devLog.info('🚫 Cancelling listing:', { listingId, contractAddress, tokenId });

            const result = await txService.cancelListing({
                listingId,
                contractAddress,
                tokenId,
                onProgress: (step) => {
                    devLog.info('🔄 Cancel step:', step);
                },
                onError: (error) => {
                    devLog.error('❌ Cancel error:', error);
                    setErrorMessage(error);
                },
                onSuccess: (result) => {
                    devLog.info('✅ Listing cancelled! TX:', result.txHash);
                    setCancelStep('success');
                    // Modal will auto-close after 2s (see useEffect)
                },
                onPostTransaction: async () => {
                    // Force immediate sync from TheGraph via API
                    devLog.info('🔄 Triggering immediate marketplace sync...');
                    try {
                        await fetch('/api/marketplace/sync', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'force' })
                        });
                        devLog.info('✅ Marketplace sync triggered');
                    } catch (error) {
                        devLog.error('❌ Failed to trigger sync:', error);
                    }

                    // Remove NFT from marketplace cache
                    removeNFT(contractAddress, tokenId);

                    // Refresh seller's wallet (NFT goes back to wallet)
                    await refreshWallet();
                }
            });

            if (!result.success && result.error) {
                throw new Error(result.error);
            }
        } catch (error) {
            devLog.error('Failed to cancel listing:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Failed to cancel listing. Please try again.');
            setCancelStep('error');
        } finally {
            setIsSubmitting(false);
        }
    }, [listingId, contractAddress, tokenId, txService, removeNFT, refreshWallet]);

    const handleClose = useCallback(() => {
        if (!isSubmitting && cancelStep !== 'processing') {
            onClose();
        }
    }, [isSubmitting, cancelStep, onClose]);

    // Render different content based on step
    if (cancelStep === 'success') {
        return (
            <BaseModal
                isOpen={isOpen}
                onClose={handleClose}
                title="Listing Cancelled"
                size="md"
                disableBackdropClick={true}
                disableEscapeKey={true}
            >
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Successfully Cancelled!</h3>
                    <p className="text-gray-600 mb-2">
                        Your listing has been cancelled and the NFT is now back in your wallet.
                    </p>
                    <p className="text-sm text-gray-500">
                        Redirecting to updated page...
                    </p>
                </div>
            </BaseModal>
        );
    }

    if (cancelStep === 'error') {
        return (
            <BaseModal
                isOpen={isOpen}
                onClose={handleClose}
                title="Cancellation Failed"
                size="md"
                footer={
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                }
            >
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Cancellation Failed</h3>
                    <p className="text-gray-600 mb-4">
                        {errorMessage || 'An error occurred while cancelling the listing. Please try again.'}
                    </p>
                </div>
            </BaseModal>
        );
    }

    if (cancelStep === 'processing') {
        return (
            <BaseModal
                isOpen={isOpen}
                onClose={handleClose}
                title="Cancelling Listing"
                size="md"
                disableBackdropClick={true}
                disableEscapeKey={true}
            >
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-pulse">
                        <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Cancellation...</h3>
                    <p className="text-gray-600 mb-2">
                        Please confirm the transaction in your wallet
                    </p>
                    <p className="text-sm text-gray-500">
                        This may take a few moments
                    </p>
                </div>
            </BaseModal>
        );
    }

    // Default: confirm step
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Cancel Listing?"
            size="md"
            disableBackdropClick={isSubmitting}
            disableEscapeKey={isSubmitting}
            footer={
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Keep Listing
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Cancelling...' : 'Cancel Listing'}
                    </button>
                </div>
            }
        >
            {/* Warning Icon */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <p className="text-gray-600">
                    Are you sure you want to cancel this listing? This action cannot be undone.
                </p>
            </div>

            {/* NFT Info */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                {nftName && (
                    <p className="font-semibold text-gray-900 mb-1">{nftName}</p>
                )}
                <p className="text-sm text-gray-600">Token ID: {tokenId}</p>
                <p className="text-sm text-gray-600 mt-2">Current Price: {price} ETH</p>
            </div>
        </BaseModal>
    );
}

export default memo(CancelListingModal);
