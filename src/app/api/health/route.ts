/**
 * Health Check & Service Initialization Endpoint
 * 
 * This endpoint:
 * 1. Checks if background services are running
 * 2. Auto-starts them if not running (fallback for dev mode)
 * 3. Returns service status
 */

import { apiHandler, apiSuccess, createErrorResponse } from '@/lib/api';
import { getNFTSyncService } from '@/services/nft-sync';
import { devLog } from '@/utils';

// Track if services were auto-started
let autoStarted = false;

export const GET = apiHandler(async () => {
    try {
        const syncService = getNFTSyncService();
        const status = syncService.getStatus();

        // Auto-start services if not running (fallback for dev mode)
        if (!status.isRunning && !autoStarted) {
            devLog.info('\n🔧 [Health Check] Auto-starting background services...');
            await syncService.start();
            autoStarted = true;

            return apiSuccess({
                status: 'started',
                message: 'Background services auto-started',
                services: syncService.getStatus()
            });
        }

        return apiSuccess({
            status: status.isRunning ? 'running' : 'stopped',
            services: status
        });
    } catch (error) {
        devLog.error('❌ [Health Check] Error:', error);
        return createErrorResponse(
            'Health check failed',
            500,
            'HEALTH_CHECK_FAILED',
            { error: error instanceof Error ? error.message : 'Unknown error' }
        );
    }
});
