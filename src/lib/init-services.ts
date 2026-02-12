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

export async function initializeBackgroundServices() {
    // Only run on server-side
    if (typeof window !== 'undefined') {
        return;
    }

    // Only initialize once
    if (isInitialized) {
        devLog.warn('⚠️ Background services already initialized');
        return;
    }

    devLog.info('🚀 Initializing background services...');
    isInitialized = true;

    try {
        // Start NFT Sync Service (includes WebSocket Event Listener + GraphQL Fallback)
        const syncService = getNFTSyncService();
        await syncService.start();

        devLog.info('✅ Background services initialized successfully');
    } catch (error) {
        devLog.error('❌ Failed to initialize background services:', error);
        // Don't throw - allow app to continue even if background services fail
    }
}

// Auto-initialize on module load (server-side only)
if (typeof window === 'undefined') {
    initializeBackgroundServices().catch((error) => devLog.error('❌ Background service init failed:', error));
}
