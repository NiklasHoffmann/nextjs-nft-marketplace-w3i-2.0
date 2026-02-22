import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, getQueryParam } from '@/lib/api';
import { getCollection } from '@/lib/mongodb';
import { isNativeETH, ZERO_ADDRESS } from '@/config/tokens';
import { devLog } from '@/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/collections
 * 
 * Aggregates collection statistics directly from marketplace_items
 * Includes preview images from multiple NFTs and social stats
 */
export const GET = apiHandler(async (request: NextRequest) => {
    const includeInsights = getQueryParam(request, 'includeInsights') !== 'false';
    const minItems = parseInt(getQueryParam(request, 'minItems') || '0');
    const sortBy = getQueryParam(request, 'sortBy') || 'itemCount';
    const sortOrder = getQueryParam(request, 'sortOrder') === 'asc' ? 1 : -1;

    devLog.debug('🔍 [Collections API] Aggregating from marketplace_items...');
    const startTime = Date.now();

    try {
        const marketplaceItems = await getCollection('marketplace_items');

        // Aggregate collections from marketplace_items
        const pipeline: any[] = [
            {
                $match: {
                    isListed: true,
                    listingId: { $ne: null },
                    price: { $ne: null }
                }
            },
            {
                $addFields: {
                    priceDecimal: { $toDecimal: '$price' },
                    normalizedContractAddress: { $toLower: '$contractAddress' }
                }
            },
            {
                $sort: {
                    normalizedContractAddress: 1,
                    priceDecimal: 1
                }
            },
            {
                $group: {
                    _id: '$normalizedContractAddress',
                    contractAddress: { $first: '$normalizedContractAddress' },
                    itemCount: { $sum: 1 },
                    erc721ItemCount: {
                        $sum: {
                            $cond: [{ $eq: ['$tokenStandard', 'ERC1155'] }, 0, 1]
                        }
                    },
                    erc1155ItemCount: {
                        $sum: {
                            $cond: [{ $eq: ['$tokenStandard', 'ERC1155'] }, 1, 0]
                        }
                    },
                    erc1155ListedUnits: {
                        $sum: {
                            $cond: [
                                { $eq: ['$tokenStandard', 'ERC1155'] },
                                {
                                    $convert: {
                                        input: { $ifNull: ['$erc1155QuantityListed', 0] },
                                        to: 'double',
                                        onError: 0,
                                        onNull: 0
                                    }
                                },
                                0
                            ]
                        }
                    },
                    erc1155RemainingUnits: {
                        $sum: {
                            $cond: [
                                { $eq: ['$tokenStandard', 'ERC1155'] },
                                {
                                    $convert: {
                                        input: { $ifNull: ['$remainingQuantity', '$erc1155QuantityListed'] },
                                        to: 'double',
                                        onError: 0,
                                        onNull: 0
                                    }
                                },
                                0
                            ]
                        }
                    },
                    partialBuyEnabledCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$tokenStandard', 'ERC1155'] },
                                        { $eq: ['$partialBuyEnabled', true] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    floorPrice: { $first: '$price' },
                    floorPriceCurrency: { $first: '$currency' },
                    totalValue: { $sum: { $toDouble: '$price' } },
                    averagePrice: { $avg: { $toDouble: '$price' } },
                    listings: {
                        $push: {
                            price: '$price',
                            currency: '$currency',
                            tokenStandard: '$tokenStandard',
                            unitPrice: '$unitPrice',
                            erc1155QuantityListed: '$erc1155QuantityListed',
                            remainingQuantity: '$remainingQuantity'
                        }
                    },
                    // Collect token IDs for preview images
                    tokenIds: { $push: '$tokenId' },
                    // Count unique sellers (owners)
                    uniqueSellers: { $addToSet: '$seller' }
                }
            }
        ];

        // Add minItems filter
        if (minItems > 0) {
            pipeline.push({ $match: { itemCount: { $gte: minItems } } });
        }

        // Add sorting
        const sortField = sortBy === 'floorPrice' ? 'floorPrice' :
            sortBy === 'totalValue' ? 'totalValue' :
                sortBy === 'name' ? 'contractAddress' : 'itemCount';
        pipeline.push({ $sort: { [sortField]: sortOrder } });

        const collections = await marketplaceItems.aggregate(pipeline).toArray();

        const fetchTime = Date.now() - startTime;
        devLog.debug(`✅ [Collections API] Aggregated ${collections.length} collections in ${fetchTime}ms`);

        // Get metadata for collections (from nft_metadata) - get multiple images per collection
        const nftMetadata = await getCollection('nft_metadata');
        const contractAddresses = collections.map(c => c.contractAddress);
        const normalizedContractAddresses = contractAddresses.map((address: string) => address.toLowerCase());
        const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Create lookup queries for all collections at once
        const metadataMap = new Map();
        const contractInfoMap = new Map();

        // Aggregate contract info + supply once for all collections
        if (normalizedContractAddresses.length > 0) {
            const contractInfoAggregation = await nftMetadata.aggregate([
                {
                    $match: {
                        $expr: {
                            $in: [{ $toLower: '$contractAddress' }, normalizedContractAddresses]
                        }
                    }
                },
                {
                    $addFields: {
                        normalizedContractAddress: { $toLower: '$contractAddress' },
                        normalizedTokenId: { $toString: '$tokenId' },
                        numericTokenId: {
                            $convert: {
                                input: '$tokenId',
                                to: 'double',
                                onError: null,
                                onNull: null
                            }
                        },
                        contractNameValue: { $ifNull: ['$contract.name', '$contract.contractName'] },
                        contractSymbolValue: { $ifNull: ['$contract.symbol', '$contract.contractSymbol'] },
                        totalSupplyNumber: {
                            $convert: {
                                input: '$contract.totalSupply',
                                to: 'double',
                                onError: 0,
                                onNull: 0
                            }
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            contractAddress: '$normalizedContractAddress',
                            tokenId: '$normalizedTokenId'
                        },
                        contractName: { $first: '$contractNameValue' },
                        contractSymbol: { $first: '$contractSymbolValue' },
                        tokenIdNumericValue: { $max: '$numericTokenId' },
                        tokenSupply: { $max: '$totalSupplyNumber' }
                    }
                },
                {
                    $group: {
                        _id: '$_id.contractAddress',
                        contractName: { $first: '$contractName' },
                        contractSymbol: { $first: '$contractSymbol' },
                        tokenIdCount: { $sum: 1 },
                        maxNumericTokenId: { $max: '$tokenIdNumericValue' },
                        contractDeclaredSupply: { $max: '$tokenSupply' },
                        totalSupplyUnits: { $sum: '$tokenSupply' }
                    }
                }
            ]).toArray();

            contractInfoAggregation.forEach((doc: any) => {
                const normalizedAddress = String(doc._id || '').toLowerCase();
                if (!normalizedAddress) return;

                const tokenIdCount = doc.tokenIdCount > 0 ? Math.round(doc.tokenIdCount) : null;
                const hasNumericMaxTokenId = typeof doc.maxNumericTokenId === 'number' && Number.isFinite(doc.maxNumericTokenId) && doc.maxNumericTokenId >= 0;
                const inferredItemsFromMaxTokenId = hasNumericMaxTokenId ? Math.floor(doc.maxNumericTokenId) + 1 : null;
                const inferredSupplyItems = Math.max(tokenIdCount || 0, inferredItemsFromMaxTokenId || 0) || null;

                contractInfoMap.set(normalizedAddress, {
                    contractName: doc.contractName,
                    contractSymbol: doc.contractSymbol,
                    tokenIdCount,
                    inferredItemsFromMaxTokenId,
                    inferredSupplyItems,
                    contractDeclaredSupply: doc.contractDeclaredSupply > 0 ? Math.round(doc.contractDeclaredSupply) : null,
                    totalSupplyUnits: doc.totalSupplyUnits > 0 ? Math.round(doc.totalSupplyUnits) : null,
                });
            });
        }

        // Get up to 4 images per collection for preview
        for (const collection of collections) {
            const tokenIds = collection.tokenIds?.slice(0, 4) || [];
            const normalizedContractAddress = String(collection.contractAddress || '').toLowerCase();
            if (tokenIds.length > 0) {
                const nfts = await nftMetadata.find({
                    contractAddress: { $regex: `^${escapeRegex(normalizedContractAddress)}$`, $options: 'i' },
                    tokenId: { $in: tokenIds.map(String) }
                }).limit(4).toArray();

                const images = nfts
                    .map((nft: any) => nft.metadata?.image)
                    .filter((img: any) => img && typeof img === 'string');

                metadataMap.set(normalizedContractAddress, images);
            }
        }

        // Get social stats from nft_stats - aggregate per collection
        const nftStats = await getCollection('nft_stats');
        const statsMap = new Map();

        const statsPipeline = [
            {
                $match: {
                    $expr: {
                        $in: [{ $toLower: '$contractAddress' }, normalizedContractAddresses]
                    }
                }
            },
            {
                $group: {
                    _id: { $toLower: '$contractAddress' },
                    totalViews: { $sum: { $ifNull: ['$viewCount', 0] } },
                    totalLikes: { $sum: { $ifNull: ['$likeCount', 0] } },
                    totalWatchlist: { $sum: { $ifNull: ['$watchlistCount', 0] } },
                    totalRatings: { $sum: { $ifNull: ['$ratingCount', 0] } },
                    totalRatingScore: {
                        $sum: {
                            $cond: [
                                { $gt: ['$ratingCount', 0] },
                                { $multiply: ['$averageRating', '$ratingCount'] },
                                0
                            ]
                        }
                    },
                    ratedCount: {
                        $sum: {
                            $cond: [{ $gt: ['$ratingCount', 0] }, 1, 0]
                        }
                    }
                }
            }
        ];

        const statsAggregation = await nftStats.aggregate(statsPipeline).toArray();
        statsAggregation.forEach((stat: any) => {
            statsMap.set(String(stat._id || '').toLowerCase(), {
                totalViews: stat.totalViews || 0,
                totalLikes: stat.totalLikes || 0,
                totalWatchlist: stat.totalWatchlist || 0,
                totalRatings: stat.totalRatings || 0,
                averageRating: stat.totalRatings > 0
                    ? (stat.totalRatingScore || 0) / stat.totalRatings
                    : 0
            });
        });

        // Get insights if requested
        let insightsMap = new Map();
        if (includeInsights) {
            const insights = await getCollection('admin_nft_insights');
            const contractAddressFilters = contractAddresses.map((address: string) => ({
                contractAddress: { $regex: `^${escapeRegex(address)}$`, $options: 'i' }
            }));

            const insightsDocs = await insights.find({
                ...(contractAddressFilters.length > 0 ? { $or: contractAddressFilters } : {}),
                $and: [
                    {
                        $or: [
                            { tokenId: null },
                            { tokenId: '' },
                            { tokenId: { $exists: false } }
                        ]
                    }
                ]
            }).toArray();

            insightsDocs.forEach((insight: any) => {
                const key = String(insight.contractAddress || '').toLowerCase();
                insightsMap.set(key, {
                    category: insight.category,
                    rarity: insight.rarity,
                    totalSupply: insight.totalSupply,
                    hasInsights: true
                });
            });
        }

        // Transform to API format
        const transformedCollections = collections.map((col: any) => {
            const normalizedContractAddress = String(col.contractAddress || '').toLowerCase();
            const previewImages = metadataMap.get(normalizedContractAddress) || [];
            const contractInfo = contractInfoMap.get(normalizedContractAddress) || {};
            const stats = statsMap.get(normalizedContractAddress) || {};
            const insights = insightsMap.get(normalizedContractAddress);
            const erc721Count = col.erc721ItemCount || 0;
            const erc1155Count = col.erc1155ItemCount || 0;
            const isPureERC1155 = erc1155Count > 0 && erc721Count === 0;
            const supplyItems = isPureERC1155
                ? (insights?.totalSupply || contractInfo.inferredSupplyItems || contractInfo.tokenIdCount || null)
                : (contractInfo.contractDeclaredSupply || contractInfo.tokenIdCount || insights?.totalSupply || null);
            const supplyUnits = isPureERC1155
                ? (contractInfo.totalSupplyUnits || null)
                : null;

            const listings: Array<{
                price?: string;
                currency?: string | null;
                tokenStandard?: string | null;
                unitPrice?: string | null;
                erc1155QuantityListed?: string | number | null;
                remainingQuantity?: string | number | null;
            }> = Array.isArray(col.listings)
                ? col.listings
                : [];

            const normalizeCurrency = (currency?: string | null): string => {
                if (!currency || isNativeETH(currency)) {
                    return ZERO_ADDRESS;
                }
                return String(currency).toLowerCase();
            };

            const currencyStats = new Map<string, { totalValue: number; floorPrice: string | null; count: number }>();
            let hasEthListing = false;

            for (const listing of listings) {
                const currency = normalizeCurrency(listing.currency);
                const rawPrice = String(listing.price || '0');
                const numericPrice = Number.parseFloat(rawPrice);
                if (!Number.isFinite(numericPrice) || numericPrice < 0) {
                    continue;
                }

                const tokenStandard = String(listing.tokenStandard || '').toUpperCase();
                let unitFloorNumeric = numericPrice;

                if (tokenStandard === 'ERC1155') {
                    const rawUnitPrice = listing.unitPrice != null ? String(listing.unitPrice) : '';
                    const numericUnitPrice = Number.parseFloat(rawUnitPrice);

                    if (Number.isFinite(numericUnitPrice) && numericUnitPrice > 0) {
                        unitFloorNumeric = numericUnitPrice;
                    } else {
                        const listedQty = Number.parseFloat(String(listing.erc1155QuantityListed ?? '0'));
                        const remainingQty = Number.parseFloat(String(listing.remainingQuantity ?? '0'));
                        const fallbackQty = Number.isFinite(listedQty) && listedQty > 0
                            ? listedQty
                            : (Number.isFinite(remainingQty) && remainingQty > 0 ? remainingQty : 0);

                        if (fallbackQty > 0) {
                            unitFloorNumeric = numericPrice / fallbackQty;
                        }
                    }
                }

                if (currency === ZERO_ADDRESS) {
                    hasEthListing = true;
                }

                const current = currencyStats.get(currency);
                if (!current) {
                    currencyStats.set(currency, {
                        totalValue: numericPrice,
                        floorPrice: String(unitFloorNumeric),
                        count: 1,
                    });
                    continue;
                }

                const currentFloor = Number.parseFloat(current.floorPrice || '0');
                const nextFloor = Number.isFinite(currentFloor)
                    ? Math.min(currentFloor, unitFloorNumeric)
                    : unitFloorNumeric;

                current.totalValue += numericPrice;
                current.floorPrice = String(nextFloor);
                current.count += 1;
                currencyStats.set(currency, current);
            }

            const fallbackFloorCurrency = normalizeCurrency(col.floorPriceCurrency);
            const displayCurrency = hasEthListing
                ? ZERO_ADDRESS
                : (fallbackFloorCurrency || Array.from(currencyStats.keys())[0] || ZERO_ADDRESS);
            const displayStats = currencyStats.get(displayCurrency);

            const displayTotalValue = displayStats?.totalValue ?? 0;
            const floorPriceDisplay = displayStats?.floorPrice ?? (col.floorPrice || null);
            const floorPriceCurrencyDisplay = displayCurrency;
            const currencyTotals = Array.from(currencyStats.entries()).map(([currency, statsByCurrency]) => ({
                currency,
                totalValue: statsByCurrency.totalValue,
            }));

            return {
                contractAddress: normalizedContractAddress,
                contractName: contractInfo.contractName || normalizedContractAddress.slice(0, 10) + '...',
                contractSymbol: contractInfo.contractSymbol || 'NFT',
                itemCount: col.itemCount,
                floorPrice: floorPriceDisplay,
                floorPriceCurrency: floorPriceCurrencyDisplay,
                totalValue: col.totalValue || 0,
                displayTotalValue,
                totalValueCurrency: displayCurrency,
                currencyTotals,
                averagePrice: col.averagePrice || null,
                imageUrl: previewImages[0] || null,
                previewImages: previewImages,
                // Social stats
                totalViews: stats.totalViews || 0,
                totalLikes: stats.totalLikes || 0,
                totalWatchlist: stats.totalWatchlist || 0,
                totalRatings: stats.totalRatings || 0,
                averageRating: stats.averageRating || 0,
                erc721ItemCount: erc721Count,
                erc1155ItemCount: erc1155Count,
                erc1155ListedUnits: col.erc1155ListedUnits || 0,
                erc1155RemainingUnits: col.erc1155RemainingUnits || 0,
                partialBuyEnabledCount: col.partialBuyEnabledCount || 0,
                // Supply info
                totalSupply: supplyItems,
                totalSupplyUnits: supplyUnits,
                // Unique owners (sellers with listed items)
                uniqueOwners: col.uniqueSellers?.length || 0,
                insights: includeInsights ? insights : undefined
            };
        });

        const totalTime = Date.now() - startTime;
        devLog.debug(`📊 [Collections API] Total processing time: ${totalTime}ms`);
        devLog.debug(`📸 [Collections API] Preview images loaded for ${transformedCollections.filter((c: any) => c.previewImages.length > 0).length} collections`);

        const response = apiSuccess({
            collections: transformedCollections,
            count: transformedCollections.length,
            timestamp: new Date().toISOString()
        });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
    } catch (error: any) {
        devLog.error('❌ [Collections API] Error:', error);

        // Check for MongoDB connection errors with helpful messages
        if (error.isMongoError || error.name === 'MongoConnectionError') {
            devLog.error('\n' + error.userMessage + '\n');
            throw new Error('MongoDB Verbindung fehlgeschlagen. Siehe Server-Logs für Details. Häufigste Ursache: IP nicht in MongoDB Atlas Whitelist.');
        }

        if (error.name === 'MongoServerError' || error.reason?.type === 'ReplicaSetNoPrimary') {
            devLog.error('\n🚫 MONGODB VERBINDUNGSFEHLER - IP WHITELIST PRÜFEN!\n');
            devLog.error('1. https://cloud.mongodb.com → Network Access');
            devLog.error('2. Add IP Address → Aktuelle IP hinzufügen\n');
            throw new Error('MongoDB Verbindung fehlgeschlagen. LÖSUNG: IP-Adresse in MongoDB Atlas Network Access hinzufügen!');
        }

        throw error;
    }
});