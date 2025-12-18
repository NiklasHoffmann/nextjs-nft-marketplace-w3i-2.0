/**
 * NFT Sync Service Status & Control API
 * 
 * GET /api/marketplace/sync - Get sync service status (Admin only)
 * POST /api/marketplace/sync - Start/stop sync service (Admin only)
 */

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, BadRequestError } from '@/lib/api';
import { getNFTSyncService } from '@/services/nft-sync';

// Auto-start service on module load (server-side only)
if (typeof window === 'undefined') {
    let autoStarted = false;

    if (!autoStarted) {
        autoStarted = true;

        // Use setImmediate to avoid blocking module initialization
        setImmediate(async () => {
            try {
                const syncService = getNFTSyncService();
                const status = syncService.getStatus();

                if (!status.isRunning) {
                    console.log('🚀 Auto-starting NFT Sync Service...');
                    await syncService.start();
                    console.log('✅ NFT Sync Service auto-started successfully');
                }
            } catch (error) {
                console.error('❌ Failed to auto-start NFT Sync Service:', error);
            }
        });
    }
}

export const GET = apiHandler(async (request: NextRequest) => {
    const syncService = getNFTSyncService();
    const status = syncService.getStatus();

    return apiSuccess({
        ...status,
        timestamp: Date.now()
    });
}, { admin: true });

export const POST = apiHandler(async (request: NextRequest) => {
    const body = await request.json();
    const { action } = body; // 'start' or 'stop'

    if (!action || (action !== 'start' && action !== 'stop')) {
        throw new BadRequestError('Invalid action. Use "start" or "stop"');
    }

    const syncService = getNFTSyncService();

    if (action === 'start') {
        await syncService.start();
        return apiSuccess({
            message: 'Sync service started',
            timestamp: Date.now()
        });
    } else {
        await syncService.stop();
        return apiSuccess({
            message: 'Sync service stopped',
            timestamp: Date.now()
        });
    }
}, { admin: true });
