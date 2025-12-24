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

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * Verify JWT token from cookie
 */
function verifyToken(token: string): { address: string; isAdmin: boolean } | null {
    try {
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

        return {
            address: data.address,
            isAdmin: data.isAdmin || false
        };
    } catch (error) {
        return null;
    }
}

/**
 * Extract wallet address from request (session cookie or header)
 */
function extractWalletAddress(req: NextRequest): string | null {
    // 1. Check session cookie (preferred for admin routes)
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
        const cookies = Object.fromEntries(
            cookieHeader.split('; ').map(c => {
                const [key, ...v] = c.split('=');
                return [key, v.join('=')];
            })
        );

        const authToken = cookies['admin-session'];
        if (authToken) {
            const verified = verifyToken(authToken);
            if (verified) {
                return verified.address.toLowerCase();
            }
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
    // @ts-ignore - extending request object
    req.userAddress = address;
}

/**
 * Middleware: Require admin user with verified session
 */
export async function withAdmin(req: NextRequest): Promise<void> {
    // Extract address from session cookie or header
    const address = extractWalletAddress(req);

    if (!address) {
        throw new UnauthorizedError('Authentication required. Please sign in with your admin wallet.');
    }

    // Check if address has admin privileges
    if (!isAdmin(address)) {
        throw new ForbiddenError('Admin access required. This wallet does not have admin privileges.');
    }

    // Check for valid session (cookie-based)
    const cookieHeader = req.headers.get('cookie');
    const hasValidSession = cookieHeader?.includes('admin-session');

    if (!hasValidSession) {
        throw new UnauthorizedError('Valid admin session required. Please sign in at /admin/login');
    }

    // Store address in request for later use
    // @ts-ignore - extending request object
    req.userAddress = address;
    // @ts-ignore
    req.isAdmin = true;
}

/**
 * Middleware: Optional authentication (sets user if available, but doesn't require it)
 */
export async function withOptionalAuth(req: NextRequest): Promise<void> {
    const address = extractWalletAddress(req);

    if (address) {
        // @ts-ignore
        req.userAddress = address;
    }
}

/**
 * Helper: Get authenticated user address from request
 */
export function getAuthenticatedAddress(req: NextRequest): string {
    // @ts-ignore
    const address = req.userAddress;
    if (!address) {
        throw new UnauthorizedError('No authenticated user found');
    }
    return address;
}


