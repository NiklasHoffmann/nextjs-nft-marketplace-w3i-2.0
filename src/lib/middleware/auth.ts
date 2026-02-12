/**
 * Authentication Middleware
 * 
 * Middleware for protecting API routes with authentication.
 * Supports session-based auth (via cookies) and wallet-based authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnauthorizedError, ForbiddenError } from '../api/errors';
import { isAdminAddress } from '@/config/admin';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Verify JWT token from cookie
 */
function verifyToken(token: string): { address: string; isAdmin: boolean } | null {
    try {
        if (!JWT_SECRET) {
            return null;
        }
        const [header, payload, signature] = token.split('.');

        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(`${header}.${payload}`)
            .digest('base64url');

        if (signature !== expectedSignature) {
            return null;
        }

        // Parse payload
        if (!payload) return null;
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString());

        // Check expiration
        if (data.exp && data.exp < Date.now()) {
            return null;
        }

        if (!data.address || typeof data.address !== 'string') {
            return null;
        }

        return {
            address: data.address,
            isAdmin: data.isAdmin || false
        };
    } catch (error) {
        return null;
    }
}

function parseCookies(header: string | null): Record<string, string> {
    if (!header) return {};
    return Object.fromEntries(
        header.split('; ').map(c => {
            const [key, ...v] = c.split('=');
            return [key, v.join('=')];
        })
    );
}

function getAdminSessionToken(req: NextRequest): string | null {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    return cookies['admin-session'] || null;
}

/**
 * Extract wallet address from request (session cookie or header)
 */
function extractWalletAddress(req: NextRequest): string | null {
    // 1. Check session cookie (preferred for admin routes)
    const authToken = getAdminSessionToken(req);
    if (authToken) {
        const verified = verifyToken(authToken);
        if (verified) {
            return verified.address.toLowerCase();
        }
    }

    // 2. Check X-Wallet-Address header (for API calls with wallet)
    const walletHeader = req.headers.get('x-wallet-address');
    if (walletHeader && /^0x[a-fA-F0-9]{40}$/.test(walletHeader)) {
        return walletHeader.toLowerCase();
    }

    // 3. Check query parameters (walletAddress or userId - mainly for testing and client-side calls)
    const walletAddress = req.nextUrl.searchParams.get('walletAddress');
    if (walletAddress && /^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return walletAddress.toLowerCase();
    }

    const userId = req.nextUrl.searchParams.get('userId');
    if (userId && /^0x[a-fA-F0-9]{40}$/.test(userId)) {
        return userId.toLowerCase();
    }

    return null;
}

/**
 * Check if address is admin (uses central admin config)
 */
export function isAdmin(address: string): boolean {
    return isAdminAddress(address);
}

/**
 * Middleware: Require any authenticated user
 */
export async function withAuth(req: NextRequest): Promise<void> {
    const address = extractWalletAddress(req);

    if (!address) {
        throw new UnauthorizedError('Authentication required. Please connect your wallet.');
    }

    // Store address in request for later use
    req.userAddress = address;
}

/**
 * Middleware: Require admin user with verified session
 */
export async function withAdmin(req: NextRequest): Promise<void> {
    const token = getAdminSessionToken(req);
    if (!token) {
        throw new UnauthorizedError('Valid admin session required. Please sign in at /admin/login');
    }

    const verified = verifyToken(token);
    if (!verified) {
        throw new UnauthorizedError('Invalid or expired admin session. Please sign in again.');
    }

    const address = verified.address.toLowerCase();
    if (!verified.isAdmin || !isAdmin(address)) {
        throw new ForbiddenError('Admin access required. This wallet does not have admin privileges.');
    }

    req.userAddress = address;
    req.isAdmin = true;
}

/**
 * Middleware: Optional authentication (sets user if available, but doesn't require it)
 */
export async function withOptionalAuth(req: NextRequest): Promise<void> {
    const address = extractWalletAddress(req);

    if (address) {
        req.userAddress = address;
    }
}

/**
 * Helper: Get authenticated user address from request
 */
export function getAuthenticatedAddress(req: NextRequest): string {
    const address = req.userAddress;
    if (!address) {
        throw new UnauthorizedError('No authenticated user found');
    }
    return address;
}


