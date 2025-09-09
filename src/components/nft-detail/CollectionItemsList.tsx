import { formatEther } from '@/utils/formatters';

interface CollectionItemsListProps {
    collection?: string | null;
    nftAddress: string;
    tokenId: string;
    name?: string | null;
    price: string;
}

export default function CollectionItemsList({
    collection,
    nftAddress,
    tokenId,
    name,
    price
}: CollectionItemsListProps) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">More from this Collection</h3>
                <div className="text-sm text-gray-500">
                    {collection || `${nftAddress.slice(0, 6)}...${nftAddress.slice(-4)}`}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }, (_, index) => (
                    <div key={index} className="group cursor-pointer">
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl mb-3 overflow-hidden group-hover:shadow-lg transition-all duration-200">
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center text-gray-400">
                                    <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-xs">#{(parseInt(tokenId) + index + 1).toString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {name ? `${name} #${(parseInt(tokenId) + index + 1)}` : `NFT #${(parseInt(tokenId) + index + 1)}`}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Price</span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {(parseFloat(formatEther(price)) + (index * 0.01)).toFixed(3)} ETH
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Status</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    index % 3 === 0
                                        ? 'bg-green-100 text-green-800'
                                        : index % 3 === 1
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {index % 3 === 0 ? 'Listed' : index % 3 === 1 ? 'Auction' : 'Not Listed'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 text-center">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    View All Collection Items
                </button>
            </div>
        </div>
    );
}