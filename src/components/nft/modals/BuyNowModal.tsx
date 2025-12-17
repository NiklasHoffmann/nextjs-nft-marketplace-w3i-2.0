'use client';
import { memo, useState, useCallback, useMemo } from 'react';
import { formatEther } from '@/utils';
import { useMarketplaceFees } from '@/app/sell/hooks/useMarketplaceFees';
import { useMarketplaceContracts } from '@/app/sell/hooks/useMarketplaceContracts';

interface BuyNowModalProps {
    isOpen: boolean;
    onClose: () => void;
    contractAddress: string;
    tokenId: string;
    nftName?: string;
    nftImage?: string;
    price: string; // in wei
    seller: string;
    buyer?: string; // connected wallet address
}

function BuyNowModal({
    isOpen,
    onClose,
    contractAddress,
    tokenId,
    nftName,
    nftImage,
    price,
    seller,
    buyer
}: BuyNowModalProps) {
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseStep, setPurchaseStep] = useState<'review' | 'processing' | 'success' | 'error'>('review');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Get dynamic fees from contract
    const { marketplaceAddress } = useMarketplaceContracts();
    const { calculateFees, innovationFeePercentage, royaltyFeePercentage } = useMarketplaceFees({
        marketplaceAddress,
        contractAddress: contractAddress as `0x${string}`,
        tokenId
    });

    // Calculate fees and totals
    const calculations = useMemo(() => {
        const priceInEth = parseFloat(formatEther(price));
        const fees = calculateFees(priceInEth);
        const gasFee = 0.003; // Estimated gas fee in ETH
        const total = priceInEth + fees.marketplaceFee + fees.royaltyFee + gasFee;

        return {
            price: priceInEth,
            platformFee: fees.marketplaceFee,
            creatorRoyalty: fees.royaltyFee,
            gasFee,
            total,
            platformFeePercentage: innovationFeePercentage,
            royaltyFeePercentage
        };
    }, [price, calculateFees, innovationFeePercentage, royaltyFeePercentage]);

    const handlePurchase = useCallback(async () => {
        setIsPurchasing(true);
        setPurchaseStep('processing');
        setErrorMessage(null);

        try {
            // TODO: Implement actual contract call
            console.log('Purchasing NFT:', {
                contractAddress,
                tokenId,
                price,
                seller,
                buyer,
                total: calculations.total
            });

            // Simulate blockchain transaction
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Simulate random success/failure for demo
            const success = Math.random() > 0.1; // 90% success rate for demo

            if (success) {
                setPurchaseStep('success');
                // Auto close after 3 seconds on success
                setTimeout(() => {
                    onClose();
                    setPurchaseStep('review');
                }, 3000);
            } else {
                throw new Error('Transaction failed');
            }
        } catch (error) {
            console.error('Purchase failed:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Purchase failed. Please try again.');
            setPurchaseStep('error');
        } finally {
            setIsPurchasing(false);
        }
    }, [contractAddress, tokenId, price, seller, buyer, calculations.total, onClose]);

    const handleClose = useCallback(() => {
        if (!isPurchasing) {
            onClose();
            setPurchaseStep('review');
            setErrorMessage(null);
        }
    }, [isPurchasing, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {purchaseStep === 'review' && 'Complete Purchase'}
                            {purchaseStep === 'processing' && 'Processing...'}
                            {purchaseStep === 'success' && 'Purchase Successful!'}
                            {purchaseStep === 'error' && 'Purchase Failed'}
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                            disabled={isPurchasing}
                            aria-label="Close"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Review Step */}
                    {purchaseStep === 'review' && (
                        <>
                            {/* NFT Preview */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                                <div className="flex gap-4">
                                    {nftImage && (
                                        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                                            <img
                                                src={nftImage}
                                                alt={nftName || `NFT #${tokenId}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {nftName || `NFT #${tokenId}`}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">Token ID: {tokenId}</p>
                                        <p className="text-xs text-gray-500 mt-1 font-mono truncate">
                                            {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Seller Info */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-600 mb-1">Seller</p>
                                <p className="font-mono text-sm text-gray-900">
                                    {seller.slice(0, 10)}...{seller.slice(-8)}
                                </p>
                            </div>

                            {/* Price Breakdown */}
                            <div className="mb-6 space-y-3">
                                <h3 className="font-semibold text-gray-900 mb-3">Price Breakdown</h3>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">NFT Price</span>
                                    <span className="font-semibold text-gray-900">
                                        {calculations.price.toFixed(4)} ETH
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">Platform Fee ({calculations.platformFeePercentage.toFixed(2)}%)</span>
                                    <span className="text-gray-700 text-sm">
                                        {calculations.platformFee.toFixed(4)} ETH
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">Creator Royalty ({calculations.royaltyFeePercentage.toFixed(2)}%)</span>
                                    <span className="text-gray-700 text-sm">
                                        {calculations.creatorRoyalty.toFixed(4)} ETH
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 text-sm">Estimated Gas Fee</span>
                                    <span className="text-gray-700 text-sm">
                                        ~{calculations.gasFee.toFixed(4)} ETH
                                    </span>
                                </div>

                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-900">Total</span>
                                        <span className="text-2xl font-bold text-blue-600">
                                            {calculations.total.toFixed(4)} ETH
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                <div className="flex gap-3">
                                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-yellow-900">Important</p>
                                        <p className="text-sm text-yellow-700 mt-1">
                                            This transaction is final and cannot be reversed. Please verify all details before proceeding.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isPurchasing}
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePurchase}
                                    disabled={isPurchasing}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm Purchase
                                </button>
                            </div>
                        </>
                    )}

                    {/* Processing Step */}
                    {purchaseStep === 'processing' && (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Transaction</h3>
                            <p className="text-gray-600 mb-4">Please confirm the transaction in your wallet...</p>
                            <div className="space-y-2 text-sm text-gray-500">
                                <p>• Waiting for wallet confirmation</p>
                                <p>• Broadcasting transaction to blockchain</p>
                                <p>• Waiting for confirmation</p>
                            </div>
                        </div>
                    )}

                    {/* Success Step */}
                    {purchaseStep === 'success' && (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Purchase Successful!</h3>
                            <p className="text-gray-600 mb-6">
                                Congratulations! You are now the owner of {nftName || `NFT #${tokenId}`}
                            </p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                            >
                                View My NFT
                            </button>
                        </div>
                    )}

                    {/* Error Step */}
                    {purchaseStep === 'error' && (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Transaction Failed</h3>
                            <p className="text-gray-600 mb-6">
                                {errorMessage || 'Something went wrong. Please try again.'}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setPurchaseStep('review');
                                        setErrorMessage(null);
                                    }}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default memo(BuyNowModal);
