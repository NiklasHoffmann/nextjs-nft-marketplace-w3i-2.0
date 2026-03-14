/**
 * Global Initialization for Background Services
 * 
 * This file is imported early in the Next.js startup process via instrumentation.ts
 * It starts background services like NFT sync and real-time event listener.
 */

import { getNFTSyncService } from '@/services/nft-sync';
import { devLog } from '@/utils';

// Flag to ensure we only initialize once
let isInitialized = false;
let startupPromise: Promise<void> | null = null;

interface InitializeBackgroundServicesOptions {
    waitForReady?: boolean;
}

export async function initializeBackgroundServices(options: InitializeBackgroundServicesOptions = {}) {
    const { waitForReady = false } = options;

    // Only run on server-side
    if (typeof window !== 'undefined') {
        return;
    }

    // Only initialize once
    if (isInitialized) {
        if (waitForReady && startupPromise) {
            await startupPromise;
        }
        return;
    }

    devLog.info('🚀 Initializing background services...');
    isInitialized = true;

    startupPromise = (async () => {
        try {
            // Start NFT Sync Service (includes WebSocket Event Listener + GraphQL Fallback)
            const syncService = getNFTSyncService();
            await syncService.start();

            devLog.info('✅ Background services initialized successfully');
        } catch (error) {
            devLog.error('❌ Failed to initialize background services:', error);
            // Don't throw - allow app to continue even if background services fail
        }
    })();

    if (waitForReady) {
        await startupPromise;
    }
}
