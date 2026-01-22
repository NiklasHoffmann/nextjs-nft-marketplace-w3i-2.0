/**
 * Manual Sync Service Starter (TypeScript)
 * 
 * Run this to manually start the sync service in the background
 * Usage: npm run sync:start
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

async function startSync() {
    console.log('\n🚀 Starting NFT Sync Service (HYBRID MODE)...\n');

    try {
        const { getNFTSyncService } = await import('../src/services/nft-sync/index.js');

        const syncService = getNFTSyncService();
        await syncService.start();

        console.log('\n✅ Hybrid Sync Service is now running!');
        console.log('🎧 WebSocket: Real-time events from Infura (< 1 second)');
        console.log('📊 TheGraph v2: Polling every 30 seconds (fallback)');
        console.log('💾 MongoDB: marketplace_items, nft_metadata, nft_stats');
        console.log('\n💡 Press Ctrl+C to stop\n');

        // Keep process alive and show status
        setInterval(() => {
            const status = syncService.getStatus();
            const now = new Date().toLocaleTimeString();

            if (status.isRunning) {
                const wsStatus = status.eventListener?.isConnected ? '🟢 Connected' : '🔴 Disconnected';
                console.log(`[${now}] Service alive - WebSocket: ${wsStatus} | Graph: ${status.graphSyncV2?.status || 'running'}`);
            } else {
                console.log(`[${now}] ⚠️ Sync service stopped!`);
            }
        }, 60000); // Status update every minute

    } catch (error) {
        console.error('\n❌ Error starting sync service:');
        console.error(error);
        process.exit(1);
    }
}

startSync();
