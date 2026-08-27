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

const REQUIRED_METADATA_FETCH_VERSION = 2;

export const GET = apiHandler(async (request: NextRequest) => {
    const startTime = Date.now();

    const contractAddress = getQueryParam(request, 'contractAddress');
    const tokenId = getQueryParam(request, 'tokenId');
    const forceRefresh = getQueryParam(request, 'refresh') === 'true';
    const ownerAddressParam = getQueryParam(request, 'ownerAddress');

    if (!contractAddress || !tokenId) {
        throw new BadRequestError('Missing contractAddress or tokenId');
    }

    const normalizedAddress = contractAddress.toLowerCase();
    const normalizedOwnerAddress = ownerAddressParam && /^0x[a-fA-F0-9]{40}$/.test(ownerAddressParam)
        ? ownerAddressParam.toLowerCase()
        : null;

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

    // Step 3: Lazy-load or refresh IPFS metadata when missing/legacy
    const metadataFetchVersion = typeof (nft as any)?.metadataFetchVersion === 'number'
        ? (nft as any).metadataFetchVersion
        : 0;
    const needsMetadataRefresh = !nft?.metadata?.name || metadataFetchVersion < REQUIRED_METADATA_FETCH_VERSION;

    if (needsMetadataRefresh) {
        devLog.info(`📡 [NFT Detail] IPFS metadata missing, lazy-loading...`);
        if (metadataFetchVersion < REQUIRED_METADATA_FETCH_VERSION) {
            devLog.info(`   Reason: Legacy metadata version ${metadataFetchVersion} < ${REQUIRED_METADATA_FETCH_VERSION}`);
        }
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
    const ownershipBalances = nft?.ownershipBalances && typeof nft.ownershipBalances === 'object'
        ? Object.entries(nft.ownershipBalances as Record<string, unknown>)
            .reduce<Record<string, number>>((acc, [address, value]) => {
                const parsed = typeof value === 'number'
                    ? value
                    : typeof value === 'string'
                        ? parseInt(value, 10)
                        : NaN;

                if (/^0x[a-f0-9]{40}$/i.test(address) && Number.isFinite(parsed) && parsed > 0) {
                    acc[address.toLowerCase()] = parsed;
                }

                return acc;
            }, {})
        : {};

    const tokenStandard = nft?.contract?.contractType || listing?.tokenStandard || null;
    const effectiveOwnershipBalances = { ...ownershipBalances };
    const contractOwner = typeof nft?.contract?.owner === 'string' ? nft.contract.owner.toLowerCase() : null;

    if (tokenStandard === 'ERC1155') {
        const contractOwnerBalance = typeof nft?.contract?.ownerBalance === 'number' && Number.isFinite(nft.contract.ownerBalance)
            ? Math.max(nft.contract.ownerBalance, 0)
            : null;

        if (contractOwner && contractOwnerBalance !== null && contractOwnerBalance > 0) {
            effectiveOwnershipBalances[contractOwner] = Math.max(
                effectiveOwnershipBalances[contractOwner] || 0,
                contractOwnerBalance
            );
        }
    }

    const topHolderEntry = Object.entries(effectiveOwnershipBalances)
        .sort((a, b) => (b[1] || 0) - (a[1] || 0))[0];
    const topHolderAddress = topHolderEntry?.[0] || null;

    const resolvedDisplayOwner = tokenStandard === 'ERC1155'
        ? (
            (normalizedOwnerAddress && (effectiveOwnershipBalances[normalizedOwnerAddress] || 0) > 0
                ? normalizedOwnerAddress
                : null)
            || (contractOwner && (effectiveOwnershipBalances[contractOwner] || 0) > 0 ? contractOwner : null)
            || topHolderAddress
            || contractOwner
            || (typeof nft?.blockchain?.owner === 'string' ? nft.blockchain.owner.toLowerCase() : null)
        )
        : (typeof nft?.blockchain?.owner === 'string'
            ? nft.blockchain.owner
            : (typeof nft?.contract?.owner === 'string' ? nft.contract.owner : null));

    const ownerBalanceFromMap = normalizedOwnerAddress
        ? effectiveOwnershipBalances[normalizedOwnerAddress] ?? null
        : null;

    const ownerHolderCount = Object.keys(effectiveOwnershipBalances).length;
    const totalKnownBalance = Object.values(effectiveOwnershipBalances)
        .reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);

    const displayOwnerBalance = resolvedDisplayOwner
        ? effectiveOwnershipBalances[resolvedDisplayOwner] ?? null
        : null;

    const resolvedOwnerBalance = tokenStandard === 'ERC1155'
        ? (ownerBalanceFromMap ?? displayOwnerBalance ?? nft?.contract?.ownerBalance ?? null)
        : (nft?.contract?.ownerBalance ?? null);
    const metadataExternalUrl = typeof (nft?.metadata as any)?.externalUrl === 'string'
        ? (nft?.metadata as any)?.externalUrl
        : (typeof (nft?.metadata as any)?.external_url === 'string' ? (nft?.metadata as any)?.external_url : null);
    const metadataAnimationUrl = typeof (nft?.metadata as any)?.animationUrl === 'string'
        ? (nft?.metadata as any)?.animationUrl
        : (typeof (nft?.metadata as any)?.animation_url === 'string' ? (nft?.metadata as any)?.animation_url : null);
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
        externalUrl: metadataExternalUrl,
        animationUrl: metadataAnimationUrl,
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

        ownership: {
            tokenStandard,
            ownerAddress: normalizedOwnerAddress,
            ownerBalance: resolvedOwnerBalance,
            holderCount: ownerHolderCount,
            totalKnownBalance,
            balances: effectiveOwnershipBalances,
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

    // Normalize contract ownerBalance for UI to the selected owner in ERC1155 mode.
    if (response.contract) {
        response.contract.ownerBalance = resolvedOwnerBalance;
        response.contract.ownershipBalances = effectiveOwnershipBalances;
        response.contract.holderCount = ownerHolderCount;
        if (tokenStandard === 'ERC1155') {
            response.contract.owner = resolvedDisplayOwner;
        }
    }

    if (response.blockchain && tokenStandard === 'ERC1155') {
        response.blockchain.owner = resolvedDisplayOwner;
    }

    // View count is tracked via POST /api/nft/stats to avoid double counting

    const apiResponse = apiSuccess(response);
    apiResponse.headers.set('Cache-Control', 'no-store, max-age=0');
    return apiResponse;
});
