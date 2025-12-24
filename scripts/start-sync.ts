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
    console.log('\n🚀 Starting NFT Sync Service manually...\n');

    try {
        const { getNFTSyncService } = await import('../src/services/nft-sync/index.js');

        const syncService = getNFTSyncService();
        await syncService.start();

        console.log('\n✅ Sync Service is now running!');
        console.log('📊 Fetching listings every 30 seconds from The Graph v2');
        console.log('💾 Syncing to MongoDB: marketplace_items');
        console.log('\n💡 Press Ctrl+C to stop\n');

        // Keep process alive and show status
        setInterval(() => {
            const status = syncService.getStatus();
            const now = new Date().toLocaleTimeString();

            if (status.isRunning) {
                console.log(`[${now}] ✓ Sync service alive -`, status.graphSyncV2);
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
