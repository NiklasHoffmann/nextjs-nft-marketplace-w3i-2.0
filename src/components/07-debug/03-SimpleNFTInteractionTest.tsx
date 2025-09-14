"use client";

import { useState } from 'react';
import { PersonalTab, MarketInsightsTab } from '@/components';
import { useNFTInsights } from '@/hooks';
import { useUserInteractions } from '@/hooks';

interface SimpleNFTInteractionTestProps {
    contractAddress: string;
    tokenId: string;
}

export default function SimpleNFTInteractionTest({
    contractAddress,
    tokenId
}: SimpleNFTInteractionTestProps) {
    const [activeTab, setActiveTab] = useState<'market' | 'personal'>('market');

    // Mock user wallet address - in real app this would come from Web3 context
    const userWalletAddress = "0x8BbA5E9b30E986C55465fEaC4D3417791065d1bb";

    // Separate hooks for NFT data and user interactions
    const {
        insights: publicInsights,
        loading: nftLoading,
        error: nftError
    } = useNFTInsights({
        contractAddress,
        tokenId,
        autoFetch: true
    });

    const {
        userInteractions,
        loading: userLoading,
        error: userError,
        updateInteraction: updateUserInteraction,
        createInteraction: createUserInteraction
    } = useUserInteractions({
        contractAddress,
        tokenId,
        userWalletAddress,
        autoFetch: true
    });

    // Combined states for compatibility
    const loading = nftLoading || userLoading;
    const error = nftError || userError;

    const handleUpdateUserInteraction = async (data: any) => {
        try {
            if (userInteractions) {
                await updateUserInteraction(data);
            } else {
                await createUserInteraction(data);
            }
        } catch (err) {
            console.error('Error updating user interaction:', err);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    NFT Interaction Test
                </h1>
                <p className="text-gray-600">
                    Testing personal user interactions and public market insights
                </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex space-x-4 mb-6">
                <button
                    onClick={() => setActiveTab('market')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'market'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Market Insights
                </button>
                <button
                    onClick={() => setActiveTab('personal')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'personal'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Personal
                </button>
            </div>

            {/* Debug Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Debug Info:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <strong>Public Insights:</strong> {publicInsights ? '✅ Found' : '❌ None'}
                    </div>
                    <div>
                        <strong>User Interactions:</strong> {userInteractions ? '✅ Found' : '❌ None'}
                    </div>
                    <div>
                        <strong>Contract:</strong> {contractAddress}
                    </div>
                    <div>
                        <strong>Token ID:</strong> {tokenId}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'market' && (
                <MarketInsightsTab
                    contractAddress={contractAddress}
                    tokenId={tokenId}
                    publicInsights={publicInsights as any} // Type compatibility for debug component
                    loading={loading}
                />
            )}

            {activeTab === 'personal' && (
                <PersonalTab
                    contractAddress={contractAddress}
                    tokenId={tokenId}
                    userInteractions={userInteractions as any} // Type compatibility for debug component
                    userWalletAddress={userWalletAddress}
                    loading={loading}
                    onUpdateInteraction={handleUpdateUserInteraction}
                />
            )}
        </div>
    );
}