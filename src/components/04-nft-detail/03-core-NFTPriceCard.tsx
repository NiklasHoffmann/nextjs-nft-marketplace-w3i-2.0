import { memo, useMemo, useCallback } from 'react';
import { formatEther } from '@/utils';
import { NFTPriceCardProps } from '@/types';

function NFTPriceCard({
    price,
    isListed,
    convertedPrice,
    priceLoading,
    selectedCurrencySymbol
}: NFTPriceCardProps) {
    // Memoize price formatting
    const formattedPrice = useMemo(() => formatEther(price), [price]);


    console.log('NFTPriceCard Rendered with price:', price, 'isListed:', isListed);
    // Memoize status styling
    const statusConfig = useMemo(() => ({
        className: isListed
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800',
        text: isListed ? 'Listed' : 'Not Listed'
    }), [isListed]);

    // Memoize action handlers
    const handleBuyNow = useCallback(() => {
        // TODO: Implement buy functionality
        console.log('Buy Now clicked');
    }, []);

    const handleUpdate = useCallback(() => {
        // TODO: Implement update functionality
        console.log('Update clicked');
    }, []);

    const handleCancelListing = useCallback(() => {
        // TODO: Implement cancel listing functionality
        console.log('Cancel Listing clicked');
    }, []);

    const handleEditInsights = useCallback(() => {
        // TODO: Implement edit insights functionality
        console.log('Edit Insights clicked');
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
                    <button
                        onClick={handleBuyNow}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Buy Now
                    </button>
                    <button
                        onClick={handleUpdate}
                        className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Update
                    </button>
                    <button
                        onClick={handleCancelListing}
                        className="w-full border border-red-300 text-red-700 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Cancel Listing
                    </button>
                </div>)}

        </div>
    );
}

export default memo(NFTPriceCard);
