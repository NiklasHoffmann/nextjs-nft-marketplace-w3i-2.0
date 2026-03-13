import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getRedisHealthStatus } from '@/lib/redis/client';
import { apiHandler, apiSuccess } from '@/lib/api';
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { getSSEHealthStatus } from '@/services/sse/broadcast';
import { devLog } from '@/utils';
import '@/lib/dev-services-auto-start';
import { RATE_LIMIT_CONFIG } from '@/lib/middleware/rateLimit';

/**
 * GET /api/admin/system/health
 * Get system health status
 */
async function handler(req: NextRequest) {
    const db = await getDatabase();

    // 1. Database Health & Latency
    const dbStart = Date.now();
    await db.collection('marketplace_items').findOne({});
    const dbLatency = Date.now() - dbStart;

    // 2. Last Sync Check - Check sync_status collection if it exists, fallback to marketplace activity
    let minutesSinceLastSync = 9999;
    let lastSyncAt: Date | null = null;

    // Try to get from sync_status collection (if implemented)
    const syncStatus = await db.collection('sync_status')
        .findOne({ service: 'marketplace_events' });

    if (syncStatus && syncStatus.lastSyncAt) {
        lastSyncAt = new Date(syncStatus.lastSyncAt);
        minutesSinceLastSync = Math.floor((Date.now() - lastSyncAt.getTime()) / 60000);
    } else {
        // Fallback: Check last marketplace activity
        const lastActivity = await db.collection('marketplace_items')
            .find({})
            .sort({ updatedAt: -1 })
            .limit(1)
            .toArray();

        if (lastActivity.length > 0 && lastActivity[0]) {
            lastSyncAt = new Date(lastActivity[0].updatedAt);
            minutesSinceLastSync = Math.floor((Date.now() - lastSyncAt.getTime()) / 60000);
        }
    }

    let subgraphStatus: 'synced' | 'delayed' | 'stale' | 'no_activity' = 'synced';

    // If using sync_status, use tighter thresholds
    if (syncStatus) {
        if (minutesSinceLastSync > 15) {
            subgraphStatus = 'stale';
        } else if (minutesSinceLastSync > 5) {
            subgraphStatus = 'delayed';
        }
    } else {
        // If using marketplace activity, be more lenient
        if (minutesSinceLastSync > 1440) { // 24 hours
            subgraphStatus = 'stale';
        } else if (minutesSinceLastSync > 120) { // 2 hours
            subgraphStatus = 'delayed';
        } else {
            subgraphStatus = 'no_activity'; // No recent marketplace activity, but system might be healthy
        }
    }

    // 3. Contract Owner Check
    const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');
    const diamondAddress = process.env.NEXT_PUBLIC_DIAMOND_ADDRESS as `0x${string}`;
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

    let ownerStatus: { isOwner: boolean; currentOwner: string; network: string } | null = null;

    if (diamondAddress && rpcUrl) {
        try {
            const chain = chainId === 1 ? mainnet : sepolia;
            const publicClient = createPublicClient({
                chain,
                transport: http(rpcUrl)
            });

            const owner = await publicClient.readContract({
                address: diamondAddress,
                abi: [
                    {
                        name: 'owner',
                        type: 'function',
                        stateMutability: 'view',
                        inputs: [],
                        outputs: [{ type: 'address' }]
                    }
                ],
                functionName: 'owner'
            });

            ownerStatus = {
                isOwner: true, // We can't check against current user here, frontend will handle it
                currentOwner: owner as string,
                network: chain.name
            };
        } catch (error) {
            devLog.error('[Health Check] Contract owner check failed:', error);
        }
    }

    // 4. NFT Sync Service Status (check if background job ran recently)
    const syncServiceStatus = await db.collection('marketplace_items')
        .countDocuments({
            updatedAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // last 10 minutes
        });

    const isSyncActive = syncServiceStatus > 0;

    // 5. Pending/Cancelled Stats (already in dashboard, but include for completeness)
    const [pendingCount, cancelledCount, staleCount] = await Promise.all([
        db.collection('marketplace_items').countDocuments({ status: 'pending' }),
        db.collection('marketplace_items').countDocuments({ status: 'cancelled' }),
        db.collection('marketplace_items').countDocuments({
            status: 'listed',
            createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
    ]);

    const [redisHealth, sseHealth] = await Promise.all([
        getRedisHealthStatus(),
        Promise.resolve(getSSEHealthStatus())
    ]);

    return apiSuccess({
        database: {
            status: 'online',
            latency: dbLatency
        },
        subgraph: {
            status: subgraphStatus,
            minutesSinceLastSync,
            lastSyncAt
        },
        contract: ownerStatus,
        syncService: {
            status: isSyncActive ? 'active' : 'idle',
            recentUpdates: syncServiceStatus
        },
        marketplace: {
            pending: pendingCount,
            cancelled: cancelledCount,
            stale: staleCount
        },
        infrastructure: {
            redis: redisHealth,
            sse: sseHealth,
            process: {
                pid: process.pid,
                uptimeSec: Math.floor(process.uptime())
            },
            timestamp: Date.now()
        }
    });
}

export const GET = apiHandler(handler, {
    admin: true,
    rateLimit: RATE_LIMIT_CONFIG.LENIENT
});
