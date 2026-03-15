/**
 * Health Check & Service Initialization Endpoint
 * 
 * This endpoint:
 * 1. Checks if background services are running
 * 2. Auto-starts them if not running (fallback for dev mode)
 * 3. Returns service status
 */

import { apiHandler, apiSuccess, createErrorResponse } from '@/lib/api';
import { getRedisHealthStatus } from '@/lib/redis/client';
import { getNFTSyncService } from '@/services/nft-sync';
import { getSSEHealthStatus } from '@/services/sse/broadcast';
import { devLog } from '@/utils';
import { initializeBackgroundServices } from '@/lib/init-services';

// Track if services were auto-started
let autoStarted = false;
let autoStartPromise: Promise<void> | null = null;

export const GET = apiHandler(async () => {
    try {
        const quickMode = process.env.HEALTHCHECK_QUICK_MODE === 'true';
        const runtimeRole = (process.env.APP_RUNTIME_ROLE || 'all').trim().toLowerCase();
        const canRunBackgroundInThisProcess = runtimeRole !== 'web';
        const syncService = getNFTSyncService();
        const status = syncService.getStatus();

        if (quickMode) {
            return apiSuccess({
                status: status.isRunning ? 'running' : 'starting',
                mode: 'quick',
                services: {
                    isRunning: status.isRunning,
                    architecture: status.architecture,
                },
                infrastructure: {
                    process: {
                        pid: process.pid,
                        uptimeSec: Math.floor(process.uptime()),
                    },
                    runtimeRole,
                    timestamp: Date.now(),
                }
            });
        }

        const [redis, sse] = await Promise.all([
            getRedisHealthStatus(),
            Promise.resolve(getSSEHealthStatus())
        ]);

        const infrastructure = {
            redis,
            sse,
            process: {
                pid: process.pid,
                uptimeSec: Math.floor(process.uptime()),
            },
            runtimeRole,
            timestamp: Date.now(),
        };

        // Keep health endpoint fast for reverse-proxy checks (Coolify/nginx).
        // In production, auto-start can be explicitly enabled via env.
        const allowAutoStart = canRunBackgroundInThisProcess && (
            process.env.NODE_ENV !== 'production'
            || process.env.HEALTH_AUTO_START_BACKGROUND === 'true'
        );

        if (!status.isRunning && allowAutoStart) {
            if (!autoStartPromise && !autoStarted) {
                devLog.info('\n🔧 [Health Check] Triggering background service startup...');
                autoStartPromise = initializeBackgroundServices({ waitForReady: false })
                    .finally(() => {
                        autoStarted = true;
                        autoStartPromise = null;
                    });
            }

            return apiSuccess({
                status: 'starting',
                message: 'Background services startup triggered',
                services: syncService.getStatus(),
                infrastructure
            });
        }

        return apiSuccess({
            status: status.isRunning ? 'running' : 'stopped',
            services: status,
            infrastructure
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
