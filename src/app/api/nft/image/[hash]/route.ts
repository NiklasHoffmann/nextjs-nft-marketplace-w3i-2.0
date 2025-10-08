import { NextRequest, NextResponse } from 'next/server';
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
const IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/'
];

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
 */
async function fetchFromIPFS(ipfsHash: string): Promise<Buffer | null> {
    for (const gateway of IPFS_GATEWAYS) {
        try {
            // Silent gateway attempts - only log errors
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(`${gateway}${ipfsHash}`, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'W3I-NFT-Marketplace/1.0'
                }
            });

            clearTimeout(timeout);

            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                // Success! Return buffer without logging
                return Buffer.from(arrayBuffer);
            }

            // Only log if all gateways fail (see below)
        } catch (err) {
            // Silent retry - continue to next gateway
            continue;
        }
    }

    // Only log when ALL gateways fail
    console.error('❌ All IPFS gateways failed for:', ipfsHash);
    return null;
}

/**
 * GET /api/nft/image/[ipfsHash] - Serve cached or download IPFS image
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ hash: string }> }
) {
    try {
        const { hash: ipfsHash } = await params;

        if (!ipfsHash || ipfsHash.length < 10) {
            return NextResponse.json({
                success: false,
                error: 'Invalid IPFS hash'
            }, { status: 400 });
        }

        // Removed: console.log for every image request - too spammy!

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
                    'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
                    'X-Cache-Status': 'HIT'
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
            // Removed: console.log for successful cache - reduces log spam
        } catch (err) {
            console.warn('⚠️ Failed to cache image:', err);
            // Continue anyway - we have the image
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
                'X-Cache-Status': 'MISS'
            }
        });

    } catch (error) {
        console.error('❌ Image proxy error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to proxy image'
        }, { status: 500 });
    }
}

/**
 * DELETE /api/nft/image/[ipfsHash] - Clear cached image (admin only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ hash: string }> }
) {
    try {
        const { hash: ipfsHash } = await params;

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

            return NextResponse.json({
                success: true,
                deleted,
                message: `Cleared ${deleted} cached images`
            });
        }

        // Delete specific image
        const cachedPath = path.join(CACHE_DIR, ipfsHash);

        try {
            await fs.unlink(cachedPath);
            return NextResponse.json({
                success: true,
                message: 'Cached image deleted',
                ipfsHash
            });
        } catch (err) {
            return NextResponse.json({
                success: false,
                error: 'Image not in cache'
            }, { status: 404 });
        }

    } catch (error) {
        console.error('❌ Image delete error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete image'
        }, { status: 500 });
    }
}
