/**
 * Manual Sync Service Starter
 * 
 * Run this to manually start the sync service in the background
 * Usage: npm run sync:start
 */

import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.local') });

async function startSync() {
    console.log('\n🚀 Starting NFT Sync Service manually...\n');

    try {
        // Dynamic import for ES modules
        const { getNFTSyncService } = await import('../src/services/nft-sync/index.js');
        
        const syncService = getNFTSyncService();
        await syncService.start();

        console.log('\n✅ Sync Service is now running!');
        console.log('📊 Fetching listings every 30 seconds from The Graph v2');
        console.log('\n💡 Press Ctrl+C to stop\n');

        // Keep process alive
        setInterval(() => {
            const status = syncService.getStatus();
            if (status.isRunning) {
                console.log(`[${new Date().toLocaleTimeString()}] ✓ Sync service alive`);
            }
        }, 60000); // Status update every minute

    } catch (error) {
        console.error('\n❌ Error starting sync service:', error);
        process.exit(1);
    }
}

startSync();
