import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { apiHandler, apiSuccess } from '@/lib/api';

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics
 */
async function handler(req: NextRequest) {
    const db = await getDatabase();

    // 1. Total NFTs - alle jemals bezogenen NFTs aus nft_metadata
    const totalNFTs = await db.collection('nft_metadata').countDocuments();

    // 2. Active Listings - gelistete NFTs aus marketplace_items
    const activeListings = await db.collection('marketplace_items').countDocuments({
        status: 'LISTED'
    });

    // 3. Listed Volume - Summe aller Preise von gelisteten NFTs
    const listedVolumeResult = await db.collection('marketplace_items').aggregate([
        {
            $match: {
                status: 'LISTED'
            }
        },
        {
            $group: {
                _id: null,
                totalVolume: { $sum: { $toDouble: "$price" } }
            }
        }
    ]).toArray();

    const listedVolume = listedVolumeResult.length > 0 ? (listedVolumeResult[0]?.totalVolume ?? 0) : 0;

    // 4. Sales Volume - Summe aller verkauften NFTs
    const salesVolumeResult = await db.collection('marketplace_items').aggregate([
        {
            $match: {
                status: 'SOLD'
            }
        },
        {
            $group: {
                _id: null,
                totalVolume: { $sum: { $toDouble: "$price" } }
            }
        }
    ]).toArray();

    const salesVolume = salesVolumeResult.length > 0 ? (salesVolumeResult[0]?.totalVolume ?? 0) : 0;

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
        marketplaceUsers[0].allAddresses.forEach((addr: string) => allUserAddresses.add(addr.toLowerCase()));
    }

    // Add interaction users (likes, ratings, watchlist, notes)
    interactionUsers.forEach(userArray => {
        userArray.forEach((addr: string) => allUserAddresses.add(addr.toLowerCase()));
    });

    const totalUsers = allUserAddresses.size;

    // 6. Additional Stats
    const pendingListings = await db.collection('marketplace_items').countDocuments({
        status: 'PENDING'
    });

    const cancelledListings = await db.collection('marketplace_items').countDocuments({
        status: 'CANCELLED'
    });

    const totalSales = await db.collection('marketplace_items').countDocuments({
        status: 'SOLD'
    });

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
        salesVolume,       // Summe der Preise von verkauften Items
        totalVolume: salesVolume, // Backwards compatibility
        totalUsers,
        totalSales,
        pendingListings,
        cancelledListings,
        recentSales: recentSales.map((sale: any) => ({
            nftAddress: sale.nftAddress,
            tokenId: sale.tokenId,
            price: sale.price,
            seller: sale.seller,
            buyer: sale.buyer,
            soldAt: sale.updatedAt
        }))
    });
}

export const GET = apiHandler(handler, { admin: true });
