import { memo, useMemo, useCallback, useState } from 'react';
import { formatUnits } from 'viem';
import { NFTPriceCardProps } from '@/types';
import { AddToCartButton } from '@/components/ui';
import type { ActiveItem } from '@/types';
import { getCurrencySymbolByAddress, getTokenDecimalsByAddress, ZERO_ADDRESS } from '@/config/tokens';
import { useChainId } from 'wagmi';
import {
    BuyNowModal,
    CancelListingModal,
    UpdateListingModal
} from './modals';

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
    currency,
    status,
    listingType,
    tokenStandard,
    desiredErc1155Quantity,
    erc1155QuantityListed,
    remainingQuantity,
    unitPrice,
    partialBuyEnabled
}: NFTPriceCardProps) {
    // Modal states
    const [showBuyModal, setShowBuyModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);

    // Get chainId for currency lookup
    const chainId = useChainId();

    const currencyDecimals = useMemo(() => getTokenDecimalsByAddress(chainId, currency), [chainId, currency]);

    const isErc1155 = tokenStandard === 'ERC1155';
    const displayPriceWei = useMemo(() => {
        if (isErc1155 && unitPrice) {
            return unitPrice;
        }
        return price;
    }, [isErc1155, unitPrice, price]);

    const effectiveCurrencyDecimals = useMemo(() => {
        if (!displayPriceWei || currencyDecimals >= 18) return currencyDecimals;

        try {
            const parsedWithTokenDecimals = parseFloat(formatUnits(BigInt(displayPriceWei), currencyDecimals));
            const parsedWith18Decimals = parseFloat(formatUnits(BigInt(displayPriceWei), 18));

            if (
                Number.isFinite(parsedWithTokenDecimals)
                && Number.isFinite(parsedWith18Decimals)
                && parsedWith18Decimals > 0
                && parsedWithTokenDecimals / parsedWith18Decimals >= 1_000_000
            ) {
                return 18;
            }
        } catch {
            return currencyDecimals;
        }

        return currencyDecimals;
    }, [displayPriceWei, currencyDecimals]);

    const formattedPrice = useMemo(() => {
        if (!displayPriceWei) {
            return '0';
        }

        try {
            return formatUnits(BigInt(displayPriceWei), effectiveCurrencyDecimals);
        } catch {
            return '0';
        }
    }, [displayPriceWei, effectiveCurrencyDecimals]);

    const formattedTotalPrice = useMemo(() => {
        if (!isErc1155 || !unitPrice) return null;
        if (!price) return null;

        try {
            return formatUnits(BigInt(price), effectiveCurrencyDecimals);
        } catch {
            return null;
        }
    }, [isErc1155, unitPrice, price, effectiveCurrencyDecimals]);

    const currencySymbol = useMemo(() =>
        getCurrencySymbolByAddress(chainId, currency),
        [chainId, currency]
    );

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

    const isActiveListing = useMemo(() => {
        if (!isListed) return false;
        if (!status) return true;
        return status === 'LISTED' || status === 'PARTIALLY_FILLED';
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
            currency: currency || null,
            seller: seller as `0x${string}`,
            isListed: true,
            buyer: null,
            desiredContractAddress: contractAddress as `0x${string}`,
            desiredTokenId: null,
            tokenStandard: tokenStandard || null,
            erc1155QuantityListed: erc1155QuantityListed || null,
            remainingQuantity: remainingQuantity || null,
            unitPrice: unitPrice || null,
            partialBuyEnabled: partialBuyEnabled || false,
            desiredErc1155Quantity: desiredErc1155Quantity || null,
            listingType: listingType || null,
        };
    }, [isListed, contractAddress, tokenId, seller, price, listingId, currency, tokenStandard, erc1155QuantityListed, remainingQuantity, unitPrice, partialBuyEnabled, desiredErc1155Quantity, listingType]);

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
                        {formattedPrice} {currencySymbol}
                    </span>
                </div>
                {!priceLoading && (!isErc1155 || !unitPrice) && (
                    <p className="text-xl text-gray-600">
                        ≈ {convertedPrice}
                    </p>
                )}
                {isErc1155 && unitPrice && (
                    <p className="text-sm text-gray-600">
                        Price per unit
                        {formattedTotalPrice && (
                            <span className="ml-2 text-gray-500">Full qty: {formattedTotalPrice} {currencySymbol}</span>
                        )}
                    </p>
                )}
            </div>
            <div className="mt-6 space-y-3">
                {/* Buy Now & Add to Cart - only visible if LISTED and NOT owner */}
                {isActiveListing && !isOwner && (
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
                        {isActiveListing ? (
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
                {!isOwner && !isActiveListing && (
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
                        currency={currency}
                        seller={seller || ''}
                        buyer={connectedAddress}
                        desiredContractAddress={desiredContractAddress}
                        desiredTokenId={desiredTokenId}
                        desiredErc1155Quantity={desiredErc1155Quantity}
                        tokenStandard={tokenStandard || undefined}
                        erc1155QuantityListed={erc1155QuantityListed}
                        remainingQuantity={remainingQuantity}
                        unitPrice={unitPrice}
                        partialBuyEnabled={partialBuyEnabled}
                    />
                    <UpdateListingModal
                        isOpen={showUpdateModal}
                        onClose={handleCloseUpdateModal}
                        listingId={listingId || ''}
                        currentPrice={formattedPrice}
                        currentCurrency={currency || undefined}
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
