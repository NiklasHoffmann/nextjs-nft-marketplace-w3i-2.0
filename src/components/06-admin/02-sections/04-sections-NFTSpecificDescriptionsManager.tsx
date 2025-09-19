"use client";

import React from 'react';
import { TitleDescriptionManager } from '../03-forms';

import type { NFTProjectDescriptions, NFTFunctionalitiesDescriptions, TitleDescriptionPair } from "@/types/05-features/03-nft-insights";

// Helper function to convert string[] to TitleDescriptionPair[] for card descriptions
const convertCardDescriptionsToTitlePairs = (descriptions: string[]): TitleDescriptionPair[] => {
    // For card descriptions, don't create empty entries automatically
    // Start with empty array to implement button-first pattern
    if (descriptions.length === 0) {
        return [];
    }

    return descriptions.map((desc, index) => ({
        id: `card-desc-${index}`, // Stable ID based on index only
        title: '', // Empty title for card descriptions
        descriptions: [desc],
        createdAt: new Date(),
        updatedAt: new Date()
    }));
};// Helper function to convert TitleDescriptionPair[] back to string[] for card descriptions
const convertTitlePairsToCardDescriptions = (pairs: TitleDescriptionPair[]): string[] => {
    return pairs.map(pair => pair.descriptions[0] || '');
};

interface NFTSpecificDescriptionsManagerProps {
    projectDescriptions: NFTProjectDescriptions;
    functionalitiesDescriptions: NFTFunctionalitiesDescriptions;
    cardDescriptions: string[];
    activeDescriptionTab: 'project' | 'functionalities' | 'cards';
    onProjectDescriptionsChange: (descriptions: NFTProjectDescriptions) => void;
    onFunctionalitiesDescriptionsChange: (descriptions: NFTFunctionalitiesDescriptions) => void;
    onCardDescriptionsChange: (descriptions: string[]) => void;
    onActiveTabChange: (tab: 'project' | 'functionalities' | 'cards') => void;
}

const NFTSpecificDescriptionsManager: React.FC<NFTSpecificDescriptionsManagerProps> = ({
    projectDescriptions,
    functionalitiesDescriptions,
    cardDescriptions,
    activeDescriptionTab,
    onProjectDescriptionsChange,
    onFunctionalitiesDescriptionsChange,
    onCardDescriptionsChange,
    onActiveTabChange
}) => {
    return (
        <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        NFT-Specific Descriptions
                    </h3>
                    <p className="text-sm">
                        Specific descriptions for this individual NFT
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            type="button"
                            onClick={() => onActiveTabChange('project')}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeDescriptionTab === 'project'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center">
                                Projekt-Beschreibungen
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {projectDescriptions.titleDescriptionPairs.length}
                                </span>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => onActiveTabChange('functionalities')}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeDescriptionTab === 'functionalities'
                                ? 'border-green-500 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center">
                                Funktionalitäts-Beschreibungen
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {functionalitiesDescriptions.titleDescriptionPairs.length}
                                </span>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => onActiveTabChange('cards')}
                            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeDescriptionTab === 'cards'
                                ? 'border-purple-500 text-purple-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center">
                                NFT Card Descriptions
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {cardDescriptions.length}
                                </span>
                            </div>
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="mt-6">
                    {activeDescriptionTab === 'project' ? (
                        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-blue-800 mb-2">Projekt-Beschreibungen</h3>
                                <p className="text-sm text-blue-600">
                                    Diese Beschreibungen werden im <strong>Projekt-Tab</strong> angezeigt und enthalten Informationen über das Projekt, Roadmap, Team, etc.
                                </p>
                            </div>
                            <TitleDescriptionManager
                                label="Projekt-Beschreibungen"
                                helpText="Verwalte projektspezifische Titel mit jeweiligen Beschreibungen"
                                descriptions={projectDescriptions}
                                onChange={onProjectDescriptionsChange}
                                placeholderTitle="z.B. 'Roadmap', 'Team & Vision', 'Community'"
                                placeholderDescription="Beschreibung für diesen Projekt-Aspekt"
                            />
                        </div>
                    ) : activeDescriptionTab === 'functionalities' ? (
                        <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-green-800 mb-2">Funktionalitäts-Beschreibungen</h3>
                                <p className="text-sm text-green-600">
                                    Diese Beschreibungen werden im <strong>Functionalities-Tab</strong> angezeigt und enthalten technische Features, Utility, Use Cases, etc.
                                </p>
                            </div>
                            <TitleDescriptionManager
                                label="Funktionalitäts-Beschreibungen"
                                helpText="Verwalte funktionalitätsspezifische Titel mit jeweiligen Beschreibungen"
                                descriptions={functionalitiesDescriptions}
                                onChange={onFunctionalitiesDescriptionsChange}
                                placeholderTitle="z.B. 'Smart Contract Features', 'Utility & Benefits', 'Use Cases'"
                                placeholderDescription="Beschreibung für diese Funktionalität"
                            />
                        </div>
                    ) : (
                        <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-purple-800 mb-2">NFT Card Descriptions</h3>
                                <p className="text-sm text-purple-600">
                                    Diese Beschreibungen werden direkt in den <strong>NFT Cards</strong> angezeigt und enthalten kurze, prägnante Informationen.
                                </p>
                            </div>
                            <TitleDescriptionManager
                                label="NFT Card Descriptions"
                                helpText="Kurze, prägnante Beschreibungen für NFT-Karten (max. 80 Zeichen pro Beschreibung, max. 2 Beschreibungen)"
                                descriptions={{ titleDescriptionPairs: convertCardDescriptionsToTitlePairs(cardDescriptions) }}
                                onChange={(newDescriptions) => {
                                    const updatedCardDescriptions = convertTitlePairsToCardDescriptions(newDescriptions.titleDescriptionPairs);
                                    onCardDescriptionsChange(updatedCardDescriptions);
                                }}
                                hideTitle={true}
                                maxDescriptions={2}
                                maxCharactersPerDescription={80}
                                placeholderDescription="z.B. 'Access to exclusive features'"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NFTSpecificDescriptionsManager;