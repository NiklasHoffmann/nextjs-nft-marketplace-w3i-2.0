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
    desiredTokenId
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


    // Memoize status styling
    const statusConfig = useMemo(() => ({
        className: isListed
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800',
        text: isListed ? 'Listed' : 'Not Listed'
    }), [isListed]);

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
                    {statusConfig.text}
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
            {isListed && (
                <div className="mt-6 space-y-3">
                    {/* Buy Now & Add to Cart - only visible if NOT owner */}
                    {!isOwner && (
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
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {contractAddress && tokenId && (
                <>
                    <BuyNowModal
                        isOpen={showBuyModal}
                        onClose={handleCloseBuyModal}
                        contractAddress={contractAddress}
                        tokenId={tokenId}
                        nftName={nftName}
                        nftImage={nftImage}
                        price={price}
                        seller={seller || ''}
                        buyer={connectedAddress}
                    />
                    <UpdateListingModal
                        isOpen={showUpdateModal}
                        onClose={handleCloseUpdateModal}
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
