'use client';

import { useActiveItems } from '@/hooks/nfts/01-core-nft-hooks';

export default function StatsDebugPage() {
    const { items, loading, error } = useActiveItems();

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Stats Debug Page</h1>

            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">NFT Items ({items.length})</h2>
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-500">Error: {error.message}</p>}

                <div className="space-y-3">
                    {items.map((item: any, index: number) => (
                        <div key={`${item.nftAddress}-${item.tokenId}`} className="border p-4 rounded">
                            <div className="font-medium">#{index + 1} - {item.name || `NFT #${item.tokenId}`}</div>
                            <div className="text-sm text-gray-600">
                                {item.nftAddress.slice(0, 8)}...:{item.tokenId}
                            </div>
                            <div className="text-sm mt-2 grid grid-cols-2 gap-2">
                                <div>Price: {item.price} ETH</div>
                                <div>Views: {item.viewCount || 0}</div>
                                <div>Likes: {item.favoriteCount || 0}</div>
                                <div>Rating: {item.averageRating || 0} ({item.ratingCount || 0})</div>
                                <div>Watchlist: {item.watchlistCount || 0}</div>
                                <div>Category: {item.category || 'N/A'}</div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                hasRealStats: {item.hasRealStats ? 'YES' : 'NO'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}