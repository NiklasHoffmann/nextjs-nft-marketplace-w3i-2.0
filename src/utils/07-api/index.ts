/**
 * API UTILITIES - Daten-Fetching & Service Integration
 * 
 * API-Layer Utilities für:
 * • NFT Metadata: Fetch von Token-Metadata, Collection-Daten
 * • Data Aggregation: Zusammenführung verschiedener Datenquellen
 * • External Services: API-Integration mit externen Anbietern
 * • Response Handling: Error-Management & Datenvalidierung
 */

export {
    fetchNFTMetadata,
    fetchNFTInsights,
    fetchCollectionInsights,
    fetchNFTStats,
    fetchMultipleNFTs,
    checkAPIHealth
} from './01-api-nft';

export {
    createNFTKey,
    createBaseAggregatedNFT,
    convertLegacyNFTData,
    convertLegacyCardData,
    mergeAggregatedNFT,
    isDataFresh,
    getDataFreshness,
    getDisplayData,
    filterByOwner,
    filterBySeller,
    filterListed,
    sortNFTs
} from './02-api-nft-aggregation';