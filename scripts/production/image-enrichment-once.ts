import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(process.cwd(), '.env.local') });

async function run() {
    process.env.APP_RUNTIME_ROLE = process.env.APP_RUNTIME_ROLE || 'worker';

    console.log('🖼️ Running one-shot NFT image enrichment batch...');

    try {
        const { imageEnrichmentSync } = await import('../../src/services/nft-sync/image-enrichment-sync');
        await imageEnrichmentSync.runOnce();
        console.log('✅ Image enrichment batch finished');
        process.exit(0);
    } catch (error) {
        console.error('❌ Image enrichment batch failed:', error);
        process.exit(1);
    }
}

run();
