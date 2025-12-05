'use client';

import { useMarketplaceV2 } from '@/hooks/marketplace/useMarketplaceV2';

export default function StatsDebugPage() {
    const { items, loading, error } = useMarketplaceV2({ autoFetch: true });

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Stats Debug Page</h1>

            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">NFT Items ({items.length})</h2>
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}

                <div className="space-y-3">
                    {items.map((item: any, index: number) => (
                        <div key={`${item.nftAddress}-${item.tokenId}`} className="border p-4 rounded">
                            <div className="font-medium">#{index + 1} - {item.metadata?.name || `NFT #${item.tokenId}`}</div>
                            <div className="text-sm text-gray-600">
                                {item.nftAddress.slice(0, 8)}...:{item.tokenId}
                            </div>
                            <div className="text-sm mt-2 grid grid-cols-2 gap-2">
                                <div>Price: {item.price} ETH</div>
                                <div>Views: {item.stats?.viewCount || 0}</div>
                                <div>Likes: {item.stats?.likeCount || 0}</div>
                                <div>Rating: {item.stats?.averageRating || 0} ({item.stats?.ratingCount || 0})</div>
                                <div>Watchlist: {item.stats?.watchlistCount || 0}</div>
                                <div>Category: {item.insights?.category || 'N/A'}</div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                Listed: {item.isListed ? 'YES' : 'NO'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
