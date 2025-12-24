/**
 * Approval Dialog Component
 * 
 * Shows when NFT needs approval before listing
 * Options:
 * - Approve single NFT (one transaction per listing)
 * - Approve all NFTs (one transaction, then list freely)
 */

'use client';

import React from 'react';
import OptimizedNFTImage from '@/components/nft/OptimizedNFTImage';
import { AggregatedNFT } from '@/types/core/core-nft-modern';

interface ApprovalDialogProps {
    nft: AggregatedNFT;
    isBatchMode?: boolean;
    onApproveSingle: () => void;
    onApproveAll: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export function ApprovalDialog({
    nft,
    isBatchMode = false,
    onApproveSingle,
    onApproveAll,
    onCancel,
    isLoading = false
}: ApprovalDialogProps) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">
                            Approval Required
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            To list your NFT, you need to approve the marketplace contract to transfer it on your behalf.
                        </p>
                    </div>
                </div>

                {/* NFT Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            <OptimizedNFTImage
                                imageUrl={nft.meta?.image || '/media/custom-nft.jpg'}
                                tokenId={nft.tokenId}
                                alt={nft.meta?.name || `NFT #${nft.tokenId}`}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                                {nft.meta?.name || `NFT #${nft.tokenId}`}
                            </p>
                            <p className="text-sm text-gray-600 truncate">
                                {nft.core?.contractName || 'Unknown Collection'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-6">
                    {/* Approve Single */}
                    <button
                        onClick={onApproveSingle}
                        disabled={isLoading}
                        className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                    Approve This NFT Only
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    One transaction per listing. Gas efficient for single NFTs.
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Approve All */}
                    <button
                        onClick={onApproveAll}
                        disabled={isLoading}
                        className="w-full text-left p-4 border-2 border-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900 flex items-center gap-2">
                                    Approve All from Collection
                                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                                        Recommended
                                    </span>
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    {isBatchMode
                                        ? 'Required for batch listing. Approve once, list multiple NFTs without additional approvals.'
                                        : 'One transaction, then list any NFT from this collection freely.'
                                    }
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                </div>

                {/* Info Note */}
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                        <strong>Note:</strong> This is a one-time approval. You can revoke it anytime from your wallet.
                    </p>
                </div>
            </div>
        </div>
    );
}
