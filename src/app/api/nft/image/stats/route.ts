import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess } from '@/lib/api';
import { promises as fs } from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'public', 'cached-nft-images');
const METADATA_FILE = path.join(CACHE_DIR, '.cache-metadata.json');
const MAX_CACHE_SIZE_MB = 500;

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

/**
 * Load cache metadata
 */
async function loadMetadata(): Promise<CacheMetadata> {
    try {
        const data = await fs.readFile(METADATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return {
            files: {},
            totalSize: 0,
            lastCleanup: Date.now()
        };
    }
}

/**
 * GET /api/nft/image/stats - Get cache statistics
 */
export const GET = apiHandler(async (request: NextRequest) => {
    const metadata = await loadMetadata();
    
    try {
        const files = await fs.readdir(CACHE_DIR);
        const fileCount = files.filter(f => f !== '.cache-metadata.json').length;
        
        // Calculate average compression ratio
        const filesWithCompression = Object.values(metadata.files).filter(f => f.compressionRatio);
        const avgCompression = filesWithCompression.length > 0
            ? filesWithCompression.reduce((sum, f) => sum + (f.compressionRatio || 0), 0) / filesWithCompression.length
            : 0;
        
        return apiSuccess({
            totalFiles: fileCount,
            totalSizeMB: parseFloat((metadata.totalSize / 1024 / 1024).toFixed(2)),
            maxSizeMB: MAX_CACHE_SIZE_MB,
            usagePercent: parseFloat(((metadata.totalSize / (MAX_CACHE_SIZE_MB * 1024 * 1024)) * 100).toFixed(1)),
            averageCompressionRatio: parseFloat(avgCompression.toFixed(1)),
            lastCleanup: new Date(metadata.lastCleanup).toISOString(),
            topFiles: Object.values(metadata.files)
                .sort((a, b) => b.accessCount - a.accessCount)
                .slice(0, 10)
                .map(f => ({
                    hash: f.hash.replace('.webp', ''),
                    sizeKB: parseFloat((f.size / 1024).toFixed(2)),
                    originalSizeKB: f.originalSize ? parseFloat((f.originalSize / 1024).toFixed(2)) : undefined,
                    compressionRatio: f.compressionRatio ? parseFloat(f.compressionRatio.toFixed(1)) : undefined,
                    accessCount: f.accessCount,
                    lastAccess: new Date(f.lastAccess).toISOString(),
                    ageHours: parseFloat(((Date.now() - f.created) / 1000 / 60 / 60).toFixed(1)),
                    format: f.format
                }))
        });
    } catch (err) {
        return apiSuccess({
            totalFiles: 0,
            totalSizeMB: 0,
            maxSizeMB: MAX_CACHE_SIZE_MB,
            usagePercent: 0,
            averageCompressionRatio: 0,
            lastCleanup: new Date(metadata.lastCleanup).toISOString(),
            topFiles: [],
            error: 'Cache directory not accessible'
        });
    }
});
