import { memo, useMemo, useCallback, useState } from 'react';
import { formatEther } from '@/utils';
import { NFTPriceCardProps } from '@/types';
import { AddToCartButton } from '@/components/ui';
import type { ActiveItem } from '@/types';
import {
    BuyNowModal,
    CancelListingModal,
    UpdateListingModal
} from '@/components/nft/modals';

function NFTPriceCard({
    price,
    isListed,
    convertedPrice,
    priceLoading,
    selectedCurrencySymbol,
    contractAddress,
    tokenId,
    seller,
    listingId,
    currentOwner,
    connectedAddress,
    nftName,
    nftImage,
    desiredContractAddress,
    desiredTokenId,
    status,
    listingType,
    tokenStandard
}: NFTPriceCardProps) {
    // Modal states
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Memoize price formatting
    const formattedPrice = useMemo(() => formatEther(price), [price]);

    // Check if connected user is the owner
    const isOwner = useMemo(() => {
        if (!connectedAddress || !currentOwner) return false;
        return connectedAddress.toLowerCase() === currentOwner.toLowerCase();
    }, [connectedAddress, currentOwner]);


    // Memoize status styling with v2 status support
    const statusConfig = useMemo(() => {
        if (!isListed || !status) {
            return {
                className: 'bg-gray-100 text-gray-800',
                text: 'Not Listed',
                icon: '🔒'
            };
        }

        switch (status) {
            case 'LISTED':
                return {
                    className: 'bg-green-100 text-green-800',
                    text: 'Listed',
                    icon: '✅'
                };
            case 'PARTIALLY_FILLED':
                return {
                    className: 'bg-yellow-100 text-yellow-800',
                    text: 'Partially Filled',
                    icon: '⏳'
                };
            case 'SOLD_OUT':
                return {
                    className: 'bg-blue-100 text-blue-800',
                    text: 'Sold Out',
                    icon: '✔️'
                };
            case 'CANCELED':
                return {
                    className: 'bg-red-100 text-red-800',
                    text: 'Canceled',
                    icon: '❌'
                };
            case 'INVALIDATED':
                return {
                    className: 'bg-orange-100 text-orange-800',
                    text: 'Invalidated',
                    icon: '⚠️'
                };
            default:
                return {
                    className: 'bg-green-100 text-green-800',
                    text: 'Listed',
                    icon: '💰'
                };
        }
    }, [isListed, status]);

    // Create ActiveItem for cart
    const cartItem: ActiveItem | null = useMemo(() => {
        if (!isListed || !contractAddress || !tokenId || !seller) {
            return null;
        }
        return {
            listingId: listingId || `${contractAddress}-${tokenId}`,
            contractAddress: contractAddress as `0x${string}`,
            tokenId,
            price,
            seller: seller as `0x${string}`,
            isListed: true,
            buyer: null,
            desiredContractAddress: contractAddress as `0x${string}`,
            desiredTokenId: null
        };
    }, [isListed, contractAddress, tokenId, seller, price, listingId]);

    // Memoize action handlers
    const handleBuyNow = useCallback(() => {
        setShowBuyModal(true);
    }, []);

    const handleCloseBuyModal = useCallback(() => {
        setShowBuyModal(false);
    }, []);

    const handleOpenUpdateModal = useCallback(() => {
        setShowUpdateModal(true);
    }, []);

    const handleCloseUpdateModal = useCallback(() => {
        setShowUpdateModal(false);
    }, []);

    const handleOpenCancelModal = useCallback(() => {
        setShowCancelModal(true);
    }, []);

    const handleCloseCancelModal = useCallback(() => {
        setShowCancelModal(false);
    }, []);

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Current Price</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.className}`}>
                    {statusConfig.icon} {statusConfig.text}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                        {formattedPrice} ETH
                    </span>
                    <span className="text-lg text-gray-500">
                        ({selectedCurrencySymbol})
                    </span>
                </div>
                {!priceLoading && (
                    <p className="text-xl text-gray-600">
                        ≈ {convertedPrice}
                    </p>
                )}
            </div>
            <div className="mt-6 space-y-3">
                {/* Buy Now & Add to Cart - only visible if LISTED and NOT owner */}
                {isListed && status === 'LISTED' && !isOwner && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleBuyNow}
                            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            Buy Now
                        </button>
                        {cartItem && (
                            <div className="flex-1">
                                <AddToCartButton item={cartItem} variant="button" />
                            </div>
                        )}
                    </div>
                )}

                {/* Owner-only buttons */}
                {isOwner && (
                    <div className="flex gap-3">
                        {isListed && status === 'LISTED' ? (
                            // NFT is listed - show Update & Cancel
                            <>
                                <button
                                    onClick={handleOpenUpdateModal}
                                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                >
                                    Update Listing
                                </button>
                                <button
                                    onClick={handleOpenCancelModal}
                                    className="flex-1 border border-red-300 text-red-700 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                >
                                    Cancel Listing
                                </button>
                            </>
                        ) : (
                            // NFT is NOT listed - show List button
                            <button
                                onClick={() => window.location.href = `/sell?contract=${contractAddress}&tokenId=${tokenId}`}
                                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                                List NFT for Sale
                            </button>
                        )}
                    </div>
                )}

                {/* Not owner and not listed - show informational message */}
                {!isOwner && !isListed && (
                    <div className="text-center text-gray-500 py-4">
                        This NFT is not currently listed for sale
                    </div>
                )}
            </div>

            {/* Modals */}
            {contractAddress && tokenId && (
                <>
                    <BuyNowModal
                        isOpen={showBuyModal}
                        onClose={handleCloseBuyModal}
                        contractAddress={contractAddress}
                        tokenId={tokenId}
                        listingId={listingId || ''}
                        nftName={nftName}
                        nftImage={nftImage}
                        price={price}
                        seller={seller || ''}
                        buyer={connectedAddress}
                    />
                    <UpdateListingModal
                        isOpen={showUpdateModal}
                        onClose={handleCloseUpdateModal}
                        listingId={listingId || ''}
                        currentPrice={formattedPrice}
                        contractAddress={contractAddress}
                        tokenId={tokenId}
                        nftName={nftName}
                        currentDesiredContractAddress={desiredContractAddress}
                        currentDesiredTokenId={desiredTokenId}
                    />
                    <CancelListingModal
                        isOpen={showCancelModal}
                        onClose={handleCloseCancelModal}
                        listingId={listingId || ''}
                        contractAddress={contractAddress}
                        tokenId={tokenId}
                        nftName={nftName}
                        price={formattedPrice}
                    />
                </>
            )}
        </div>
    );
}

export default memo(NFTPriceCard);
