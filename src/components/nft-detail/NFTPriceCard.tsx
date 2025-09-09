import { formatEther } from '@/utils/formatters';

interface NFTPriceCardProps {
    price: string;
    isListed: boolean;
    convertedPrice: string;
    priceLoading: boolean;
    selectedCurrencySymbol: string;
}

export default function NFTPriceCard({
    price,
    isListed,
    convertedPrice,
    priceLoading,
    selectedCurrencySymbol
}: NFTPriceCardProps) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Current Price</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isListed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {isListed ? 'Listed' : 'Not Listed'}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">
                        {formatEther(price)} ETH
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
                    <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                        Buy Now
                    </button>
                    <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                        Update
                    </button>
                    <button className="w-full border border-red-300 text-red-700 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors">
                        Cancel Listing
                    </button>
                </div>
            )}
        </div>
    );
}