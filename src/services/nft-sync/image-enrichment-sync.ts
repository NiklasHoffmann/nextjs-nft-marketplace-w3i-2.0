import sharp from 'sharp';
import { getCollection } from '@/lib/mongodb';
import { devLog } from '@/utils';
import { buildNFTImageVariants } from '@/utils/nft/image-variants';
import { extractIpfsInfoFromUrl } from '@/utils/nft/image-url';
import { promises as fs } from 'fs';
import path from 'path';

// Limit sharp to 1 libuv thread so it never saturates the thread pool.
// Without this, 3 concurrent sharp ops block ALL Node.js I/O and the web
// server becomes unresponsive on low-memory VPS instances.
sharp.concurrency(1);

// Conservative defaults — designed for small VPS (1-2 vCPU, <=2 GB RAM).
// Override via env vars when running on beefier hardware.
const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;
const DEFAULT_BATCH_SIZE = 5;          // was 25 — keeps per-run RAM spikes small
const DEFAULT_CONCURRENCY = 1;         // was 3  — one IPFS+sharp op at a time
const DEFAULT_MAX_BATCHES_PER_RUN = 3; // was 20 — caps a single run at 15 NFTs
const DEFAULT_FAST_FOLLOWUP_MS = 60_000; // was 5 000 — 60 s breathing room
const DEFAULT_INTER_CHUNK_DELAY_MS = 300; // yield to event loop between chunks
const CACHE_DIR = path.join(process.cwd(), 'public', 'cached-nft-images');
const CACHE_SCHEMA_VERSION = 'v6';
const CACHE_FORMATS = ['webp', 'avif', 'png', 'jpeg', 'gif', 'svg'] as const;

const isEnabled = (value: string | undefined, defaultValue: boolean): boolean => {
    if (value === undefined) return defaultValue;
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return defaultValue;
};

const buildMissingImageEnrichmentQuery = () => ({
    $and: [
        {
            $or: [
                { 'metadata.imageOriginal': { $exists: false } },
                { 'metadata.images': { $exists: false } },
                { 'metadata.images.thumb': { $exists: false } },
                { 'metadata.images.small': { $exists: false } },
                { 'metadata.images.card': { $exists: false } },
                { 'metadata.images.detail': { $exists: false } },
                { 'metadata.images.thumb': null },
                { 'metadata.images.small': null },
                { 'metadata.images.card': null },
                { 'metadata.images.detail': null },
                { 'metadata.imageMeta.width': { $exists: false } },
                { 'metadata.imageMeta.height': { $exists: false } },
                { 'metadata.imageMeta.mimeType': { $exists: false } },
                { 'metadata.blurDataURL': { $exists: false } },
                { 'metadata.blurDataURL': null },
            ],
        },
        {
            $or: [
                { 'metadata.image': { $exists: true, $nin: [null, ''] } },
                { 'metadata.imageOriginal': { $exists: true, $nin: [null, ''] } },
            ],
        },
    ],
});

const clampVariantWidth = (value: number): number => Math.max(128, Math.min(2048, value));

const resolveInternalApiBaseUrl = (): string => {
    return process.env.INTERNAL_API_BASE_URL
        || process.env.NEXT_PUBLIC_BASE_URL
        || `http://localhost:${process.env.PORT || 3000}`;
};

const extractExpectedCacheKeyFromVariantUrl = (value: unknown): string | null => {
    if (typeof value !== 'string' || !value.trim()) return null;

    try {
        const parsed = new URL(value, 'http://localhost');
        const marker = '/api/nft/image/';
        const markerIndex = parsed.pathname.indexOf(marker);
        if (markerIndex === -1) return null;

        const rawHash = parsed.pathname.slice(markerIndex + marker.length);
        if (!rawHash) return null;

        const widthParam = Number.parseInt(parsed.searchParams.get('w') || '', 10);
        if (!Number.isFinite(widthParam)) return null;

        const width = clampVariantWidth(widthParam);
        const decodedHash = decodeURIComponent(rawHash);
        return encodeURIComponent(`${decodedHash}|w=${width}`);
    } catch {
        return null;
    }
};

const extractSafeCacheKeyFromFileName = (fileName: string): string | null => {
    const formatPattern = CACHE_FORMATS.join('|');
    const match = fileName.match(new RegExp(`^(.*)\\.${CACHE_SCHEMA_VERSION}\\.(${formatPattern})$`));
    if (!match || !match[1]) return null;
    return match[1];
};

async function fetchImageBuffer(sourceUrl: string): Promise<{ buffer: Buffer; mimeType: string | null } | null> {
    if (!sourceUrl) return null;

    const ipfsInfo = extractIpfsInfoFromUrl(sourceUrl);
    const baseUrl = process.env.INTERNAL_API_BASE_URL
        || process.env.NEXT_PUBLIC_BASE_URL
        || `http://localhost:${process.env.PORT || 3000}`;

    const url = ipfsInfo
        ? `${baseUrl}/api/nft/image/${encodeURIComponent(ipfsInfo.path ? `${ipfsInfo.hash}/${ipfsInfo.path}` : ipfsInfo.hash)}`
        : sourceUrl;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timeout);

        if (!response.ok) {
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const mimeType = response.headers.get('content-type');

        return {
            buffer: Buffer.from(arrayBuffer),
            mimeType,
        };
    } catch {
        return null;
    }
}

async function buildBlurDataURL(buffer: Buffer): Promise<string | null> {
    try {
        const tiny = await sharp(buffer, { failOn: 'none' })
            .resize({ width: 16, height: 16, fit: 'cover' })
            .blur(0.5)
            .webp({ quality: 45, effort: 2 })
            .toBuffer();

        return `data:image/webp;base64,${tiny.toString('base64')}`;
    } catch {
        return null;
    }
}

export class NFTImageEnrichmentSync {
    private intervalId: NodeJS.Timeout | null = null;
    private fastFollowupTimer: NodeJS.Timeout | null = null;
    private isRunning = false;
    private intervalMs = Number(process.env.IMAGE_ENRICH_INTERVAL_MS || DEFAULT_INTERVAL_MS);
    private enabled = false;
    private nextRunAt: Date | null = null;

    private progress = {
        currentBatchTotal: 0,
        currentBatchProcessed: 0,
        currentBatchUpdated: 0,
        currentBatchFailed: 0,
    };

    private stats = {
        runsTotal: 0,
        runsWithWork: 0,
        totalProcessed: 0,
        totalUpdated: 0,
        totalFailed: 0,
        lastRunStartedAt: null as Date | null,
        lastRunCompletedAt: null as Date | null,
        lastRunDurationMs: null as number | null,
        lastRunCandidates: 0,
        lastRunProcessed: 0,
        lastRunUpdated: 0,
        lastRunFailed: 0,
        lastRunBatches: 0,
        remainingCandidatesEstimate: 0,
        lastRunDiskWarmed: 0,
        lastErrorAt: null as Date | null,
        lastErrorMessage: null as string | null,
    };

    private async runDiskVariantWarmup(batchSize: number, concurrency: number): Promise<{ warmed: number; remaining: number }> {
        const collection = await getCollection('nft_metadata');
        const docs = await collection.find(
            {
                $or: [
                    { 'metadata.image': { $exists: true, $nin: [null, ''] } },
                    { 'metadata.imageOriginal': { $exists: true, $nin: [null, ''] } },
                ],
            },
            {
                projection: {
                    metadata: 1,
                },
            }
        ).toArray();

        let cacheFiles: string[] = [];
        try {
            cacheFiles = await fs.readdir(CACHE_DIR);
        } catch {
            cacheFiles = [];
        }

        const cachedSafeKeys = new Set<string>();
        for (const fileName of cacheFiles) {
            if (fileName === '.cache-metadata.json') continue;
            const safeKey = extractSafeCacheKeyFromFileName(fileName);
            if (safeKey) cachedSafeKeys.add(safeKey);
        }

        const backlog: Array<{ urls: string[]; keys: string[] }> = [];

        for (const doc of docs as any[]) {
            const sourceImage = doc?.metadata?.imageOriginal || doc?.metadata?.image;
            if (!sourceImage) continue;

            const variants = doc?.metadata?.images && Object.keys(doc.metadata.images).length > 0
                ? doc.metadata.images
                : buildNFTImageVariants(sourceImage);

            const variantUrls = [variants?.thumb, variants?.small, variants?.card, variants?.detail].filter((u) => typeof u === 'string') as string[];
            const missingUrls: string[] = [];
            const missingKeys: string[] = [];

            for (const variantUrl of variantUrls) {
                const expectedKey = extractExpectedCacheKeyFromVariantUrl(variantUrl);
                if (!expectedKey) continue;
                if (!cachedSafeKeys.has(expectedKey)) {
                    missingUrls.push(variantUrl);
                    missingKeys.push(expectedKey);
                }
            }

            if (missingUrls.length > 0) {
                backlog.push({ urls: missingUrls, keys: missingKeys });
            }
        }

        if (backlog.length === 0) {
            return { warmed: 0, remaining: 0 };
        }

        const selected = backlog.slice(0, Math.max(1, batchSize));
        let warmed = 0;
        const baseUrl = resolveInternalApiBaseUrl();

        for (let i = 0; i < selected.length; i += concurrency) {
            const chunk = selected.slice(i, i + concurrency);

            await Promise.allSettled(
                chunk.map(async (entry) => {
                    let allOk = true;

                    for (let idx = 0; idx < entry.urls.length; idx += 1) {
                        const url = entry.urls[idx];
                        const expectedKey = entry.keys[idx];
                        if (!url || !expectedKey) continue;

                        const absoluteUrl = url.startsWith('http://') || url.startsWith('https://')
                            ? url
                            : `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;

                        try {
                            const response = await fetch(absoluteUrl, { cache: 'no-store' });
                            if (response.ok) {
                                cachedSafeKeys.add(expectedKey);
                            } else {
                                allOk = false;
                            }
                        } catch {
                            allOk = false;
                        }
                    }

                    if (allOk) {
                        warmed += 1;
                    }
                })
            );
        }

        const unresolvedInSelected = selected.length - warmed;
        const remaining = Math.max(0, backlog.length - selected.length) + Math.max(0, unresolvedInSelected);
        return { warmed, remaining };
    }

    getStatus() {
        return {
            isEnabled: this.enabled,
            isRunning: this.isRunning,
            intervalMs: this.intervalMs,
            nextRunAt: this.nextRunAt,
            ...this.stats,
            progress: {
                ...this.progress,
                percentage: this.progress.currentBatchTotal > 0
                    ? Number(((this.progress.currentBatchProcessed / this.progress.currentBatchTotal) * 100).toFixed(2))
                    : 0,
            },
        };
    }

    async runOnce(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;

        const runStartMs = Date.now();
        this.stats.runsTotal += 1;
        this.stats.lastRunStartedAt = new Date(runStartMs);
        this.stats.lastRunCompletedAt = null;
        this.stats.lastRunDurationMs = null;
        this.stats.lastRunCandidates = 0;
        this.stats.lastRunProcessed = 0;
        this.stats.lastRunUpdated = 0;
        this.stats.lastRunFailed = 0;
        this.stats.lastRunBatches = 0;
        this.stats.lastRunDiskWarmed = 0;
        this.progress.currentBatchTotal = 0;
        this.progress.currentBatchProcessed = 0;
        this.progress.currentBatchUpdated = 0;
        this.progress.currentBatchFailed = 0;

        try {
            const collection = await getCollection('nft_metadata');
            const batchSize = Number(process.env.IMAGE_ENRICH_BATCH_SIZE || DEFAULT_BATCH_SIZE);
            const concurrency = Number(process.env.IMAGE_ENRICH_CONCURRENCY || DEFAULT_CONCURRENCY);
            const maxBatchesPerRun = Math.max(1, Number(process.env.IMAGE_ENRICH_MAX_BATCHES_PER_RUN || DEFAULT_MAX_BATCHES_PER_RUN));

            let processedAnyBatch = false;
            let totalCandidatesThisRun = 0;

            for (let batchIndex = 0; batchIndex < maxBatchesPerRun; batchIndex += 1) {
                const candidates = await collection.find(
                    buildMissingImageEnrichmentQuery(),
                    {
                        projection: {
                            contractAddress: 1,
                            tokenId: 1,
                            metadata: 1,
                        },
                    },
                )
                    .limit(batchSize)
                    .toArray();

                if (candidates.length === 0) {
                    break;
                }

                processedAnyBatch = true;
                this.stats.lastRunBatches += 1;
                this.progress.currentBatchTotal = candidates.length;
                this.progress.currentBatchProcessed = 0;
                this.progress.currentBatchUpdated = 0;
                this.progress.currentBatchFailed = 0;
                totalCandidatesThisRun += candidates.length;

                devLog.info(`🖼️ [ImageEnrichment] Processing batch ${batchIndex + 1}/${maxBatchesPerRun} (${candidates.length} docs)...`);

                const interChunkDelayMs = Math.max(0, Number(process.env.IMAGE_ENRICH_INTER_CHUNK_DELAY_MS || DEFAULT_INTER_CHUNK_DELAY_MS));

                for (let i = 0; i < candidates.length; i += concurrency) {
                    const chunk = candidates.slice(i, i + concurrency);

                    // Yield to event loop before each chunk so web request handling
                    // is never starved during a long enrichment run.
                    if (i > 0 && interChunkDelayMs > 0) {
                        await new Promise(r => setTimeout(r, interChunkDelayMs));
                    }

                    await Promise.allSettled(
                        chunk.map(async (doc: any) => {
                            let updated = false;
                            try {
                                const sourceImage = doc?.metadata?.imageOriginal || doc?.metadata?.image;
                                if (!sourceImage) return;

                                const existingMeta = doc.metadata?.imageMeta || {};
                                const existingVariants = doc.metadata?.images;
                                const variants = existingVariants && Object.keys(existingVariants).length > 0
                                    ? existingVariants
                                    : buildNFTImageVariants(sourceImage);

                                let width = typeof existingMeta.width === 'number' ? existingMeta.width : null;
                                let height = typeof existingMeta.height === 'number' ? existingMeta.height : null;
                                let mimeType = existingMeta.mimeType || null;
                                let blurDataURL = doc.metadata?.blurDataURL || null;

                                if (width === null || height === null || !mimeType || !blurDataURL) {
                                    const imagePayload = await fetchImageBuffer(sourceImage);

                                    if (imagePayload) {
                                        try {
                                            const metadata = await sharp(imagePayload.buffer, { failOn: 'none' }).metadata();
                                            width = width ?? metadata.width ?? null;
                                            height = height ?? metadata.height ?? null;
                                            mimeType = mimeType
                                                || imagePayload.mimeType
                                                || (metadata.format ? `image/${metadata.format}` : null);
                                        } catch {
                                            // Keep existing fallback values
                                        }

                                        if (!blurDataURL) {
                                            blurDataURL = await buildBlurDataURL(imagePayload.buffer);
                                        }
                                    }
                                }

                                const updateResult = await collection.updateOne(
                                    {
                                        contractAddress: doc.contractAddress,
                                        tokenId: doc.tokenId,
                                    },
                                    {
                                        $set: {
                                            'metadata.imageOriginal': doc?.metadata?.imageOriginal || sourceImage,
                                            'metadata.images': variants,
                                            'metadata.imageMeta': {
                                                width,
                                                height,
                                                mimeType,
                                            },
                                            ...(blurDataURL ? { 'metadata.blurDataURL': blurDataURL } : {}),
                                            updatedAt: new Date(),
                                        },
                                    },
                                );

                                updated = updateResult.modifiedCount > 0;
                            } catch (error) {
                                this.progress.currentBatchFailed += 1;
                                this.stats.totalFailed += 1;
                                this.stats.lastRunFailed += 1;
                                this.stats.lastErrorAt = new Date();
                                this.stats.lastErrorMessage = error instanceof Error ? error.message : 'Unknown error';
                            } finally {
                                this.progress.currentBatchProcessed += 1;
                                this.stats.totalProcessed += 1;
                                this.stats.lastRunProcessed += 1;
                                if (updated) {
                                    this.progress.currentBatchUpdated += 1;
                                    this.stats.totalUpdated += 1;
                                    this.stats.lastRunUpdated += 1;
                                }
                            }
                        }),
                    );
                }
            }

            this.stats.lastRunCandidates = totalCandidatesThisRun;

            if (processedAnyBatch) {
                this.stats.runsWithWork += 1;
            }

            this.stats.remainingCandidatesEstimate = await collection.countDocuments(buildMissingImageEnrichmentQuery());

            // Only run disk warmup when there's nothing left to metadata-enrich —
            // running it on every cycle doubles I/O pressure for no gain.
            let diskWarmup = { warmed: 0, remaining: 0 };
            if (this.stats.remainingCandidatesEstimate === 0) {
                diskWarmup = await this.runDiskVariantWarmup(batchSize, concurrency);
            }
            this.stats.lastRunDiskWarmed = diskWarmup.warmed;
            this.stats.remainingCandidatesEstimate = Math.max(this.stats.remainingCandidatesEstimate, diskWarmup.remaining);

            devLog.info(
                `✅ [ImageEnrichment] Run completed: batches=${this.stats.lastRunBatches}, processed=${this.stats.lastRunProcessed}, diskWarmed=${this.stats.lastRunDiskWarmed}, remaining=${this.stats.remainingCandidatesEstimate}`
            );

            if (this.stats.remainingCandidatesEstimate > 0) {
                const fastFollowupMs = Math.max(1000, Number(process.env.IMAGE_ENRICH_FAST_FOLLOWUP_MS || DEFAULT_FAST_FOLLOWUP_MS));
                if (!this.fastFollowupTimer) {
                    this.nextRunAt = new Date(Date.now() + fastFollowupMs);
                    this.fastFollowupTimer = setTimeout(() => {
                        this.fastFollowupTimer = null;
                        void this.runOnce();
                    }, fastFollowupMs);
                }
            }
        } catch (error) {
            this.stats.lastErrorAt = new Date();
            this.stats.lastErrorMessage = error instanceof Error ? error.message : 'Unknown error';
            devLog.warn('⚠️ [ImageEnrichment] Batch failed (non-fatal):', error);
        } finally {
            this.isRunning = false;
            this.stats.lastRunCompletedAt = new Date();
            this.stats.lastRunDurationMs = Date.now() - runStartMs;
            this.nextRunAt = this.intervalId
                ? new Date(Date.now() + this.intervalMs)
                : null;
        }
    }

    start(): void {
        if (this.intervalId) return;

        this.enabled = isEnabled(process.env.BACKGROUND_ENABLE_IMAGE_ENRICHMENT, true);
        this.intervalMs = Number(process.env.IMAGE_ENRICH_INTERVAL_MS || DEFAULT_INTERVAL_MS);

        if (this.enabled) {
            void this.runOnce();

            const intervalMs = this.intervalMs;
            this.nextRunAt = new Date(Date.now() + intervalMs);
            this.intervalId = setInterval(() => {
                this.nextRunAt = new Date(Date.now() + intervalMs);
                void this.runOnce();
            }, intervalMs);

            devLog.info(`🖼️ [ImageEnrichment] Service started (interval=${intervalMs}ms)`);
            return;
        }

        devLog.info('⏭️ [ImageEnrichment] Service disabled via BACKGROUND_ENABLE_IMAGE_ENRICHMENT=false');
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.fastFollowupTimer) {
            clearTimeout(this.fastFollowupTimer);
            this.fastFollowupTimer = null;
        }
        this.nextRunAt = null;
        this.isRunning = false;
    }
}

export const imageEnrichmentSync = new NFTImageEnrichmentSync();
