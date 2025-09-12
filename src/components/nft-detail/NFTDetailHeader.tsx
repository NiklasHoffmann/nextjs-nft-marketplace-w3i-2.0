"use client";

import { useRouter } from 'next/navigation';
import { NFTDetailHeaderProps } from '@/types/nft-detail';
import { formatNFTDisplayName, formatCollectionDisplayName } from '@/utils/nft-helpers';

export default function NFTDetailHeader({
    name,
    tokenId,
    contractName,
    collection,
    contractSymbol,
    nftAddress,
    isFavorited,
    onToggleFavorite,
    onShare
}: NFTDetailHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
        <div className="bg-white shadow-sm border-b fixed top-16 left-0 right-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Go back"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">
                                {formatNFTDisplayName(name, tokenId)}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {formatCollectionDisplayName(contractName, collection, contractSymbol, nftAddress)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onToggleFavorite}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            {isFavorited ? (
                                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            )}
                        </button>
                        <button
                            onClick={onShare}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Share NFT"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}