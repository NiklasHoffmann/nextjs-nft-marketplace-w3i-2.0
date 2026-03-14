/**
 * Global Initialization for Background Services
 * 
 * This file is imported early in the Next.js startup process via instrumentation.ts
 * It starts background services like NFT sync and real-time event listener.
 */

import { getNFTSyncService } from '@/services/nft-sync';
import { devLog } from '@/utils';
import { promises as fs } from 'fs';
import path from 'path';

// Flag to ensure we only initialize once
let isInitialized = false;
let startupPromise: Promise<void> | null = null;

interface InitializeBackgroundServicesOptions {
    waitForReady?: boolean;
}

/**
 * Prewarm image cache: download and compress all marketplace NFT images from IPFS
 * so the first user to view each image gets a fast response from disk instead of
 * waiting 3-8 seconds for an IPFS fetch.
 * 
 * Runs fully in the background — never blocks the server or startup.
 */
async function prewarmImageCache(): Promise<void> {
    const CACHE_DIR = path.join(process.cwd(), 'public', 'cached-nft-images');
    const IMAGE_API_BASE = '/api/nft/image/';
    const CONCURRENT = 3; // max parallel IPFS downloads

    try {
        // Dynamically import heavy modules — only available on server
        const { getDatabase } = await import('@/lib/mongodb');
        const db = await getDatabase();

        // Collect image URLs from all NFTs in nft_metadata
        const nfts = await db.collection('nft_metadata')
            .find(
                { 'metadata.image': { $exists: true, $ne: null } },
                { projection: { 'metadata.image': 1 } }
            )
            .limit(200)
            .toArray();

        // Extract IPFS hashes from URLs
        const hashes: string[] = [];
        for (const nft of nfts) {
            const url: string | undefined = nft.metadata?.image;
            if (!url) continue;

            let hash: string | null = null;
            if (url.startsWith('ipfs://')) {
                hash = url.replace('ipfs://', '');
            } else if (url.includes('/ipfs/')) {
                hash = url.split('/ipfs/')[1] || null;
            }
            if (hash) hashes.push(hash);
        }

        if (hashes.length === 0) return;
        devLog.info(`🌄 [ImagePrewarm] Checking ${hashes.length} NFT images...`);

        // Filter to only uncached hashes (fast fs.access check)
        await fs.mkdir(CACHE_DIR, { recursive: true });
        const uncached: string[] = [];
        for (const hash of hashes) {
            const safeName = `${encodeURIComponent(hash)}.webp`;
            try {
                await fs.access(path.join(CACHE_DIR, safeName));
            } catch {
                uncached.push(hash);
            }
        }

        if (uncached.length === 0) {
            devLog.info('🌄 [ImagePrewarm] All images already cached.');
            return;
        }
        devLog.info(`🌄 [ImagePrewarm] Prewarming ${uncached.length} uncached images...`);

        // Trigger caching via internal HTTP — reuses the route's dedup + compress logic
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
            || `http://localhost:${process.env.PORT || 3000}`;

        let cached = 0;
        for (let i = 0; i < uncached.length; i += CONCURRENT) {
            const batch = uncached.slice(i, i + CONCURRENT);
            await Promise.allSettled(
                batch.map(async (hash) => {
                    try {
                        const url = `${baseUrl}${IMAGE_API_BASE}${encodeURIComponent(hash)}`;
                        const res = await fetch(url, { cache: 'no-store' });
                        if (res.ok) cached++;
                    } catch {
                        // Ignore individual failures
                    }
                })
            );
        }

        devLog.info(`🌄 [ImagePrewarm] Done. ${cached}/${uncached.length} images cached.`);
    } catch (e) {
        devLog.warn('🌄 [ImagePrewarm] Failed (non-fatal):', e);
    }
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

            // After sync service is up, prewarm image cache in background (fire-and-forget)
            // Delay by 10s to avoid competing with the initial sync for network bandwidth
            setTimeout(() => {
                prewarmImageCache().catch(e => devLog.warn('ImagePrewarm error:', e));
            }, 10_000);
        } catch (error) {
            devLog.error('❌ Failed to initialize background services:', error);
            // Don't throw - allow app to continue even if background services fail
        }
    })();

    if (waitForReady) {
        await startupPromise;
    }
}
