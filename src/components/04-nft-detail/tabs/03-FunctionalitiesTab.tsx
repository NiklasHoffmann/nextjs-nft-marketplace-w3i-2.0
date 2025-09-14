"use client";

import { AdminNFTInsight, AdminCollectionInsight } from '@/types';
import { TitleDescriptionPair } from '@/types/05-features/03-nft-insights';

interface FunctionalitiesTabProps {
    adminInsights?: AdminNFTInsight;
    collectionInsights?: AdminCollectionInsight;
    loading?: boolean;
}

export default function FunctionalitiesTab({ adminInsights, collectionInsights, loading }: FunctionalitiesTabProps) {
    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    // Use NFT-specific insights if available, otherwise fall back to collection insights
    const insights = adminInsights || collectionInsights;
    const isCollectionLevel = !adminInsights && collectionInsights;

    if (!insights) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">⚙️</div>
                <p className="text-gray-500 text-lg mb-2">Keine Funktionalitäts-Informationen verfügbar</p>
                <p className="text-gray-400 text-sm">
                    Weder NFT-spezifische noch Collection-weite Funktionalitäts-Insights wurden erstellt.
                </p>
            </div>
        );
    }

    // Check for functionalities descriptions
    const hasFunctionalityInfo = (insights.functionalitiesDescriptions?.titleDescriptionPairs?.length ?? 0) > 0;

    if (!hasFunctionalityInfo) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">⚙️</div>
                <p className="text-gray-500 text-lg mb-2">Keine Funktionalitäts-Beschreibungen verfügbar</p>
                <p className="text-gray-400 text-sm">
                    {isCollectionLevel
                        ? "Für diese Collection wurden noch keine Funktionalitäts-Insights erstellt."
                        : "Für dieses NFT wurden noch keine Funktionalitäts-Insights erstellt."
                    }
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Collection Level Notice */}
            {isCollectionLevel && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-purple-700">
                                <strong>Collection-weite Funktionalitäts-Informationen:</strong> Diese Funktionalitäts-Beschreibungen gelten für die gesamte Collection, da keine NFT-spezifischen Insights verfügbar sind.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Show Functionalities Title-Description Pairs individually */}
            <div className="space-y-6">
                {insights.functionalitiesDescriptions?.titleDescriptionPairs?.map((pair: TitleDescriptionPair, index: number) => {
                    // Filter out empty pairs
                    const hasContent = pair.title.trim() || pair.descriptions.some((desc: string) => desc.trim());
                    if (!hasContent) return null;

                    return (
                        <div key={pair.id || index} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                            {/* Title */}
                            <div className="mb-3">
                                <h4 className="text-lg font-semibold text-gray-800">
                                    {pair.title || `Funktionalität ${index + 1}`}
                                </h4>
                            </div>

                            {/* Descriptions */}
                            <div className="space-y-3">
                                {pair.descriptions.filter((desc: string) => desc.trim()).map((desc: string, descIndex: number) => (
                                    <div key={descIndex} className="pl-4 border-l-2 border-green-200">
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                            {desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}