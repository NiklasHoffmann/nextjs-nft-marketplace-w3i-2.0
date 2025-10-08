"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAdminNFTInsights, useNFTInsightsLegacy } from "@/hooks";
import { useNFTContext } from "@/contexts/NFTContext";
import {
    NFTSelector,
    BasicInfoManager,
    TagsManager,
    RaritySelector,
    NFTSpecificDescriptionsManager,
    ProjectLinkManager,
    PartnershipManager,
} from "../02-sections";
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
    const [currentCardInput, setCurrentCardInput] = useState<string>('');

    const { create, update } = useAdminNFTInsights();
    const nftContext = useNFTContext();
    const [isLoadingNFT, setIsLoadingNFT] = useState(false);

    // Get URL parameters directly (not from formData)
    const contractAddressParam = searchParams.get('contractAddress') || '';
    const tokenIdParam = searchParams.get('tokenId') || '';

    // Use admin insights hook to get full AdminNFTInsight data (NFT-specific)
    const { insights: existingInsights, loading: insightsLoading } = useNFTInsightsLegacy({
        contractAddress: contractAddressParam,
        tokenId: tokenIdParam,
        autoFetch: !!(contractAddressParam && tokenIdParam) // Only fetch NFT-specific when we have both
    });

    // Also fetch collection-wide insights as fallback (empty tokenId = collection-wide)
    const { insights: collectionInsights, loading: collectionInsightsLoading } = useNFTInsightsLegacy({
        contractAddress: contractAddressParam,
        tokenId: '', // Empty tokenId for collection-wide insights
        autoFetch: !!contractAddressParam // Fetch collection insights as soon as we have contractAddress
    });

    // Debug logging for insights loading
    useEffect(() => {

    }, [existingInsights, collectionInsights, insightsLoading, collectionInsightsLoading, formData.contractAddress, formData.tokenId, contractAddressParam, tokenIdParam]);

    // Existing insights laden für Edit-Mode - no longer needed since we use the hook
    // const nftData = nftContext.getNFT(
    //     formData.contractAddress || '',
    //     formData.tokenId || ''
    // );
    // const existingInsights = nftData?.insight;

    // NFT data laden wenn nötig
    useEffect(() => {
        if (formData.contractAddress && formData.tokenId &&
            !nftContext.isDataFresh(formData.contractAddress, formData.tokenId)) {
            setIsLoadingNFT(true);
            nftContext.loadNFT(formData.contractAddress, formData.tokenId)
                .finally(() => setIsLoadingNFT(false));
        }
    }, [nftContext, formData.contractAddress, formData.tokenId]);

    // URL-Parameter beim ersten Laden übernehmen und Form zurücksetzen
    useEffect(() => {
        const contractAddress = searchParams.get('contractAddress');
        const tokenId = searchParams.get('tokenId');

        // Reset form to initial state and load new URL parameters
        if (contractAddress || tokenId) {

            setFormData({
                ...initialFormData, // Start with fresh form
                contractAddress: contractAddress || '',
                tokenId: tokenId || ''
            });

            // Reset other states
            setIsEditMode(false);
            setError(null);
            setSuccess(null);
            setCurrentCardInput('');
            setActiveDescriptionTab('project');
        }
    }, [searchParams]);

    // Existierende Insights in Form laden mit Migration
    useEffect(() => {
        // Only proceed if we have contract address
        if (!formData.contractAddress) {

            return;
        }

        // Wait for NFT context to finish loading
        if (isLoadingNFT) {

            return;
        }

        // Wait for insights to finish loading
        if (insightsLoading || collectionInsightsLoading) {

            return;
        }

        // Determine which insights to use: NFT-specific or collection-wide fallback
        // Priority: 1. NFT-specific (with tokenId), 2. Collection-wide (tokenId="")
        const insightsToUse = existingInsights || collectionInsights;
        const isCollectionFallback = !existingInsights && !!collectionInsights;
        const fallbackSource = !existingInsights
            ? 'Collection-wide Insights (tokenId="")'
            : 'NFT-specific Insights';

        if (insightsToUse) {
            // Only set edit mode if we have NFT-specific insights
            setIsEditMode(!isCollectionFallback);

            // Check if existing insights have the new structure
            const hasProjectDescriptions = insightsToUse.projectDescriptions;
            const hasFunctionalitiesDescriptions = insightsToUse.functionalitiesDescriptions;
            const hasLegacySpecificDescriptions = insightsToUse.specificDescriptions;

            let projectDescriptions: NFTProjectDescriptions;
            let functionalitiesDescriptions: NFTFunctionalitiesDescriptions;
            let legacyDescriptions: string[] = [];

            if (hasProjectDescriptions) {
                // Use existing enhanced project structure
                projectDescriptions = insightsToUse.projectDescriptions || getDefaultProjectDescriptions();
            } else if (hasLegacySpecificDescriptions) {
                // Migrate legacy specificDescriptions to projectDescriptions
                projectDescriptions = insightsToUse.specificDescriptions as NFTProjectDescriptions || getDefaultProjectDescriptions();
            } else {
                // Migrate legacy descriptions to new structure
                legacyDescriptions = insightsToUse.descriptions?.length ? insightsToUse.descriptions : [''];
                projectDescriptions = migrateLegacyDescriptions(legacyDescriptions);
            }

            if (hasFunctionalitiesDescriptions) {
                // Use existing functionalities structure
                functionalitiesDescriptions = insightsToUse.functionalitiesDescriptions || getDefaultFunctionalitiesDescriptions();
            } else {
                // Create default functionalities structure
                functionalitiesDescriptions = getDefaultFunctionalitiesDescriptions();
            }

            setFormData(prev => {
                const updatedFormData = {
                    ...prev,
                    // WICHTIG: contractAddress und tokenId NICHT überschreiben!
                    // Diese bleiben aus dem URL-Parameter (NFT-spezifisch)
                    customTitle: insightsToUse.customTitle || insightsToUse.title || '', // Use customTitle first, fallback to title
                    title: insightsToUse.title || '', // Keep legacy support
                    projectDescriptions,
                    functionalitiesDescriptions,
                    cardDescriptions: (insightsToUse as any).cardDescriptions || [], // Load card descriptions (only for NFT-specific)
                    category: insightsToUse.category || '',
                    tags: insightsToUse.tags || [],
                    rarity: insightsToUse.rarity || 'common',
                    projectWebsite: insightsToUse.projectWebsite || '',
                    projectTwitter: insightsToUse.projectTwitter || '',
                    projectDiscord: insightsToUse.projectDiscord || '',
                    partnerships: insightsToUse.partnerships || [],
                    partnershipDetails: insightsToUse.partnershipDetails || ''
                };

                return updatedFormData;
            });
        } else {
            // No existing insights found - keep fresh form (already set by URL parameter effect)
            setIsEditMode(false);
        }
    }, [existingInsights, collectionInsights, isLoadingNFT, insightsLoading, collectionInsightsLoading, formData.contractAddress, formData.tokenId]);

    // Cleanup effect - reset form when component unmounts for completely fresh start
    useEffect(() => {
        return () => {

        };
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Validierung - nur contractAddress ist zwingend erforderlich
            if (!formData.contractAddress) {
                throw new Error('Contract Address ist erforderlich');
            }

            // Token ID validation - only validate format if provided
            if (formData.tokenId && formData.tokenId.trim() !== '' && !/^\d+$/.test(formData.tokenId.trim())) {
                throw new Error('Token ID muss eine gültige Zahl sein oder leer bleiben für Collection-weite Insights');
            }

            let requestData: any;

            // Use enhanced structure with title-description pairs
            // Ensure empty tokenId is sent as empty string for collection-wide insights
            const cleanTokenId = formData.tokenId && formData.tokenId.trim() !== '' ? formData.tokenId.trim() : '';

            requestData = {
                contractAddress: formData.contractAddress,
                tokenId: cleanTokenId, // Explicitly clean empty values
                customTitle: formData.customTitle || '', // Allow empty custom title
                title: formData.title || formData.customTitle || '', // Legacy support
                category: formData.category,
                tags: formData.tags,
                rarity: formData.rarity,
                projectDescriptions: formData.projectDescriptions,
                functionalitiesDescriptions: formData.functionalitiesDescriptions,
                // cardDescriptions will be set below after function call
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

            // Build final card descriptions including current input
            let finalCardDescriptions = [...formData.cardDescriptions];
            if (currentCardInput.trim() && currentCardInput.trim().length <= 80) {
                finalCardDescriptions.push(currentCardInput.trim());
            }

            requestData.cardDescriptions = finalCardDescriptions;

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

        setFormData(prev => {
            const newData = { ...prev, ...updates };

            return newData;
        });
    }, []);

    // Check if we're using collection-wide insights as a template
    const isUsingCollectionTemplate = !existingInsights && !!collectionInsights && !!formData.contractAddress;

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
                {isLoadingNFT && (
                    <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Loading existing data...
                    </div>
                )}
                {isUsingCollectionTemplate && (
                    <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-purple-800">Collection-weite Insights geladen</h3>
                                <p className="mt-1 text-sm text-purple-700">
                                    Für diesen NFT existieren keine spezifischen Insights. Die Felder wurden mit den collection-weiten Insights vorausgefüllt.
                                    Beim Speichern werden NFT-spezifische Insights erstellt.
                                </p>
                            </div>
                        </div>
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
                    onCardDescriptionsChange={(cardDescriptions) => {

                        updateFormData({ cardDescriptions });
                    }}
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