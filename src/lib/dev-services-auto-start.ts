/**
 * Background Service Auto-Starter for Development
 * 
 * In dev mode, instrumentation.ts doesn't run, so we start services here
 * This runs once when the first API route is accessed
 */

import { getNFTSyncService } from '@/services/nft-sync';
import { devLog } from '@/utils';
import { initializeBackgroundServices } from '@/lib/init-services';

let devServicesStarted = false;

export async function startDevServices() {
    if (typeof window !== 'undefined') return; // Client-side
    if (devServicesStarted) return; // Already started

    devServicesStarted = true;

    devLog.info('\n🚀 [Dev Mode] Auto-starting background services...');

    try {
        // Use the shared initializer so dev/prod start behavior stays consistent.
        // This includes NFT sync, image enrichment and optional prewarm jobs.
        await initializeBackgroundServices({ waitForReady: false });
        const syncService = getNFTSyncService();
        const syncStatus = syncService.getStatus();

        devLog.info(
            `✅ [Dev Mode] Background services startup triggered (sync running=${Boolean(syncStatus?.isRunning)})\n`
        );
    } catch (error) {
        devLog.error('❌ [Dev Mode] Failed to start background services:', error);
    }
}

// Auto-start on module load (server-side only)
if (typeof window === 'undefined') {
    startDevServices().catch((error) => devLog.error('❌ [Dev Mode] Auto-start failed:', error));
}
