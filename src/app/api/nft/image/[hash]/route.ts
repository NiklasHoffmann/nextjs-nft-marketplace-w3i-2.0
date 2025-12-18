import { NextRequest, NextResponse } from 'next/server';
import { apiHandler, apiSuccess, BadRequestError } from '@/lib/api';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * IPFS Image Proxy - Layer 3 (Server-Side Image Cache)
 * 
 * Caches IPFS images on the server to:
 * 1. Reduce slow IPFS gateway loading times
 * 2. Provide reliable image delivery
 * 3. Share cache between all users
 * 4. Reduce bandwidth costs
 * 
 * Usage: /api/nft/image/[ipfsHash]
 * Example: /api/nft/image/QmXxx...
 */

const CACHE_DIR = path.join(process.cwd(), 'public', 'cached-nft-images');
// Optimierte Gateway-Reihenfolge: Schnellste zuerst
const IPFS_GATEWAYS = [
    'https://cloudflare-ipfs.com/ipfs/',  // Cloudflare CDN - fastest
    'https://gateway.pinata.cloud/ipfs/', // Pinata - reliable
    'https://dweb.link/ipfs/',            // Protocol Labs - good fallback
    'https://ipfs.io/ipfs/'               // Public gateway - last resort
];

// Gateway Performance Tracking
const gatewayStats = new Map<string, { hits: number; fails: number; avgTime: number }>();

// Ensure cache directory exists
async function ensureCacheDir() {
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    } catch (err) {
        console.warn('⚠️ Failed to create cache directory:', err);
    }
}

/**
 * Try multiple IPFS gateways until one works
 * Optimized with performance tracking and adaptive ordering
 */
async function fetchFromIPFS(ipfsHash: string): Promise<Buffer | null> {
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

    for (const gateway of sortedGateways) {
        const startTime = Date.now();

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000); // Reduced to 8s for faster fallback

            const response = await fetch(`${gateway}${ipfsHash}`, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'W3I-NFT-Marketplace/1.0',
                    'Accept': 'image/webp,image/png,image/jpeg,image/*;q=0.8' // Prefer WebP
                }
            });

            clearTimeout(timeout);

            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const fetchTime = Date.now() - startTime;

                // Update gateway stats
                updateGatewayStats(gateway, true, fetchTime);

                return Buffer.from(arrayBuffer);
            }

            // Update stats for failed response
            updateGatewayStats(gateway, false, Date.now() - startTime);

        } catch (err) {
            // Update stats for error
            updateGatewayStats(gateway, false, Date.now() - startTime);
            continue;
        }
    }

    console.error('❌ All IPFS gateways failed for:', ipfsHash);
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

    if (!ipfsHash || ipfsHash.length < 10) {
        return NextResponse.json({
            success: false,
            error: 'Invalid IPFS hash'
        }, { status: 400 });
    }

    await ensureCacheDir();

    // Check if already cached
    const cachedPath = path.join(CACHE_DIR, ipfsHash);

    try {
        const cached = await fs.readFile(cachedPath);
        // Removed: console.log for cache hits - use X-Cache-Status header instead

        // Determine content type from file extension or default to image
        const ext = path.extname(ipfsHash).toLowerCase();
        const contentType = ext === '.png' ? 'image/png'
            : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
                : ext === '.gif' ? 'image/gif'
                    : ext === '.svg' ? 'image/svg+xml'
                        : ext === '.webp' ? 'image/webp'
                            : 'image/png'; // default

        return new NextResponse(new Uint8Array(cached), {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable', // 1 year - images never change
                'CDN-Cache-Control': 'public, max-age=31536000', // CDN: 1 year
                'Vercel-CDN-Cache-Control': 'public, max-age=31536000', // Vercel Edge: 1 year
                'X-Cache-Status': 'HIT',
                'Vary': 'Accept', // Enable content negotiation
                'ETag': `"${ipfsHash}"`, // Use IPFS hash as ETag
                'Access-Control-Allow-Origin': '*', // Allow cross-origin
                'Cross-Origin-Resource-Policy': 'cross-origin'
            }
        });
    } catch (err) {
        // Not cached, need to download (silent - no log spam)
    }

    // Download from IPFS
    const imageBuffer = await fetchFromIPFS(ipfsHash);

    if (!imageBuffer) {
        return NextResponse.json({
            success: false,
            error: 'Failed to download image from IPFS'
        }, { status: 502 });
    }

    // Save to cache
    try {
        await fs.writeFile(cachedPath, new Uint8Array(imageBuffer));
    } catch (err) {
        console.warn('⚠️ Failed to cache image:', err);
    }

    // Determine content type from buffer or default
    let contentType = 'image/png';
    if (imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8) {
        contentType = 'image/jpeg';
    } else if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) {
        contentType = 'image/png';
    } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49) {
        contentType = 'image/gif';
    } else if (imageBuffer.toString('utf8', 0, 5) === '<?xml' || imageBuffer.toString('utf8', 0, 4) === '<svg') {
        contentType = 'image/svg+xml';
    }

    return new NextResponse(new Uint8Array(imageBuffer), {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'CDN-Cache-Control': 'public, max-age=31536000',
            'Vercel-CDN-Cache-Control': 'public, max-age=31536000',
            'X-Cache-Status': 'MISS',
            'Vary': 'Accept',
            'ETag': `\"${ipfsHash}\"`,
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

    if (ipfsHash === 'all') {
        // Clear all cached images (admin operation)
        const files = await fs.readdir(CACHE_DIR);
        let deleted = 0;

        for (const file of files) {
            try {
                await fs.unlink(path.join(CACHE_DIR, file));
                deleted++;
            } catch (err) {
                console.warn(`⚠️ Failed to delete ${file}:`, err);
            }
        }

        return apiSuccess({
            deleted,
            message: `Cleared ${deleted} cached images`
        });
    }

    // Delete specific image
    const cachedPath = path.join(CACHE_DIR, ipfsHash);

    try {
        await fs.unlink(cachedPath);
        return apiSuccess({
            message: 'Cached image deleted',
            ipfsHash
        });
    } catch (err) {
        throw new BadRequestError('Image not in cache');
    }
    }, { admin: true })(request);
}
