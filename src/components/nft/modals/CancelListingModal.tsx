'use client'
import { memo, useState, useCallback } from 'react';

interface CancelListingModalProps {
    isOpen: boolean;
    onClose: () => void;
    contractAddress: string;
    tokenId: string;
    nftName?: string;
    price: string;
}

function CancelListingModal({
    isOpen,
    onClose,
    contractAddress,
    tokenId,
    nftName,
    price
}: CancelListingModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = useCallback(async () => {
        setIsSubmitting(true);

        try {
            // TODO: Implement contract call to cancel listing
            console.log('Cancelling listing:', { contractAddress, tokenId });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            alert('Listing cancelled successfully');
            onClose();
        } catch (error) {
            console.error('Failed to cancel listing:', error);
            alert('Failed to cancel listing. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [contractAddress, tokenId, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={isSubmitting ? undefined : onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Cancel Listing?</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                        disabled={isSubmitting}
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Warning Message */}
                <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                        Are you sure you want to cancel this listing? This action cannot be undone.
                    </p>

                    {/* NFT Info */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        {nftName && (
                            <p className="font-semibold text-gray-900 mb-1">{nftName}</p>
                        )}
                        <p className="text-sm text-gray-600">Token ID: {tokenId}</p>
                        <p className="text-sm text-gray-600 mt-2">Current Price: {price} ETH</p>
                    </div>
                </div>

                {/* Actions */}
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
            </div>
        </div>
    );
}

export default memo(CancelListingModal);
