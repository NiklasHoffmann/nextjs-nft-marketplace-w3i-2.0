import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { apiHandler, apiSuccess } from '@/lib/api';
import { RATE_LIMIT_CONFIG } from '@/lib/middleware/rateLimit';

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics
 */
async function handler(req: NextRequest) {
    const db = await getDatabase();
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

    const normalizeAddress = (value: unknown): string | null => {
        if (typeof value !== 'string') return null;
        const trimmed = value.trim();
        if (!trimmed) return null;
        return trimmed.toLowerCase();
    };

    // 1+2+6. Parallelize independent counters to avoid serial DB round-trips.
    const [
        totalNFTs,
        activeListings,
        pendingListings,
        cancelledListings,
        totalSales,
    ] = await Promise.all([
        db.collection('nft_metadata').countDocuments(),
        db.collection('marketplace_items').countDocuments({ status: 'LISTED' }),
        db.collection('marketplace_items').countDocuments({ status: 'PENDING' }),
        db.collection('marketplace_items').countDocuments({ status: 'CANCELLED' }),
        db.collection('marketplace_items').countDocuments({ status: 'SOLD' }),
    ]);

    // 3. Listed Volume - Legacy mixed-currency sum (kept for backwards compatibility)
    const listedVolumeResult = await db.collection('marketplace_items').aggregate([
        {
            $match: {
                status: 'LISTED'
            }
        },
        {
            $group: {
                _id: null,
                totalVolume: {
                    $sum: {
                        $convert: {
                            input: '$price',
                            to: 'double',
                            onError: 0,
                            onNull: 0
                        }
                    }
                }
            }
        }
    ]).toArray();

    const listedVolume = listedVolumeResult.length > 0 ? (listedVolumeResult[0]?.totalVolume ?? 0) : 0;

    // 3b. Listed Volume by currency (exact raw sums per token)
    const listedVolumeByCurrencyResult = await db.collection('marketplace_items').aggregate([
        {
            $match: {
                status: 'LISTED'
            }
        },
        {
            $project: {
                currencyAddress: {
                    $toLower: {
                        $ifNull: ['$currency', ZERO_ADDRESS]
                    }
                },
                rawPrice: {
                    $convert: {
                        input: '$price',
                        to: 'decimal',
                        onError: 0,
                        onNull: 0
                    }
                }
            }
        },
        {
            $group: {
                _id: '$currencyAddress',
                totalRaw: { $sum: '$rawPrice' },
                listings: { $sum: 1 }
            }
        },
        {
            $sort: {
                listings: -1
            }
        }
    ]).toArray();

    const listedVolumeByCurrency = listedVolumeByCurrencyResult.map((entry: any) => ({
        currency: (entry?._id || ZERO_ADDRESS).toLowerCase(),
        totalRaw: String(entry?.totalRaw ?? '0'),
        listings: Number(entry?.listings ?? 0)
    }));

    // 4. Sales Volume - Legacy mixed-currency sum (kept for backwards compatibility)
    const salesVolumeResult = await db.collection('marketplace_items').aggregate([
        {
            $match: {
                status: 'SOLD'
            }
        },
        {
            $group: {
                _id: null,
                totalVolume: {
                    $sum: {
                        $convert: {
                            input: '$price',
                            to: 'double',
                            onError: 0,
                            onNull: 0
                        }
                    }
                }
            }
        }
    ]).toArray();

    const salesVolume = salesVolumeResult.length > 0 ? (salesVolumeResult[0]?.totalVolume ?? 0) : 0;

    // 4b. Sales Volume by currency (exact raw sums per token)
    const salesVolumeByCurrencyResult = await db.collection('marketplace_items').aggregate([
        {
            $match: {
                status: 'SOLD'
            }
        },
        {
            $project: {
                currencyAddress: {
                    $toLower: {
                        $ifNull: ['$currency', ZERO_ADDRESS]
                    }
                },
                rawPrice: {
                    $convert: {
                        input: '$price',
                        to: 'decimal',
                        onError: 0,
                        onNull: 0
                    }
                }
            }
        },
        {
            $group: {
                _id: '$currencyAddress',
                totalRaw: { $sum: '$rawPrice' },
                sales: { $sum: 1 }
            }
        },
        {
            $sort: {
                sales: -1
            }
        }
    ]).toArray();

    const salesVolumeByCurrency = salesVolumeByCurrencyResult.map((entry: any) => ({
        currency: (entry?._id || ZERO_ADDRESS).toLowerCase(),
        totalRaw: String(entry?.totalRaw ?? '0'),
        sales: Number(entry?.sales ?? 0)
    }));

    // 4. Total Users - Unique Wallets die interagiert haben
    // Zähle unique addresses aus ALLEN Quellen:
    // - Seller/Buyer aus marketplace_items
    // - User Interactions (likes, ratings, watchlist, notes)
    const [marketplaceUsers, interactionUsers] = await Promise.all([
        // Marketplace users (sellers + buyers)
        db.collection('marketplace_items').aggregate([
            {
                $facet: {
                    sellers: [
                        { $group: { _id: '$seller' } },
                        { $group: { _id: null, addresses: { $addToSet: '$_id' } } }
                    ],
                    buyers: [
                        { $match: { status: 'SOLD', buyer: { $exists: true, $ne: null } } },
                        { $group: { _id: '$buyer' } },
                        { $group: { _id: null, addresses: { $addToSet: '$_id' } } }
                    ]
                }
            },
            {
                $project: {
                    allAddresses: {
                        $setUnion: [
                            { $ifNull: [{ $arrayElemAt: ['$sellers.addresses', 0] }, []] },
                            { $ifNull: [{ $arrayElemAt: ['$buyers.addresses', 0] }, []] }
                        ]
                    }
                }
            }
        ]).toArray(),

        // User interactions (likes, ratings, watchlist, notes)
        Promise.all([
            db.collection('user_likes').distinct('userId'),
            db.collection('user_ratings').distinct('userId'),
            db.collection('user_watchlist').distinct('userId'),
            db.collection('user_personal_notes').distinct('userId')
        ])
    ]);

    // Combine all unique addresses
    const allUserAddresses = new Set<string>();

    // Add marketplace users
    if (marketplaceUsers.length > 0 && marketplaceUsers[0]?.allAddresses) {
        marketplaceUsers[0].allAddresses.forEach((addr: unknown) => {
            const normalized = normalizeAddress(addr);
            if (normalized) {
                allUserAddresses.add(normalized);
            }
        });
    }

    // Add interaction users (likes, ratings, watchlist, notes)
    interactionUsers.forEach(userArray => {
        userArray.forEach((addr: unknown) => {
            const normalized = normalizeAddress(addr);
            if (normalized) {
                allUserAddresses.add(normalized);
            }
        });
    });

    const totalUsers = allUserAddresses.size;

    // 7. Recent Sales (last 5)
    const recentSales = await db.collection('marketplace_items')
        .find({ status: 'SOLD' })
        .sort({ updatedAt: -1 })
        .limit(5)
        .toArray();

    return apiSuccess({
        totalNFTs,
        activeListings,
        listedVolume,      // Summe der Preise von aktuell gelisteten Items
        listedVolumeByCurrency,
        salesVolume,       // Summe der Preise von verkauften Items
        salesVolumeByCurrency,
        totalVolume: salesVolume, // Backwards compatibility
        totalUsers,
        totalSales,
        pendingListings,
        cancelledListings,
        recentSales: recentSales.map((sale: any) => ({
            nftAddress: sale.nftAddress,
            tokenId: sale.tokenId,
            price: sale.price,
            currency: sale.currency || ZERO_ADDRESS,
            seller: sale.seller,
            buyer: sale.buyer,
            soldAt: sale.updatedAt
        }))
    });
}

export const GET = apiHandler(handler, {
    admin: true,
    rateLimit: RATE_LIMIT_CONFIG.LENIENT
});
