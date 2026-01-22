/**
 * API UTILITIES - Daten-Fetching & Service Integration
 * 
 * API-Layer Utilities fÃ¼r:
 * â€¢ NFT Metadata: Fetch von Token-Metadata, Collection-Daten
 * â€¢ Data Aggregation: ZusammenfÃ¼hrung verschiedener Datenquellen
 * â€¢ External Services: API-Integration mit externen Anbietern
 * â€¢ Response Handling: Error-Management & Datenvalidierung
 */

export {
    fetchNFTMetadata,
    fetchNFTInsights,
    fetchCollectionInsights,
    fetchNFTStats,
    fetchMultipleNFTs,
    checkAPIHealth
} from './nft';

export {
    createNFTKey,
    createBaseAggregatedNFT,
    mergeAggregatedNFT,
    isDataFresh,
    getDataFreshness,
    getDisplayData,
    filterByOwner,
    filterBySeller,
    filterListed,
    sortNFTs
} from './nft-aggregation';
