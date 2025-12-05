/**
 * Global Initialization for Background Services
 * 
 * This file is imported early in the Next.js startup process via instrumentation.ts
 * It starts background services like NFT sync that should run continuously.
 */

import { getNFTSyncService } from '@/services/nft-sync';

// Flag to ensure we only initialize once
let isInitialized = false;

export async function initializeBackgroundServices() {
    // Only run on server-side
    if (typeof window !== 'undefined') {
        return;
    }

    // Only initialize once
    if (isInitialized) {
        console.log('⚠️ Background services already initialized');
        return;
    }

    console.log('🚀 Initializing background services...');
    isInitialized = true;

    try {
        // Start NFT Sync Service
        const syncService = getNFTSyncService();
        await syncService.start();

        console.log('✅ Background services initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize background services:', error);
        // Don't throw - allow app to continue even if background services fail
    }
}

// Auto-initialize on module load (server-side only)
if (typeof window === 'undefined') {
    initializeBackgroundServices().catch(console.error);
}
