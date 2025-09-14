"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminNFTInsights, useNFTInsights } from "@/hooks";
import {
    NFTSelector,
    BasicInfoManager,
    TagsManager,
    RaritySelector,
    NFTSpecificDescriptionsManager,
    ProjectLinkManager,
    PartnershipManager,
} from "../index";
import type {
    NFTProjectDescriptions,
    NFTFunctionalitiesDescriptions,
    TitleDescriptionPair,
} from "@/types";

// Helper function to create default NFT project descriptions
const getDefaultProjectDescriptions = (): NFTProjectDescriptions => ({
    titleDescriptionPairs: []
});

// Helper function to create default NFT functionalities descriptions
const getDefaultFunctionalitiesDescriptions = (): NFTFunctionalitiesDescriptions => ({
    titleDescriptionPairs: []
});

// Helper function to migrate legacy descriptions to project descriptions
const migrateLegacyDescriptions = (descriptions: string[]): NFTProjectDescriptions => ({
    titleDescriptionPairs: descriptions.length > 0 && descriptions.some(desc => desc.trim().length > 0)
        ? descriptions
            .filter(desc => desc.trim().length > 0)
            .map((desc, index) => ({
                id: crypto.randomUUID(),
                title: `Beschreibung ${index + 1}`,
                descriptions: [desc],
                createdAt: new Date(),
                updatedAt: new Date()
            }))
        : []
});

interface NFTInsightFormData {
    contractAddress: string;
    tokenId: string;
    customTitle: string; // Renamed from title to customTitle for clarity
    title?: string; // Legacy support
    // Legacy support for old descriptions
    descriptions: string[];
    // New enhanced description structures
    projectDescriptions: NFTProjectDescriptions;
    functionalitiesDescriptions: NFTFunctionalitiesDescriptions;
    cardDescriptions: string[]; // NFT Card descriptions (max 3, with character limit)
    category: string;
    tags: string[];
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    projectWebsite?: string;
    projectTwitter?: string;
    projectDiscord?: string;
    partnerships?: string[];
    partnershipDetails?: string;
}

const initialFormData: NFTInsightFormData = {
    contractAddress: '',
    tokenId: '',
    customTitle: '', // New primary field
    title: '', // Legacy support
    descriptions: [''],
    projectDescriptions: getDefaultProjectDescriptions(),
    functionalitiesDescriptions: getDefaultFunctionalitiesDescriptions(),
    cardDescriptions: [], // NFT Card descriptions (empty by default)
    category: '',
    tags: [],
    rarity: 'common',
    projectWebsite: '',
    projectTwitter: '',
    projectDiscord: '',
    partnerships: [],
    partnershipDetails: ''
};

export default function AdminNFTInsightsManager() {
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState<NFTInsightFormData>(initialFormData);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [activeDescriptionTab, setActiveDescriptionTab] = useState<'project' | 'functionalities' | 'cards'>('project');

    const { create, update } = useAdminNFTInsights();

    // Existing insights laden für Edit-Mode
    const { insights: existingInsights, loading: insightsLoading } = useNFTInsights({
        contractAddress: formData.contractAddress,
        tokenId: formData.tokenId,
        autoFetch: !!(formData.contractAddress && formData.tokenId)
    });

    // URL-Parameter beim ersten Laden übernehmen
    useEffect(() => {
        const contractAddress = searchParams.get('contractAddress');
        const tokenId = searchParams.get('tokenId');

        if (contractAddress || tokenId) {
            setFormData(prev => ({
                ...prev,
                contractAddress: contractAddress || prev.contractAddress,
                tokenId: tokenId || prev.tokenId
            }));
        }
    }, [searchParams]);

    // Existierende Insights in Form laden mit Migration
    useEffect(() => {
        if (existingInsights && !insightsLoading) {
            setIsEditMode(true);

            // Check if existing insights have the new structure
            const hasProjectDescriptions = existingInsights.projectDescriptions;
            const hasFunctionalitiesDescriptions = existingInsights.functionalitiesDescriptions;
            const hasLegacySpecificDescriptions = existingInsights.specificDescriptions;

            let projectDescriptions: NFTProjectDescriptions;
            let functionalitiesDescriptions: NFTFunctionalitiesDescriptions;
            let legacyDescriptions: string[] = [];

            if (hasProjectDescriptions) {
                // Use existing enhanced project structure
                projectDescriptions = existingInsights.projectDescriptions || getDefaultProjectDescriptions();
            } else if (hasLegacySpecificDescriptions) {
                // Migrate legacy specificDescriptions to projectDescriptions
                projectDescriptions = existingInsights.specificDescriptions as NFTProjectDescriptions || getDefaultProjectDescriptions();
            } else {
                // Migrate legacy descriptions to new structure
                legacyDescriptions = existingInsights.descriptions?.length ? existingInsights.descriptions : [''];
                projectDescriptions = migrateLegacyDescriptions(legacyDescriptions);
            }

            if (hasFunctionalitiesDescriptions) {
                // Use existing functionalities structure
                functionalitiesDescriptions = existingInsights.functionalitiesDescriptions || getDefaultFunctionalitiesDescriptions();
            } else {
                // Create default functionalities structure
                functionalitiesDescriptions = getDefaultFunctionalitiesDescriptions();
            }

            setFormData(prev => ({
                ...prev,
                customTitle: existingInsights.customTitle || existingInsights.title || '', // Use customTitle first, fallback to title
                title: existingInsights.title || '', // Keep legacy support
                projectDescriptions,
                functionalitiesDescriptions,
                cardDescriptions: existingInsights.cardDescriptions || [], // Load card descriptions
                category: existingInsights.category || '',
                tags: existingInsights.tags || [],
                rarity: existingInsights.rarity || 'common',
                projectWebsite: existingInsights.projectWebsite || '',
                projectTwitter: existingInsights.projectTwitter || '',
                projectDiscord: existingInsights.projectDiscord || '',
                partnerships: existingInsights.partnerships || [],
                partnershipDetails: existingInsights.partnershipDetails || ''
            }));
        } else if (!insightsLoading && formData.contractAddress && formData.tokenId) {
            // Kein existing insight gefunden, aber contractAddress/tokenId vorhanden
            setIsEditMode(false);
        }
    }, [existingInsights, insightsLoading, formData.contractAddress, formData.tokenId]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Validierung
            if (!formData.contractAddress || !formData.tokenId || !formData.customTitle) {
                throw new Error('Contract Address, Token ID und Custom Title sind erforderlich');
            }

            let requestData: any;

            // Use enhanced structure with title-description pairs
            requestData = {
                contractAddress: formData.contractAddress,
                tokenId: formData.tokenId,
                customTitle: formData.customTitle,
                title: formData.title || formData.customTitle, // Legacy support
                category: formData.category,
                tags: formData.tags,
                rarity: formData.rarity,
                projectDescriptions: formData.projectDescriptions,
                functionalitiesDescriptions: formData.functionalitiesDescriptions,
                cardDescriptions: formData.cardDescriptions, // NFT Card descriptions
                // Legacy support - keep specificDescriptions pointing to projectDescriptions
                specificDescriptions: formData.projectDescriptions,
                // Also keep legacy descriptions for backward compatibility (flattened)
                descriptions: formData.projectDescriptions.titleDescriptionPairs
                    .flatMap((pair: TitleDescriptionPair) => pair.descriptions)
                    .filter((desc: string) => desc.trim().length > 0),
                projectWebsite: formData.projectWebsite,
                projectTwitter: formData.projectTwitter,
                projectDiscord: formData.projectDiscord,
                partnerships: formData.partnerships,
                partnershipDetails: formData.partnershipDetails,
                createdBy: '0x0000000000000000000000000000000000000000' // TODO: Replace with actual admin address
            };

            console.log('🎴 cardDescriptions in requestData:', requestData.cardDescriptions);

            console.log('📋 Full requestData being sent:', JSON.stringify(requestData, null, 2));

            let result;
            if (isEditMode && existingInsights) {
                // Update existing insights
                result = await update(requestData);
                setSuccess(`NFT Insights erfolgreich aktualisiert: ${result._id}`);
            } else {
                // Create new insights
                result = await create(requestData);
                setSuccess(`NFT Insights erfolgreich erstellt: ${result._id}`);
                setIsEditMode(true); // Switch to edit mode after creation
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
        } finally {
            setLoading(false);
        }
    }, [formData, create, update, isEditMode, existingInsights]);

    const updateFormData = useCallback((updates: Partial<NFTInsightFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {isEditMode ? 'Edit NFT Insights' : 'Create NFT Insights'}
                        </h2>
                        <p className="text-gray-600">
                            {isEditMode
                                ? 'Bearbeite bestehende NFT-Insights und Descriptions'
                                : 'Erstelle neue NFT-Insights mit dynamischen Descriptions'
                            }
                        </p>
                    </div>
                    {isEditMode && (
                        <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            Edit Mode
                        </div>
                    )}
                </div>
                {insightsLoading && (
                    <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Loading existing data...
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* NFT Selection */}
                <NFTSelector
                    contractAddress={formData.contractAddress}
                    tokenId={formData.tokenId}
                    onContractAddressChange={(value: string) => updateFormData({ contractAddress: value })}
                    onTokenIdChange={(value: string) => updateFormData({ tokenId: value })}
                />

                {/* Basic Info */}
                <BasicInfoManager
                    customTitle={formData.customTitle}
                    category={formData.category}
                    onCustomTitleChange={(title: string) => updateFormData({
                        customTitle: title,
                        title: title // Keep legacy field in sync
                    })}
                    onCategoryChange={(category: string) => updateFormData({ category })}
                />
                <TagsManager
                    tags={formData.tags}
                    onChange={(tags: string[]) => updateFormData({ tags })}
                />

                {/* NFT-Specific Descriptions */}
                <NFTSpecificDescriptionsManager
                    projectDescriptions={formData.projectDescriptions}
                    functionalitiesDescriptions={formData.functionalitiesDescriptions}
                    cardDescriptions={formData.cardDescriptions}
                    activeDescriptionTab={activeDescriptionTab}
                    onProjectDescriptionsChange={(projectDescriptions) => updateFormData({ projectDescriptions })}
                    onFunctionalitiesDescriptionsChange={(functionalitiesDescriptions) => updateFormData({ functionalitiesDescriptions })}
                    onCardDescriptionsChange={(cardDescriptions) => updateFormData({ cardDescriptions })}
                    onActiveTabChange={setActiveDescriptionTab}
                />

                {/* Project Information */}
                <ProjectLinkManager
                    projectWebsite={formData.projectWebsite}
                    projectTwitter={formData.projectTwitter}
                    projectDiscord={formData.projectDiscord}
                    onChange={(updates) => updateFormData(updates)}
                />

                {/* Partnerships */}
                <PartnershipManager
                    partnerships={formData.partnerships}
                    partnershipDetails={formData.partnershipDetails}
                    onChange={(updates) => updateFormData(updates)}
                />

                <RaritySelector
                    rarity={formData.rarity}
                    onChange={(rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary') => updateFormData({ rarity })}
                />

                {/* Status Messages */}
                {
                    error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <div className="text-red-600">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            </div>
                        </div>
                    )
                }

                {
                    success && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="flex">
                                <div className="text-green-600">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-green-600">{success}</p>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Submit Button */}
                <div className="border-t pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full md:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            }`}
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Speichere...
                            </div>
                        ) : (
                            isEditMode ? 'NFT Insights aktualisieren' : 'NFT Insights erstellen'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}