/**
 * NFT Detail API (OPTIMIZED)
 * 
 * GET /api/nft/detail?contractAddress=...&tokenId=...
 * 
 * Data Strategy (per DATA_SYNC_ARCHITECTURE.md):
 * 1. Get from nft_metadata (cached IPFS data)
 * 2. Check if blockchain state is stale (>5min) → fetch fresh if needed
 * 3. Lazy-load IPFS metadata if missing
 * 4. Join with nft_stats and insights
 * 
 * Performance:
 * - IPFS metadata: Cached forever (immutable)
 * - Blockchain state: Cached 5min (on-demand refresh)
 * - Stats: Real-time from MongoDB
 */

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, getQueryParam, BadRequestError } from '@/lib/api';
import { getCollection } from '@/lib/mongodb';
import { blockchainStateSync } from '@/services/nft-sync/blockchain-state-sync';
import { ipfsMetadataLazySync } from '@/services/nft-sync/ipfs-metadata-lazy-sync';
import { devLog } from '@/utils';
import { buildNFTImageVariants } from '@/utils/nft/image-variants';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = apiHandler(async (request: NextRequest) => {
    const startTime = Date.now();

    const contractAddress = getQueryParam(request, 'contractAddress');
    const tokenId = getQueryParam(request, 'tokenId');
    const forceRefresh = getQueryParam(request, 'refresh') === 'true';

    if (!contractAddress || !tokenId) {
        throw new BadRequestError('Missing contractAddress or tokenId');
    }

    const normalizedAddress = contractAddress.toLowerCase();

    // Step 1: Get from nft_metadata
    const nftMetadata = await getCollection('nft_metadata');
    let nft = await nftMetadata.findOne({ contractAddress: normalizedAddress, tokenId });

    // Step 2: Check if blockchain state is stale or force refresh
    const BLOCKCHAIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    const blockchainStale =
        forceRefresh ||
        !nft?.blockchain?.lastSyncedAt ||
        (Date.now() - nft.blockchain.lastSyncedAt.getTime() > BLOCKCHAIN_CACHE_TTL);

    if (blockchainStale) {
        devLog.info(`🔄 [NFT Detail] Blockchain state stale, syncing...`);
        devLog.info(`   Contract: ${contractAddress}`);
        devLog.info(`   TokenId: ${tokenId}`);
        devLog.info(`   Reason: ${!nft ? 'NFT not in DB' : forceRefresh ? 'Force refresh' : !nft.blockchain?.lastSyncedAt ? 'Never synced' : 'Stale (>5min)'}`);

        await blockchainStateSync.syncNFTState(
            contractAddress,
            tokenId,
            process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS
        );

        // Refetch after sync
        nft = await nftMetadata.findOne({ contractAddress: normalizedAddress, tokenId });

        devLog.info(`   ✅ After sync - approved: ${nft?.blockchain?.approved || 'NULL'}`);
        devLog.info(`   ✅ After sync - isApprovedForAll: ${nft?.blockchain?.isApprovedForAll || false}`);
    } else if (nft?.blockchain) {
        devLog.info(`✅ [NFT Detail] Using cached blockchain state (age: ${Math.round((Date.now() - nft.blockchain.lastSyncedAt.getTime()) / 1000)}s)`);
        devLog.info(`   Approved: ${nft.blockchain.approved || 'NULL'}`);
        devLog.info(`   IsApprovedForAll: ${nft.blockchain.isApprovedForAll || false}`);
    }

    // Step 3: Lazy-load IPFS metadata if missing
    if (!nft?.metadata?.name) {
        devLog.info(`📡 [NFT Detail] IPFS metadata missing, lazy-loading...`);
        await ipfsMetadataLazySync.ensureMetadata(contractAddress, tokenId);
        // Refetch after metadata fetch
        nft = await nftMetadata.findOne({ contractAddress: normalizedAddress, tokenId });
    }

    // Step 4: Join with stats
    const nftStats = await getCollection('nft_stats');
    const stats = await nftStats.findOne({ contractAddress: normalizedAddress, tokenId });

    // Step 5: Get insights (item-specific OR collection-wide)
    const insightsCollection = await getCollection('admin_nft_insights');
    const insightsCandidates = await insightsCollection.aggregate([
        {
            $match: {
                $expr: {
                    $eq: [
                        { $toLower: '$contractAddress' },
                        normalizedAddress
                    ]
                },
                $or: [
                    { tokenId },
                    { tokenId: null },
                    { tokenId: '' },
                    { tokenId: { $exists: false } }
                ]
            }
        },
        {
            $addFields: {
                isItemSpecific: { $cond: [{ $eq: ['$tokenId', tokenId] }, 1, 0] }
            }
        },
        { $sort: { isItemSpecific: -1, updatedAt: -1, createdAt: -1 } },
        { $limit: 1 }
    ]).toArray();
    const insights = insightsCandidates[0] || null;

    // Step 6: Get marketplace listing (if any)
    const marketplaceItems = await getCollection('marketplace_items');
    const listing = await marketplaceItems.findOne({
        contractAddress: normalizedAddress,
        tokenId,
        active: true
    });

    // Prepare response
    const metadataImageSource = nft?.metadata?.imageOriginal || nft?.metadata?.image || '';
    const computedVariants = metadataImageSource ? buildNFTImageVariants(metadataImageSource) : {};
    const resolvedMetadata = nft?.metadata ? {
        ...nft.metadata,
        imageOriginal: nft.metadata.imageOriginal || metadataImageSource || null,
        images: nft.metadata.images || computedVariants,
        imageMeta: nft.metadata.imageMeta || {
            width: null,
            height: null,
            mimeType: null,
        },
        blurDataURL: nft.metadata.blurDataURL || null,
    } : {
        name: `NFT #${tokenId}`,
        description: '',
        image: '',
        imageOriginal: null,
        images: {},
        imageMeta: {
            width: null,
            height: null,
            mimeType: null,
        },
        blurDataURL: null,
        attributes: []
    };

    const response = {
        contractAddress: normalizedAddress,
        tokenId,

        // IPFS metadata (cached forever)
        metadata: resolvedMetadata,

        // Contract info
        contract: nft?.contract || {
            name: null,
            symbol: null,
            address: contractAddress,
            tokenURI: null
        },

        // Blockchain state (cached 5min)
        blockchain: nft?.blockchain || {
            owner: null,
            approved: null,
            isApprovedForAll: false,
            lastSyncedAt: null
        },

        // Approval Status Helper (for UI)
        approvalStatus: {
            hasTokenApproval: nft?.blockchain?.approved &&
                nft.blockchain.approved !== '0x0000000000000000000000000000000000000000',
            hasOperatorApproval: nft?.blockchain?.isApprovedForAll || false,
            isApprovedForMarketplace: (
                (nft?.blockchain?.approved &&
                    nft.blockchain.approved.toLowerCase() === process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS?.toLowerCase()) ||
                nft?.blockchain?.isApprovedForAll
            ),
            approvedAddress: nft?.blockchain?.approved || null,
            marketplaceAddress: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS || null
        },

        // Stats (real-time)
        stats: stats || {
            viewCount: 0,
            likeCount: 0,
            watchlistCount: 0,
            averageRating: 0,
            ratingCount: 0
        },

        // Insights (admin-managed) with compatibility mapping
        insights: insights ? {
            ...insights,
            customTitle: insights.customTitle || insights.title || null,
            description: insights.description || (Array.isArray(insights.descriptions) ? insights.descriptions[0] : null) || null,
            descriptions: Array.isArray(insights.descriptions)
                ? insights.descriptions
                : (Array.isArray(insights.cardDescriptions) ? insights.cardDescriptions : []),
            cardDescriptions: Array.isArray(insights.cardDescriptions)
                ? insights.cardDescriptions
                : (Array.isArray(insights.descriptions) ? insights.descriptions : []),
            projectDescriptions: insights.projectDescriptions || insights.specificDescriptions || null,
            specificDescriptions: insights.specificDescriptions || insights.projectDescriptions || null
        } : null,

        // Marketplace listing (if listed) - with ALL v2 fields
        marketplace: listing ? {
            // Core
            listingId: listing.listingId,
            isListed: listing.active,
            active: listing.active,

            // Pricing (v1 & v2)
            price: listing.price || listing.priceTotal,
            priceTotal: listing.priceTotal,
            unitPrice: listing.unitPrice,

            // Parties
            seller: listing.seller,
            buyer: listing.buyer || null,

            // Swap Data
            desiredContractAddress: listing.desiredContractAddress || listing.desiredTokenAddress,
            desiredTokenAddress: listing.desiredTokenAddress,
            desiredTokenId: listing.desiredTokenId,
            desiredErc1155Quantity: listing.desiredErc1155Quantity,

            // v2 Fields
            tokenStandard: listing.tokenStandard,
            listingType: listing.listingType,
            status: listing.status,
            currency: listing.currency,

            // ERC1155
            erc1155QuantityListed: listing.erc1155QuantityListed,
            remainingQuantity: listing.remainingQuantity,

            // Advanced
            buyerWhitelistEnabled: listing.buyerWhitelistEnabled,
            partialBuyEnabled: listing.partialBuyEnabled,
            feeRate: listing.feeRate,

            // Chain & Timestamps
            chainId: listing.chainId,
            createdAt: listing.createdAt,
            syncedAt: listing.syncedAt
        } : null,

        // Metadata
        cached: !blockchainStale,
        loadTime: Date.now() - startTime
    };

    // View count is tracked via POST /api/nft/stats to avoid double counting

    const apiResponse = apiSuccess(response);
    apiResponse.headers.set('Cache-Control', 'no-store, max-age=0');
    return apiResponse;
});
