/**
 * Extended NFT Insights Types
 * 
 * Enhanced structure for title-description pairs management
 * Allows multiple titles with multiple descriptions each
 */

export interface TitleDescriptionPair {
    id: string; // Unique identifier for each pair
    title: string; // The title/heading
    descriptions: string[]; // Multiple descriptions for this title
    createdAt?: Date;
    updatedAt?: Date;
}

export interface NFTProjectDescriptions {
    titleDescriptionPairs: TitleDescriptionPair[];
    // Legacy support for old structure
    legacyDescriptions?: string[]; // For backward compatibility
}

export interface NFTFunctionalitiesDescriptions {
    titleDescriptionPairs: TitleDescriptionPair[];
}

export interface ExtendedNFTInsightFormData {
    contractAddress: string;
    tokenId: string;

    // Basic Info - renamed for clarity
    customTitle: string; // Renamed from title to customTitle for clarity
    title?: string; // Legacy support
    category: string;
    tags: string[];
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

    // Enhanced descriptions structure - separated by purpose
    projectDescriptions: NFTProjectDescriptions;
    functionalitiesDescriptions: NFTFunctionalitiesDescriptions;
    cardDescriptions: string[]; // NFT Card descriptions (max 3, with character limit)

    // Social/Partnership Info
    projectWebsite?: string;
    projectTwitter?: string;
    projectDiscord?: string;
    partnerships?: string[];
    partnershipDetails?: string;
}

export interface NFTInsightsDisplayData {
    id: string;
    contractAddress: string;
    tokenId: string;
    customTitle?: string; // Renamed from title to customTitle for clarity
    title?: string; // Legacy support
    category?: string;
    tags?: string[];
    rarity?: string;

    // Enhanced display structure - separated by purpose
    projectDescriptions?: NFTProjectDescriptions;
    functionalitiesDescriptions?: NFTFunctionalitiesDescriptions;

    // Legacy fields (for backward compatibility)
    descriptions?: string[];
    description?: string;
    specificDescriptions?: NFTProjectDescriptions; // Legacy mapping to projectDescriptions

    // Social/Partnership info
    projectWebsite?: string;
    projectTwitter?: string;
    projectDiscord?: string;
    partnerships?: string[];
    partnershipDetails?: string;

    createdBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Helper functions for working with the new structure
export const createEmptyTitleDescriptionPair = (): TitleDescriptionPair => ({
    id: crypto.randomUUID(),
    title: '',
    descriptions: [''],
    createdAt: new Date(),
    updatedAt: new Date()
});

export const createEmptyNFTProjectDescriptions = (): NFTProjectDescriptions => ({
    titleDescriptionPairs: [createEmptyTitleDescriptionPair()]
});

export const createEmptyNFTFunctionalitiesDescriptions = (): NFTFunctionalitiesDescriptions => ({
    titleDescriptionPairs: [createEmptyTitleDescriptionPair()]
});

// Migration helpers
export const migrateLegacyDescriptions = (legacyDescriptions: string[]): NFTProjectDescriptions => {
    if (!legacyDescriptions || legacyDescriptions.length === 0) {
        return createEmptyNFTProjectDescriptions();
    }

    return {
        titleDescriptionPairs: [{
            id: crypto.randomUUID(),
            title: 'General Information', // Default title for migrated content
            descriptions: legacyDescriptions,
            createdAt: new Date(),
            updatedAt: new Date()
        }],
        legacyDescriptions
    };
};

export const flattenToLegacyDescriptions = (projectDescriptions: NFTProjectDescriptions): string[] => {
    if (!projectDescriptions || !projectDescriptions.titleDescriptionPairs) {
        return [];
    }

    return projectDescriptions.titleDescriptionPairs
        .flatMap((pair: TitleDescriptionPair) => pair.descriptions)
        .filter((desc: string) => desc.trim().length > 0);
};

// Validation helpers
export const validateTitleDescriptionPair = (pair: TitleDescriptionPair): boolean => {
    return pair.title.trim().length > 0 &&
        pair.descriptions.some(desc => desc.trim().length > 0);
};

export const validateNFTProjectDescriptions = (descriptions: NFTProjectDescriptions): boolean => {
    return descriptions.titleDescriptionPairs.some((pair: TitleDescriptionPair) => validateTitleDescriptionPair(pair));
};

export const validateNFTFunctionalitiesDescriptions = (descriptions: NFTFunctionalitiesDescriptions): boolean => {
    return descriptions.titleDescriptionPairs.some((pair: TitleDescriptionPair) => validateTitleDescriptionPair(pair));
};