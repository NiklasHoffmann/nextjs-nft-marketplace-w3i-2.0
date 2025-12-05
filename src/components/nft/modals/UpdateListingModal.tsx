'use client'
import { memo, useState, useCallback } from 'react';

interface UpdateListingModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentPrice: string;
    contractAddress: string;
    tokenId: string;
    nftName?: string;
    // Current swap/trade settings
    currentDesiredContractAddress?: string;
    currentDesiredTokenId?: string;
}

function UpdateListingModal({
    isOpen,
    onClose,
    currentPrice,
    contractAddress,
    tokenId,
    nftName,
    currentDesiredContractAddress,
    currentDesiredTokenId
}: UpdateListingModalProps) {
    // Listing type: 'sale' or 'swap'
    const [listingType, setListingType] = useState<'sale' | 'swap'>(
        currentDesiredContractAddress && currentDesiredContractAddress !== '' ? 'swap' : 'sale'
    );

    const [newPrice, setNewPrice] = useState(currentPrice);
    const [desiredContractAddress, setDesiredContractAddress] = useState(currentDesiredContractAddress || '');
    const [desiredTokenId, setDesiredTokenId] = useState(currentDesiredTokenId || '');
    const [swapPrice, setSwapPrice] = useState(currentPrice); // Additional price for swap
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // TODO: Implement contract call to update listing
            const updateData = {
                contractAddress,
                tokenId,
                listingType,
                ...(listingType === 'sale'
                    ? { newPrice }
                    : { desiredContractAddress, desiredTokenId, price: swapPrice }
                )
            };

            console.log('Updating listing:', updateData);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (listingType === 'sale') {
                alert(`Listing price updated to ${newPrice} ETH`);
            } else {
                const priceInfo = swapPrice && swapPrice !== '0'
                    ? ` + ${swapPrice} ETH`
                    : '';
                alert(`Swap target updated to NFT ${desiredContractAddress} #${desiredTokenId}${priceInfo}`);
            }
            onClose();
        } catch (error) {
            console.error('Failed to update listing:', error);
            alert('Failed to update listing. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }, [contractAddress, tokenId, listingType, newPrice, desiredContractAddress, desiredTokenId, swapPrice, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Update Listing</h2>
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

                {/* NFT Info */}
                {nftName && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">NFT</p>
                        <p className="font-semibold text-gray-900">{nftName}</p>
                        <p className="text-xs text-gray-500 mt-1">Token ID: {tokenId}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Listing Type Toggle */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Listing Type
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setListingType('sale')}
                                disabled={isSubmitting}
                                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors ${listingType === 'sale'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                Sale
                            </button>
                            <button
                                type="button"
                                onClick={() => setListingType('swap')}
                                disabled={isSubmitting}
                                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors ${listingType === 'swap'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                Swap/Trade
                            </button>
                        </div>
                    </div>

                    {/* Sale Price Input */}
                    {listingType === 'sale' && (
                        <div className="mb-6">
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                                New Price (ETH)
                            </label>
                            <input
                                type="number"
                                id="price"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                step="0.001"
                                min="0"
                                required
                                disabled={isSubmitting}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="0.00"
                            />
                            <p className="mt-2 text-sm text-gray-500">
                                Current price: {currentPrice} ETH
                            </p>
                        </div>
                    )}

                    {/* Swap/Trade Inputs */}
                    {listingType === 'swap' && (
                        <div className="space-y-4 mb-6">
                            <div>
                                <label htmlFor="desiredContractAddress" className="block text-sm font-medium text-gray-700 mb-2">
                                    Desired NFT Address
                                </label>
                                <input
                                    type="text"
                                    id="desiredContractAddress"
                                    value={desiredContractAddress}
                                    onChange={(e) => setDesiredContractAddress(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-sm"
                                    placeholder="0x..."
                                />
                                {currentDesiredContractAddress && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Current: {currentDesiredContractAddress.slice(0, 10)}...{currentDesiredContractAddress.slice(-8)}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="desiredTokenId" className="block text-sm font-medium text-gray-700 mb-2">
                                    Desired Token ID
                                </label>
                                <input
                                    type="text"
                                    id="desiredTokenId"
                                    value={desiredTokenId}
                                    onChange={(e) => setDesiredTokenId(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    placeholder="Token ID"
                                />
                                {currentDesiredTokenId && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Current: {currentDesiredTokenId}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="swapPrice" className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional Price (ETH) - Optional
                                </label>
                                <input
                                    type="number"
                                    id="swapPrice"
                                    value={swapPrice}
                                    onChange={(e) => setSwapPrice(e.target.value)}
                                    step="0.001"
                                    min="0"
                                    disabled={isSubmitting}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    placeholder="0.00"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Leave at 0 for a pure NFT swap, or add a price to receive ETH + the desired NFT
                                </p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-xs text-blue-700">
                                    <strong>Swap/Trade:</strong> Your NFT will be exchanged for the specified NFT
                                    {swapPrice && swapPrice !== '0' && ` plus ${swapPrice} ETH`}.
                                    The buyer must own the desired NFT and pay any additional price.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || (listingType === 'sale' && newPrice === currentPrice)}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Updating...' : 'Update Listing'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default memo(UpdateListingModal);
