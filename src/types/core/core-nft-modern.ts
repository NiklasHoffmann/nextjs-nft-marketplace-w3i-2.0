// ===== CORE NFT TYPES =====

import type { NFTProjectDescriptions, NFTFunctionalitiesDescriptions } from '../features/nft-insights';

// Quellen
export type ActiveItem = {
    listingId: string
    contractAddress: `0x${string}`
    tokenId: string
    isListed: boolean
    price: string
    seller: `0x${string}`
    buyer: `0x${string}` | null
    desiredContractAddress: `0x${string}`
    desiredTokenId: string | null
    currency?: string | null // v2: Payment token (0x0 = ETH, WETH address = WETH)
    listingType?: 'PURE_ETH' | 'SWAP_AND_ETH' | 'PURE_SWAP' | null // v2: Listing type
    tokenStandard?: 'ERC721' | 'ERC1155' | null
    erc1155QuantityListed?: string | null
    remainingQuantity?: string | null
    unitPrice?: string | null
    partialBuyEnabled?: boolean
    desiredErc1155Quantity?: string | null
}

export type NftCore = {
    contractAddress: `0x${string}`
    tokenId: string
    tokenURI: string | null
    name: string | null // aus Contract
    owner: `0x${string}` | null // aktueller Besitzer
    symbol: string | null // aus Contract
    contractName?: string | null // falls verf�gbar vom Contract/Enumerable
    contractSymbol?: string | null // falls verf�gbar vom Contract/Enumerable
    totalSupply?: number | null // falls verf�gbar vom Contract/Enumerable
}

export type NftMeta = {
    name?: string
    description?: string
    image?: string // ipfs://� oder https://�
    imageOriginal?: string
    images?: {
        thumb?: string | null
        small?: string | null
        card?: string | null
        detail?: string | null
        original?: string | null
    }
    imageMeta?: {
        width?: number | null
        height?: number | null
        mimeType?: string | null
    }
    blurDataURL?: string | null
    attributes?: Array<{ trait_type?: string; value?: any }>
    animationUrl?: string
    externalUrl?: string
}

export type SocialStats = {
    contractAddress: `0x${string}`
    tokenId?: string // optional; wenn nicht vorhanden => collection-level
    likeCount?: number
    watchlistCount?: number
    viewCount?: number
    shareCount?: number
    commentCount?: number
    averageRating?: number
    ratingCount?: number
}

export type Insight = {
    contractAddress: `0x${string}`
    tokenId?: string // wenn fehlt => CollectionInsight
    customTitle?: string
    category?: string
    tags?: string[]
    cardDescription?: string[]
    rarity?: string
    // Project information (enhanced structure) - using imported types
    projectDescriptions?: NFTProjectDescriptions
    functionalitiesDescriptions?: NFTFunctionalitiesDescriptions
    specificDescriptions?: NFTProjectDescriptions // Legacy support
    // Legacy description fields
    descriptions?: string[]
    description?: string
    // Social/Project links
    projectWebsite?: string
    projectTwitter?: string
    projectDiscord?: string
    // Partnerships
    partnerships?: string[]
    partnershipDetails?: string
    // Metadata
    updatedAt: string
    createdAt?: string
    createdBy?: `0x${string}`
}

// ===== AGGREGATED TYPES =====

// Normalisiertes Ergebnis je NFT (einheitlich f�r Cards/Detail/Wallet)
export type AggregatedNFT = {
    key: `${string}-${string}` // `${contractAddress}-${tokenId}`
    contractAddress: `0x${string}`
    tokenId: string
    listed: boolean
    listing?: ActiveItem
    tokenStandard?: 'ERC721' | 'ERC1155'
    balance?: string
    core: NftCore
    meta?: NftMeta
    social?: SocialStats
    insight?: Insight // NFT-Insight ODER fallback zu Collection-Insight
    lastUpdated: number
    // Data source indicators
    sources: {
        blockchain: boolean
        metadata: boolean
        marketplace: boolean
        social: boolean
        insights: boolean
    }
}

// Zusammenfassung je Collection (f�r Tabellen & Collection-Page)
export type CollectionSummary = {
    contractAddress: `0x${string}`
    name?: string | null
    symbol?: string | null
    totalSupply?: number | null
    listedCount: number
    floor?: string | null
    social?: SocialStats // collection-level
    insight?: Insight // collection-level
    lastUpdated: number
}

// ===== UTILITY TYPES =====

export type NFTIdentifier = {
    contractAddress: `0x${string}`
    tokenId: string
}

export type DataSource = 'blockchain' | 'metadata' | 'marketplace' | 'social' | 'insights' | 'external'

export type CacheExpiration = {
    blockchain: number    // 5 minutes (owner changes rarely)
    metadata: number      // 12 hours (metadata rarely changes)
    marketplace: number   // 30 seconds (listings change frequently)
    social: number        // 2 minutes (stats change moderately)
    insights: number      // 1 hour (insights change occasionally)
}

// ===== RESPONSE TYPES =====

export type AggregatedNFTResponse = {
    success: boolean
    data?: AggregatedNFT
    error?: string
    sources: DataSource[]
}

export type AggregatedNFTListResponse = {
    success: boolean
    data?: AggregatedNFT[]
    total?: number
    hasMore?: boolean
    error?: string
    sources: DataSource[]
}

export type CollectionResponse = {
    success: boolean
    data?: CollectionSummary
    error?: string
}
