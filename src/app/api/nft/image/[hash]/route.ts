import { NextRequest, NextResponse } from 'next/server';
import { apiHandler, apiSuccess, BadRequestError } from '@/lib/api';
import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { devLog } from '@/utils';

/**
 * IPFS Image Proxy - Layer 3 (Server-Side Image Cache with Compression)
 * 
 * Caches IPFS images on the server with:
 * 1. WebP/AVIF compression (70-85% size reduction)
 * 2. Automatic cache cleanup (500 MB limit, 90 day TTL)
 * 3. LRU eviction based on access times
 * 4. Shared cache between all users
 * 
 * Performance: ~2.3 MB → ~300-500 KB per image
 * 
 * Usage: /api/nft/image/[ipfsHash]
 * Example: /api/nft/image/QmXxx...
 */

const CACHE_DIR = path.join(process.cwd(), 'public', 'cached-nft-images');
const METADATA_FILE = path.join(CACHE_DIR, '.cache-metadata.json');
const IMAGE_CACHE_VERSION = 'v4';

// Cache Configuration
const MAX_CACHE_SIZE_MB = 500; // 500 MB maximum cache size
const MAX_FILE_AGE_DAYS = 90;  // 90 days TTL
const CLEANUP_THRESHOLD = 0.9; // Cleanup when 90% full
const TARGET_SIZE_AFTER_CLEANUP = 0.7; // Target 70% after cleanup

// Optimierte Gateway-Reihenfolge: Schnellste zuerst
const IPFS_GATEWAYS = [
    'https://cloudflare-ipfs.com/ipfs/',  // Cloudflare CDN - fastest
    'https://gateway.pinata.cloud/ipfs/', // Pinata - reliable
    'https://dweb.link/ipfs/',            // Protocol Labs - good fallback
    'https://ipfs.io/ipfs/'               // Public gateway - last resort
];

// Gateway Performance Tracking
const gatewayStats = new Map<string, { hits: number; fails: number; avgTime: number }>();
const inFlightImageJobs = new Map<string, Promise<{
    buffer: Buffer;
    format: string;
    contentType: string;
    originalSize: number;
    compressedSize: number;
} | null>>();

// Cache Metadata Interface
interface CacheMetadata {
    files: Record<string, {
        hash: string;
        size: number;
        originalSize?: number;
        compressionRatio?: number;
        accessCount: number;
        lastAccess: number;
        created: number;
        format: 'webp' | 'avif' | 'png' | 'jpeg' | 'gif' | 'svg';
    }>;
    totalSize: number;
    lastCleanup: number;
}

type PreferredImageFormat = 'avif' | 'webp';

function buildCacheFileName(safeCacheKey: string, format: PreferredImageFormat): string {
    return `${safeCacheKey}.${IMAGE_CACHE_VERSION}.${format}`;
}

function resolvePreferredFormat(request: NextRequest): PreferredImageFormat {
    const accept = request.headers.get('accept') || '';
    return accept.includes('image/avif') ? 'avif' : 'webp';
}

function formatToContentType(format: string, fallback: string = 'image/jpeg'): string {
    if (format === 'avif') return 'image/avif';
    if (format === 'webp') return 'image/webp';
    if (format === 'png') return 'image/png';
    if (format === 'jpeg' || format === 'jpg') return 'image/jpeg';
    if (format === 'gif') return 'image/gif';
    if (format === 'svg') return 'image/svg+xml';
    return fallback;
}

function inferContentTypeFromHash(hash: string): string {
    const lowered = hash.toLowerCase();
    if (lowered.endsWith('.avif')) return 'image/avif';
    if (lowered.endsWith('.webp')) return 'image/webp';
    if (lowered.endsWith('.png')) return 'image/png';
    if (lowered.endsWith('.gif')) return 'image/gif';
    if (lowered.endsWith('.svg')) return 'image/svg+xml';
    if (lowered.endsWith('.jpg') || lowered.endsWith('.jpeg')) return 'image/jpeg';
    return 'image/jpeg';
}

// Ensure cache directory exists
async function ensureCacheDir() {
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    } catch (err) {
        devLog.warn('⚠️ Failed to create cache directory:', err);
    }
}

// ---------------------------------------------------------------------------
// In-memory metadata cache — avoids concurrent disk reads/writes on every HIT
// Flushed to disk every 30 seconds (debounced). All per-request metadata
// updates are synchronous in-memory ops with zero I/O latency.
// ---------------------------------------------------------------------------
let metadataCache: CacheMetadata | null = null;
let metadataDirty = false;
let metadataFlushTimer: ReturnType<typeof setTimeout> | null = null;

async function getMetadata(): Promise<CacheMetadata> {
    if (!metadataCache) {
        try {
            const data = await fs.readFile(METADATA_FILE, 'utf-8');
            metadataCache = JSON.parse(data);
        } catch {
            metadataCache = { files: {}, totalSize: 0, lastCleanup: Date.now() };
        }
    }
    return metadataCache!;
}

function scheduleMetadataFlush() {
    if (metadataFlushTimer) return;
    metadataFlushTimer = setTimeout(async () => {
        metadataFlushTimer = null;
        if (metadataDirty && metadataCache) {
            metadataDirty = false;
            try {
                await fs.writeFile(METADATA_FILE, JSON.stringify(metadataCache, null, 2));
            } catch (err) {
                devLog.warn('⚠️ Failed to flush metadata:', err);
            }
        }
    }, 30_000);
}

// Synchronous in-memory update — no disk I/O in the hot path
function touchFileAccess(hash: string, size: number, format: string) {
    if (!metadataCache) return; // cache not loaded yet, skip
    if (!metadataCache.files[hash]) {
        metadataCache.files[hash] = {
            hash, size, format: format as any,
            accessCount: 0, lastAccess: Date.now(), created: Date.now()
        };
        metadataCache.totalSize += size;
    }
    const entry = metadataCache.files[hash]!;
    entry.accessCount++;
    entry.lastAccess = Date.now();
    metadataDirty = true;
    scheduleMetadataFlush();
}

// For admin stats endpoint — returns current in-memory or loads from disk
async function loadMetadata(): Promise<CacheMetadata> {
    return getMetadata();
}

async function saveMetadata(metadata: CacheMetadata): Promise<void> {
    metadataCache = metadata;
    metadataDirty = false;
    try {
        await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
    } catch (err) {
        devLog.warn('⚠️ Failed to save metadata:', err);
    }
}

/**
 * Check and perform cleanup if needed (fire-and-forget from the hot path)
 */
async function checkAndCleanup(): Promise<void> {
    const metadata = await getMetadata();
    const maxSize = MAX_CACHE_SIZE_MB * 1024 * 1024;
    
    if (metadata.totalSize < maxSize * CLEANUP_THRESHOLD) {
        return;
    }
    
    devLog.info(`🧹 Cache cleanup triggered: ${(metadata.totalSize / 1024 / 1024).toFixed(2)} MB / ${MAX_CACHE_SIZE_MB} MB`);
    
    const now = Date.now();
    const maxAge = MAX_FILE_AGE_DAYS * 24 * 60 * 60 * 1000;
    const targetSize = maxSize * TARGET_SIZE_AFTER_CLEANUP;
    
    const files = Object.values(metadata.files).sort((a, b) => {
        const scoreA = a.accessCount * 1000 - (now - a.lastAccess);
        const scoreB = b.accessCount * 1000 - (now - b.lastAccess);
        return scoreA - scoreB;
    });
    
    let currentSize = metadata.totalSize;
    let deleted = 0;
    
    for (const file of files) {
        if (currentSize <= targetSize) break;
        const age = now - file.created;
        const shouldDelete = age > maxAge || currentSize > targetSize;
        if (shouldDelete) {
            try {
                await fs.unlink(path.join(CACHE_DIR, file.hash));
                delete metadata.files[file.hash];
                currentSize -= file.size;
                deleted++;
            } catch (err) {
                devLog.warn(`⚠️ Failed to delete ${file.hash}:`, err);
            }
        }
    }
    
    metadata.totalSize = currentSize;
    metadata.lastCleanup = now;
    metadataDirty = true;
    scheduleMetadataFlush();
    
    devLog.info(`✅ Cleanup complete: Deleted ${deleted} files, ${(currentSize / 1024 / 1024).toFixed(2)} MB remaining`);
}

/**
 * Compress image using Sharp (WebP with fallback to AVIF)
 */
async function compressImage(
    buffer: Buffer,
    preferredFormat: PreferredImageFormat,
    sourceContentType: string
): Promise<{ buffer: Buffer; format: string; contentType: string; originalSize: number; compressedSize: number }> {
    const originalSize = buffer.length;
    const normalizedSourceType = sourceContentType.toLowerCase();

    // Never re-encode vector/animated formats in this path.
    // Re-encoding GIF/SVG can degrade rendering or break animation behavior.
    if (normalizedSourceType.includes('image/gif') || normalizedSourceType.includes('image/svg+xml')) {
        return {
            buffer,
            format: 'original',
            contentType: sourceContentType,
            originalSize,
            compressedSize: originalSize
        };
    }
    
    // Small files often lose perceptual quality when re-encoded.
    // Keep originals here to preserve detail and reduce CPU/latency.
    if (originalSize < 160 * 1024) {
        return {
            buffer,
            format: 'original',
            contentType: sourceContentType,
            originalSize,
            compressedSize: originalSize
        };
    }

    try {
        const image = sharp(buffer, { failOn: 'none' });
        const metadata = await image.metadata();
        const width = metadata.width || 0;
        const height = metadata.height || 0;
        const hasAlpha = Boolean(metadata.hasAlpha);
        const pixelCount = width * height;
        const isLargeHighResImage = pixelCount >= 8_000_000 || originalSize >= 5 * 1024 * 1024;

        // For very large images, prioritize visual quality over max compression.
        // AVIF can look softer at lower quality settings, so prefer high-quality WebP here.
        const targetFormat: PreferredImageFormat = isLargeHighResImage && preferredFormat === 'avif'
            ? 'webp'
            : preferredFormat;

        const compressed = targetFormat === 'avif'
            ? await image.avif({ quality: 80, effort: 4, chromaSubsampling: '4:4:4' }).toBuffer()
            : await image.webp(
                hasAlpha
                    ? { lossless: true, effort: 4 }
                    : { quality: isLargeHighResImage ? 94 : 92, effort: 4, smartSubsample: true }
            ).toBuffer();
        
        const compressedSize = compressed.length;
        const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        
        devLog.info(`📦 Compressed: ${(originalSize / 1024).toFixed(1)} KB → ${(compressedSize / 1024).toFixed(1)} KB (${ratio}% saved)`);
        
        return {
            buffer: compressed,
            format: targetFormat,
            contentType: formatToContentType(targetFormat),
            originalSize,
            compressedSize
        };
    } catch (err) {
        devLog.warn('⚠️ Compression failed, using original:', err);
        return {
            buffer,
            format: 'original',
            contentType: sourceContentType,
            originalSize,
            compressedSize: originalSize
        };
    }
}


/**
 * Try multiple IPFS gateways until one works
 * Optimized with performance tracking and adaptive ordering
 */
async function fetchFromIPFS(ipfsHash: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    // Sort gateways by performance (best first)
    const sortedGateways = [...IPFS_GATEWAYS].sort((a, b) => {
        const statsA = gatewayStats.get(a);
        const statsB = gatewayStats.get(b);
        if (!statsA || !statsB) return 0;

        // Sort by success rate first, then by speed
        const successRateA = statsA.hits / (statsA.hits + statsA.fails);
        const successRateB = statsB.hits / (statsB.hits + statsB.fails);

        if (successRateA !== successRateB) {
            return successRateB - successRateA;
        }
        return statsA.avgTime - statsB.avgTime;
    });

    const fetchGateway = async (gateway: string, timeoutMs: number): Promise<{ buffer: Buffer; contentType: string } | null> => {
        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch(`${gateway}${ipfsHash}`, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'W3I-NFT-Marketplace/1.0',
                    'Accept': 'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8'
                }
            });

            clearTimeout(timeout);

            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const fetchTime = Date.now() - startTime;

                // Update gateway stats
                updateGatewayStats(gateway, true, fetchTime);

                const contentType = response.headers.get('content-type') || inferContentTypeFromHash(ipfsHash);
                return {
                    buffer: Buffer.from(arrayBuffer),
                    contentType,
                };
            }

            // Update stats for failed response
            updateGatewayStats(gateway, false, Date.now() - startTime);
            return null;

        } catch (err) {
            // Update stats for error
            updateGatewayStats(gateway, false, Date.now() - startTime);
            return null;
        }
    };

    // Phase 1: Quick single try on best gateway for minimal overhead.
    const bestGateway = sortedGateways[0];
    if (bestGateway) {
        const firstAttempt = await fetchGateway(bestGateway, 3500);
        if (firstAttempt) {
            return firstAttempt;
        }
    }

    // Phase 2: Parallel race across remaining gateways to avoid long sequential waits.
    const fallbackGateways = sortedGateways.slice(1);
    if (fallbackGateways.length > 0) {
        try {
            const raced = await Promise.any(
                fallbackGateways.map(async (gateway) => {
                    const response = await fetchGateway(gateway, 5000);
                    if (!response) {
                        throw new Error(`Gateway failed: ${gateway}`);
                    }
                    return response;
                })
            );
            return raced;
        } catch {
            // All fallback gateways failed
        }
    }

    devLog.error('❌ All IPFS gateways failed for:', ipfsHash);
    return null;
}

/**
 * Track gateway performance for adaptive ordering
 */
function updateGatewayStats(gateway: string, success: boolean, time: number) {
    const stats = gatewayStats.get(gateway) || { hits: 0, fails: 0, avgTime: 0 };

    if (success) {
        stats.hits++;
        stats.avgTime = (stats.avgTime * (stats.hits - 1) + time) / stats.hits;
    } else {
        stats.fails++;
    }

    gatewayStats.set(gateway, stats);
}

/**
 * GET /api/nft/image/[ipfsHash] - Serve cached or download IPFS image
 * Note: This route is NOT wrapped with apiHandler because it returns binary data, not JSON
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ hash: string }> }
) {
    const { hash: ipfsHash } = await params;
    const safeCacheKey = encodeURIComponent(ipfsHash);
    const preferredFormat = resolvePreferredFormat(request);
    const cacheFileName = buildCacheFileName(safeCacheKey, preferredFormat);
    const alternateFormat: PreferredImageFormat = preferredFormat === 'avif' ? 'webp' : 'avif';
    const alternateCacheFileName = buildCacheFileName(safeCacheKey, alternateFormat);

    if (!ipfsHash || ipfsHash.length < 10) {
        return NextResponse.json({
            success: false,
            error: 'Invalid IPFS hash'
        }, { status: 400 });
    }

    await ensureCacheDir();

    // Check if already cached (format-specific files)
    const cachedPath = path.join(CACHE_DIR, cacheFileName);
    const alternateCachedPath = path.join(CACHE_DIR, alternateCacheFileName);
    const legacyCachedPath = path.join(CACHE_DIR, ipfsHash); // Old format without extension

    try {
        // Try new compressed format first
        let cached: Buffer;
        let format: string = preferredFormat;
        let cachePath = cachedPath;
        
        try {
            cached = await fs.readFile(cachedPath);
        } catch {
            try {
                // Fallback to alternate modern format
                cached = await fs.readFile(alternateCachedPath);
                format = alternateFormat;
                cachePath = alternateCachedPath;
            } catch {
                // Fallback to legacy format
                cached = await fs.readFile(legacyCachedPath);
                format = 'legacy';
                cachePath = legacyCachedPath;
            }
        }
        
        // Update access stats in-memory only — no disk I/O on the hot path
        touchFileAccess(path.basename(cachePath), cached.length, format);

        // Determine content type
        const contentType = format === 'legacy'
            ? inferContentTypeFromHash(ipfsHash)
            : formatToContentType(format);

        return new NextResponse(new Uint8Array(cached), {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable', // 1 year - images never change
                'CDN-Cache-Control': 'public, max-age=31536000',
                'Vercel-CDN-Cache-Control': 'public, max-age=31536000',
                'X-Cache-Status': 'HIT',
                'X-Cache-Format': format,
                'Vary': 'Accept',
                'ETag': `"${ipfsHash}"`,
                'Access-Control-Allow-Origin': '*',
                'Cross-Origin-Resource-Policy': 'cross-origin'
            }
        });
    } catch (err) {
        // Not cached, need to download
    }

    const runImageJob = async () => {
        // Download from IPFS
        const sourceImage = await fetchFromIPFS(ipfsHash);

        if (!sourceImage) {
            return null;
        }

        // Compress the image
        const result = await compressImage(sourceImage.buffer, preferredFormat, sourceImage.contentType);

        // Save compressed version to cache (fire-and-forget metadata updates)
        try {
            await fs.writeFile(cachedPath, new Uint8Array(result.buffer));

            // Update in-memory metadata — no blocking disk write
            getMetadata().then((metadata) => {
                metadata.files[cacheFileName] = {
                    hash: ipfsHash,
                    size: result.compressedSize,
                    originalSize: result.originalSize,
                    compressionRatio: ((result.originalSize - result.compressedSize) / result.originalSize * 100),
                    format: result.format === 'original'
                        ? (sourceImage.contentType.includes('png')
                            ? 'png'
                            : sourceImage.contentType.includes('gif')
                                ? 'gif'
                                : sourceImage.contentType.includes('svg')
                                    ? 'svg'
                                    : 'jpeg')
                        : result.format as any,
                    accessCount: 1,
                    lastAccess: Date.now(),
                    created: Date.now()
                };
                metadata.totalSize += result.compressedSize;
                metadataDirty = true;
                scheduleMetadataFlush();
                // Run cleanup check in background — never blocks the response
                checkAndCleanup().catch(e => devLog.warn('Cleanup error:', e));
            }).catch(e => devLog.warn('Metadata update error:', e));
        } catch (err) {
            devLog.warn('⚠️ Failed to cache image:', err);
        }

        return result;
    };

    let imageJob = inFlightImageJobs.get(cacheFileName);
    if (!imageJob) {
        imageJob = runImageJob().finally(() => {
            inFlightImageJobs.delete(cacheFileName);
        });
        inFlightImageJobs.set(cacheFileName, imageJob);
    }

    const imageResult = await imageJob;

    if (!imageResult) {
        return NextResponse.json({
            success: false,
            error: 'Failed to download image from IPFS'
        }, { status: 502 });
    }

    const { buffer: compressedBuffer, format, contentType, originalSize, compressedSize } = imageResult;

    // Return compressed image
    return new NextResponse(new Uint8Array(compressedBuffer), {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'CDN-Cache-Control': 'public, max-age=31536000',
            'Vercel-CDN-Cache-Control': 'public, max-age=31536000',
            'X-Cache-Status': 'MISS',
            'X-Cache-Format': format,
            'X-Image-Cache-Version': IMAGE_CACHE_VERSION,
            'X-Compression-Ratio': `${((originalSize - compressedSize) / originalSize * 100).toFixed(1)}%`,
            'X-Original-Size': originalSize.toString(),
            'X-Compressed-Size': compressedSize.toString(),
            'Vary': 'Accept',
            'ETag': `"${ipfsHash}"`,
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin'
        }
    });
}

/**
 * DELETE /api/nft/image/[ipfsHash] - Clear cached image (admin only)
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ hash: string }> }
) {
    return apiHandler(async () => {
        const { hash: ipfsHash } = await context.params;
        const safeCacheKey = encodeURIComponent(ipfsHash);

        if (ipfsHash === 'all') {
            // Clear all cached images (admin operation)
            const files = await fs.readdir(CACHE_DIR);
            let deleted = 0;
            let totalSize = 0;

            for (const file of files) {
                if (file === '.cache-metadata.json') continue; // Skip metadata
                
                try {
                    const filePath = path.join(CACHE_DIR, file);
                    const stats = await fs.stat(filePath);
                    totalSize += stats.size;
                    await fs.unlink(filePath);
                    deleted++;
                } catch (err) {
                    devLog.warn(`⚠️ Failed to delete ${file}:`, err);
                }
            }
            
            // Reset metadata
            await saveMetadata({
                files: {},
                totalSize: 0,
                lastCleanup: Date.now()
            });

            return apiSuccess({
                deleted,
                freedSpaceMB: (totalSize / 1024 / 1024).toFixed(2),
                message: `Cleared ${deleted} cached images (${(totalSize / 1024 / 1024).toFixed(2)} MB freed)`
            });
        }
        
        if (ipfsHash === 'stats') {
            // Return cache statistics
            const metadata = await loadMetadata();
            const files = await fs.readdir(CACHE_DIR);
            const fileCount = files.filter(f => f !== '.cache-metadata.json').length;
            
            return apiSuccess({
                totalFiles: fileCount,
                totalSizeMB: (metadata.totalSize / 1024 / 1024).toFixed(2),
                maxSizeMB: MAX_CACHE_SIZE_MB,
                usagePercent: ((metadata.totalSize / (MAX_CACHE_SIZE_MB * 1024 * 1024)) * 100).toFixed(1),
                lastCleanup: new Date(metadata.lastCleanup).toISOString(),
                topFiles: Object.values(metadata.files)
                    .sort((a, b) => b.accessCount - a.accessCount)
                    .slice(0, 10)
                    .map(f => ({
                        hash: f.hash,
                        sizeMB: (f.size / 1024 / 1024).toFixed(2),
                        originalSizeMB: f.originalSize ? (f.originalSize / 1024 / 1024).toFixed(2) : undefined,
                        compressionRatio: f.compressionRatio ? `${f.compressionRatio.toFixed(1)}%` : undefined,
                        accessCount: f.accessCount,
                        lastAccess: new Date(f.lastAccess).toISOString(),
                        format: f.format
                    }))
            });
        }

        // Delete specific image
        const webpPath = path.join(CACHE_DIR, buildCacheFileName(safeCacheKey, 'webp'));
        const avifPath = path.join(CACHE_DIR, buildCacheFileName(safeCacheKey, 'avif'));
        const legacyWebpPath = path.join(CACHE_DIR, `${safeCacheKey}.webp`);
        const legacyAvifPath = path.join(CACHE_DIR, `${safeCacheKey}.avif`);
        const legacyPath = path.join(CACHE_DIR, ipfsHash);

        try {
            let deletedPath: string | null = null;
            let size = 0;
            
            try {
                const stats = await fs.stat(avifPath);
                size = stats.size;
                await fs.unlink(avifPath);
                deletedPath = avifPath;
            } catch {
                try {
                    const stats = await fs.stat(webpPath);
                    size = stats.size;
                    await fs.unlink(webpPath);
                    deletedPath = webpPath;
                } catch {
                    try {
                        const stats = await fs.stat(legacyAvifPath);
                        size = stats.size;
                        await fs.unlink(legacyAvifPath);
                        deletedPath = legacyAvifPath;
                    } catch {
                        try {
                            const stats = await fs.stat(legacyWebpPath);
                            size = stats.size;
                            await fs.unlink(legacyWebpPath);
                            deletedPath = legacyWebpPath;
                        } catch {
                            const stats = await fs.stat(legacyPath);
                            size = stats.size;
                            await fs.unlink(legacyPath);
                            deletedPath = legacyPath;
                        }
                    }
                }
            }
            
            // Update metadata
            const metadata = await loadMetadata();
            const fileName = path.basename(deletedPath);
            const entry = metadata.files[fileName];
            if (entry) {
                metadata.totalSize -= entry.size;
                delete metadata.files[fileName];
                await saveMetadata(metadata);
            }
            
            return apiSuccess({
                message: 'Cached image deleted',
                ipfsHash,
                freedSpaceKB: (size / 1024).toFixed(2)
            });
        } catch (err) {
            throw new BadRequestError('Image not in cache');
        }
    }, { admin: true })(request);
}
