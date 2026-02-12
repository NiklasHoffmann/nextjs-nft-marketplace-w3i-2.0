/**
 * Background Service Auto-Starter for Development
 * 
 * In dev mode, instrumentation.ts doesn't run, so we start services here
 * This runs once when the first API route is accessed
 */

import { getNFTSyncService } from '@/services/nft-sync';
import { devLog } from '@/utils';

let devServicesStarted = false;

export async function startDevServices() {
    if (typeof window !== 'undefined') return; // Client-side
    if (devServicesStarted) return; // Already started

    devServicesStarted = true;

    devLog.info('\n🚀 [Dev Mode] Auto-starting background services...');

    try {
        const syncService = getNFTSyncService();
        const status = syncService.getStatus();

        if (!status.isRunning) {
            await syncService.start();
            devLog.info('✅ [Dev Mode] NFT Sync Service started\n');
        } else {
            devLog.warn('⚠️ [Dev Mode] NFT Sync Service already running\n');
        }
    } catch (error) {
        devLog.error('❌ [Dev Mode] Failed to start background services:', error);
    }
}

// Auto-start on module load (server-side only)
if (typeof window === 'undefined') {
    startDevServices().catch((error) => devLog.error('❌ [Dev Mode] Auto-start failed:', error));
}
