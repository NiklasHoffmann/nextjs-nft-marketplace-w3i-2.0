/**
 * Cancel Listing Modal (REFACTORED)
 * 
 * Uses BaseModal for consistent modal behavior.
 * Reduced from 140 lines to ~80 lines.
 */
'use client'
import { memo, useState, useCallback } from 'react';
import { BaseModal } from '@/components/core/Modal';
import { useTransactionService } from '@/services/blockchain';

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

    // Transaction service
    const txService = useTransactionService();

    const handleConfirm = useCallback(async () => {
        setIsSubmitting(true);

        try {
            console.log('🚫 Cancelling listing:', { listingId, contractAddress, tokenId });

            const result = await txService.cancelListing({
                listingId,
                contractAddress,
                tokenId,
                onProgress: (step) => {
                    console.log('🔄 Cancel step:', step);
                },
                onError: (error) => {
                    console.error('❌ Cancel error:', error);
                }
            });

            if (result.success) {
                console.log('✅ Listing cancelled! TX:', result.txHash);
                onClose();
            } else {
                throw new Error(result.error || 'Cancellation failed');
            }
        } catch (error) {
            console.error('Failed to cancel listing:', error);
            alert('Failed to cancel listing. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [listingId, contractAddress, tokenId, txService, onClose]);

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Cancel Listing?"
            size="md"
            disableBackdropClick={isSubmitting}
            disableEscapeKey={isSubmitting}
            footer={
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
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
