/**
 * Active Items List - displays marketplace NFT listings with horizontal scrolling
 */
"use client";

import { useQuery } from "@apollo/client";
import { GET_ACTIVE_ITEMS } from "../../constants/subgraph.queries";
import NFTCardWithMetadata from "../NFTCardWithMetadata";

export default function ActiveItemsList() {
    const { loading, error, data } = useQuery(GET_ACTIVE_ITEMS, {
        errorPolicy: 'all',
        fetchPolicy: 'cache-first',
    });

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

    const items = data?.items || [];

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
            <h2 className="text-2xl font-bold mb-4">Active Items</h2>
            <div
                className="flex gap-4 overflow-x-auto pb-4 pt-2"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#3b82f6 transparent'
                }}
            >
                <style jsx>{`
          div::-webkit-scrollbar {
            height: 8px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background: #3b82f6;
            border-radius: 4px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #2563eb;
          }
        `}</style>

                {items.map((item: any) => (
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
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
