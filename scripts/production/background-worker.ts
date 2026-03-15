/**
 * Dedicated background worker process.
 *
 * Runs all background services outside the web process so weaker servers
 * can keep HTTP latency stable while preserving full marketplace functionality.
 *
 * Usage:
 *   APP_RUNTIME_ROLE=worker npm run worker:start
 */

import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(process.cwd(), '.env.local') });

async function startWorker() {
    process.env.APP_RUNTIME_ROLE = process.env.APP_RUNTIME_ROLE || 'worker';

    console.log('\n🧩 Starting background worker process...');
    console.log(`   APP_RUNTIME_ROLE=${process.env.APP_RUNTIME_ROLE}`);

    try {
        const { initializeBackgroundServices } = await import('../../src/lib/init-services');

        await initializeBackgroundServices({
            waitForReady: true,
            runtimeRole: 'worker',
        });

        console.log('✅ Background worker ready');
        console.log('💡 Keep this process running alongside the web app\n');

        setInterval(() => {
            const now = new Date().toISOString();
            console.log(`[Worker] alive @ ${now}`);
        }, 60_000);
    } catch (error) {
        console.error('❌ Worker startup failed:', error);
        process.exit(1);
    }
}

startWorker();
