/**
 * COMPREHENSIVE FALLBACK DATA ANALYSIS
 * ===================================
 * 
 * This file documents ALL sources of non-real data in the NFT marketplace
 * that could affect stats, ratings, likes, and watchlist counts.
 */

export const FALLBACK_DATA_SOURCES = {

    // ===== 1. MARKETPLACE FALLBACK DATA =====
    marketplace: {
        file: 'src/hooks/nfts/01-core-nft-hooks.ts',
        function: 'createFallbackMarketplaceData()',
        triggered: 'When The Graph returns no marketplace items',
        affects: 'Basic NFT listing data (price, seller, etc.)',
        testItems: [
            '0x41655ae49482de69eec8f6875c34a8ada01965e2#359',
            '0x41655ae49482de69eec8f6875c34a8ada01965e2#51',
            '0x2c9d7f070d03d83588e22c23fe858aa71274ad2a#2'
        ]
    },

    // ===== 2. GENERATED STATS (MAIN PROBLEM) =====
    generatedStats: {
        file: 'src/hooks/nfts/01-core-nft-hooks.ts',
        functions: ['generateConsistentRating()', 'generateConsistentCount()'],
        triggered: 'When no real stats exist in NFTContext cache',
        affects: 'favoriteCount, averageRating, ratingCount, watchlistCount, viewCount',
        algorithm: 'Hash-based consistent generation from contractAddress + tokenId',
        ranges: {
            rating: '1-5',
            ratingCount: '1-50',
            favoriteCount: '1-100',
            watchlistCount: '1-25',
            viewCount: '50-550'
        }
    },

    // ===== 3. FALLBACK STATS API =====
    apiStats: {
        file: 'src/utils/07-api/01-api-nft.ts',
        function: 'createFallbackStats()',
        triggered: 'When /api/nft/stats fails or returns error',
        affects: 'All stats (random values instead of consistent)',
        algorithm: 'Math.random() - different each time',
        ranges: {
            viewCount: '0-50',
            favoriteCount: '0-20',
            averageRating: '1.0-5.0',
            ratingCount: '0-10',
            watchlistCount: '0-15'
        }
    },

    // ===== 4. EMPTY STATS (CONTEXT) =====
    emptyStats: {
        file: 'src/contexts/NFTStatsContext.tsx',
        function: 'createEmptyStats()',
        triggered: 'When no stats exist in cache and no API call made yet',
        affects: 'All stats initialized to 0',
        values: {
            viewCount: 0,
            favoriteCount: 0,
            watchlistCount: 0,
            averageRating: 0,
            ratingCount: 0
        }
    },

    // ===== 5. FALLBACK METADATA =====
    metadata: {
        file: 'src/utils/07-api/01-api-nft.ts',
        function: 'fetchNFTMetadata() fallback',
        triggered: 'When IPFS/metadata API fails',
        affects: 'NFT names show as "NFT #tokenId"',
        indicator: 'Names starting with "NFT #"'
    },

    // ===== 6. MOCK COLLECTION ITEMS =====
    mockCollections: {
        file: 'src/utils/04-blockchain/02-blockchain-nft-helpers.ts',
        function: 'generateMockCollectionItems()',
        triggered: 'For demo/testing purposes',
        affects: 'Collection-level data'
    }
};

export const DATA_FLOW_ANALYSIS = {

    // ===== STATS LOADING PRIORITY =====
    statsLoadingPriority: [
        '1. NFTStatsContext cache (if exists)',
        '2. API call to /api/nft/stats (real MongoDB data)',
        '3. createFallbackStats() from utils/07-api/01-api-nft.ts (RANDOM)',
        '4. generateConsistent* from hooks/nfts/01-core-nft-hooks.ts (CONSISTENT)',
        '5. createEmptyStats() as last resort (ALL ZEROS)'
    ],

    // ===== WHERE STATS ARE USED =====
    statsUsage: [
        'ActiveItemsList filtering/sorting',
        'NFTCard display',
        'DetailHeader counters',
        'PersonalTab interactions'
    ],

    // ===== PROBLEM INDICATORS =====
    problemIndicators: {
        marketplace: 'Items with contracts 0x41655ae...* or 0x2c9d7f...*',
        metadata: 'Names like "NFT #123"',
        randomStats: 'Stats that change on page reload',
        consistentStats: 'Stats that are always the same for same NFT',
        emptyStats: 'All stats showing 0'
    }
};

export const SOLUTIONS = {

    // ===== DISABLE FALLBACKS =====
    disableFallbacks: {
        marketplace: 'Remove createFallbackMarketplaceData() return, return empty array',
        stats: 'Remove createFallbackStats() call in fetchNFTStats()',
        generated: 'Remove generateConsistent* calls in enrichMarketplaceItem()',
        metadata: 'Remove fallback metadata generation'
    },

    // ===== FORCE REAL DATA =====
    forceRealData: {
        theGraph: 'Ensure The Graph subgraph returns real marketplace data',
        mongodb: 'Seed real user interaction data in MongoDB',
        ipfs: 'Ensure NFT metadata is accessible via IPFS',
        apis: 'Configure proper external NFT metadata APIs'
    },

    // ===== DEBUG FLAGS =====
    debugFlags: {
        localStorage: 'debug_data_sources = true',
        console: 'Look for "USING FALLBACK" or "Generated" logs',
        ui: 'Use NFTDataDebugger and TestDataController components'
    }
};

// ===== DEBUGGING UTILITIES =====
export const debugCurrentDataSources = () => {
    if (typeof window === 'undefined') return;

    console.log('🔍 === NFT DATA SOURCE ANALYSIS ===');

    // Check localStorage for any cached data
    const keys = Object.keys(localStorage);
    const nftKeys = keys.filter(k => k.includes('nft_') || k.includes('stats_'));

    console.log('📦 LocalStorage NFT data:', nftKeys.length, 'entries');
    nftKeys.forEach(key => {
        console.log(`  - ${key}:`, localStorage.getItem(key)?.substring(0, 100) + '...');
    });

    // Check for debug flags
    console.log('🔧 Debug flags:', {
        debug_data_sources: localStorage.getItem('debug_data_sources'),
    });

    console.log('🎯 Expected fallback indicators:');
    console.log('  - Contract 0x41655ae49482de69eec8f6875c34a8ada01965e2 (fallback marketplace)');
    console.log('  - Contract 0x2c9d7f070d03d83588e22c23fe858aa71274ad2a (fallback marketplace)');
    console.log('  - Names starting with "NFT #" (fallback metadata)');
    console.log('  - Consistent stats for same NFT (generated stats)');
};

export const clearAllFallbackData = () => {
    if (typeof window === 'undefined') return;

    console.log('🧹 Clearing all fallback data...');

    // Clear localStorage NFT data
    const keys = Object.keys(localStorage);
    const nftKeys = keys.filter(k => k.includes('nft_') || k.includes('stats_'));
    nftKeys.forEach(key => localStorage.removeItem(key));

    console.log('✅ Cleared', nftKeys.length, 'localStorage entries');
    console.log('🔄 Reload page to see clean data loading');
};