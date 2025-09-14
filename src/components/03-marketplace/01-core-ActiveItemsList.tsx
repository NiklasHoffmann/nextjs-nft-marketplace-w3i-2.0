/**
 * Active Items List - displays marketplace NFT listings with horizontal scrolling
 * Optimized with virtual scrolling and batched rendering
 */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useSubscription, useApolloClient } from "@apollo/client";
import { useAccount } from "wagmi";
import { getAdminAddressesList } from '@/utils';
import { GET_ACTIVE_ITEMS, ITEMS_UPDATED_SUBSCRIPTION } from "../../constants/subgraph.queries";
import { NFTCardWithMetadata, ImagePreloader } from "@/components";

export default function ActiveItemsList() {
    const apolloClient = useApolloClient();
    const { address } = useAccount();
    const [isClient, setIsClient] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);
    const [subscriptionTimedOut, setSubscriptionTimedOut] = useState(false);


    const [isAdmin, setIsAdmin] = useState(false);

    // Check admin status when address changes
    useEffect(() => {
        if (address) {
            const adminAddresses = getAdminAddressesList();
            const lowerAddress = address.toLowerCase();
            const isCurrentUserAdmin = adminAddresses.includes(lowerAddress);
            setIsAdmin(isCurrentUserAdmin);
        } else {
            setIsAdmin(false);
        }
    }, [address]);

    // Initial query for active items
    const { loading, error, data, refetch } = useQuery(GET_ACTIVE_ITEMS, {
        errorPolicy: 'all',
        fetchPolicy: 'cache-first',
        notifyOnNetworkStatusChange: false, // Only notify on THIS query's network changes
    });

    // Real-time subscription for updates (with error handling)
    const { data: subscriptionData, loading: subscriptionLoading, error: subscriptionError } = useSubscription(
        ITEMS_UPDATED_SUBSCRIPTION,
        {
            onData: ({ data }) => {
                setLastUpdate(new Date());
            },
            onError: (error) => {
                setSubscriptionTimedOut(true);
                refetch();
            },
            // Add timeout and fallback behavior
            errorPolicy: 'all',
            fetchPolicy: 'no-cache',
            // Skip subscription if already timed out
            skip: subscriptionTimedOut
        }
    );

    // Handle subscription timeout
    useEffect(() => {
        if (subscriptionLoading && !subscriptionError) {
            const timeout = setTimeout(() => {
                if (subscriptionLoading && !subscriptionData && !subscriptionError) {
                    setSubscriptionTimedOut(true);
                    refetch();
                }
            }, 10000);
            return () => clearTimeout(timeout);
        }
    }, [subscriptionLoading, subscriptionError, subscriptionData, refetch]);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Use subscription data if available, fallback to query data
    const items = useMemo(() => {
        const itemsData = subscriptionData?.items || data?.items || [];
        console.log(`📊 Active items count: ${itemsData.length}`);
        return itemsData;
    }, [subscriptionData?.items, data?.items]);

    // Optimized image URLs for preloading
    const imageUrls = useMemo(() => {
        if (items.length === 0) return [];
        return items.slice(0, 6).map((_item: any) => {
            return [];
        }).flat();
    }, [items]);

    // Optimized scroll handler is no longer needed since we removed virtual scrolling
    // All NFT cards are now always rendered for better image caching

    // Enhanced manual refresh handler
    const handleManualRefresh = useCallback(async () => {
        if (isManualRefreshing) return; // Prevent double clicks

        setIsManualRefreshing(true);
        setLastUpdate(new Date());

        try {
            // Clear Apollo cache and force fresh fetch
            await apolloClient.cache.evict({ fieldName: 'items' });
            await apolloClient.cache.gc();

            const result = await refetch({ fetchPolicy: 'no-cache' });

            // Brief delay for UX feedback
            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            // Silently handle errors - user will see if data doesn't update
        } finally {
            setIsManualRefreshing(false);
        }
    }, [refetch, apolloClient, isManualRefreshing]);

    // Don't render anything on server to avoid hydration mismatch

    if (!isClient) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Active Items</h2>
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Active Items</h2>
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Active Items</h2>
                <div className="text-center text-red-500">Error loading items</div>
            </div>
        );
    }



    if (items.length === 0) {
        return (
            <div className="py-8">
                <h2 className="text-2xl font-bold mb-4">Active Items</h2>
                <div className="text-center">No active items found</div>
            </div>
        );
    }

    return (
        <div className="py-8">
            <ImagePreloader imageUrls={imageUrls} priority={true} />
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Active Items ({items.length})</h2>
                <div className="flex items-center gap-2">

                    {isAdmin && (
                        <div className="text-xs text-gray-400 font-mono bg-gray-100 p-2 rounded mt-2">
                            <strong>🔧 Admin Debug Info:</strong>
                            <br />
                            Query: {data?.items?.length || 0} | Sub: {subscriptionData?.items?.length || 0} |
                            States: loading={loading.toString()} | subLoading={subscriptionLoading.toString()} | refreshing={isManualRefreshing.toString()} |
                            SubError: {subscriptionError ? 'YES' : 'NO'} | SubTimeout: {subscriptionTimedOut.toString()} | ButtonDisabled: {(loading || isManualRefreshing || (subscriptionLoading && !subscriptionError && !subscriptionTimedOut)).toString()} |
                            Admin: {address?.slice(0, 8)}... | NodeEnv: {process.env.NODE_ENV}
                        </div>
                    )}
                    <span className="text-sm text-gray-500">
                        Last updated: {lastUpdate.toLocaleTimeString()}
                    </span>
                    <button
                        onClick={handleManualRefresh}
                        disabled={loading || isManualRefreshing || (subscriptionLoading && !subscriptionError && !subscriptionTimedOut)}
                        className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md transition-colors"
                        title="Refresh data"
                    >
                        {loading || isManualRefreshing || (subscriptionLoading && !subscriptionError && !subscriptionTimedOut) ? '⟳' : '↻'}
                    </button>
                    {subscriptionData && (
                        <span className="text-xs text-green-600 font-medium">
                            ● LIVE
                        </span>
                    )}
                </div>
            </div>
            <div
                className="flex gap-4 overflow-x-auto pb-4 pt-2 scrollbar-thumb-only scroll-smooth"
                style={{ scrollBehavior: 'smooth' }}
            >
                {items.map((item: any, index: number) => {
                    // Always render the actual NFT card, no placeholders
                    // This prevents image loading issues when scrolling back
                    return (
                        <div key={item.listingId} className="flex-shrink-0">
                            <NFTCardWithMetadata
                                listingId={item.listingId}
                                nftAddress={item.nftAddress}
                                tokenId={item.tokenId}
                                isListed={item.isListed}
                                price={item.price}
                                seller={item.seller}
                                desiredNftAddress={item.desiredNftAddress || "0x0000000000000000000000000000000000000000"}
                                desiredTokenId={item.desiredTokenId || "0"}
                                priority={index < 6}
                                enableInsights={index < 20} // Enable insights for more items since we removed placeholders
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
