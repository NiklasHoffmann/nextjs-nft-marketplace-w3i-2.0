/**
 * Authentication Middleware
 *
 * Middleware for protecting API routes. Identity always comes from a
 * signature-backed session cookie — never from a client-supplied header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { UnauthorizedError, ForbiddenError } from '../api/errors';
import { isAdminAddress } from '@/config/admin';
import { verifyAdminSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/auth/admin-session';
import { verifyUserSessionToken, USER_SESSION_COOKIE } from '@/lib/auth/user-session';
import { isAdminSessionRevoked } from '@/lib/auth/admin-session-registry';
import { hasAdminAccess } from '@/lib/auth/admin-access';

function parseCookies(header: string | null): Record<string, string> {
    if (!header) return {};
    return Object.fromEntries(
        header.split('; ').map(cookie => {
            const [key, ...value] = cookie.split('=');
            return [key, value.join('=')];
        })
    );
}

function getCookie(req: NextRequest, name: string): string | null {
    const cookieFromApi = req.cookies?.get?.(name)?.value;
    if (cookieFromApi) {
        return cookieFromApi;
    }

    const cookies = parseCookies(req.headers.get('cookie'));
    return cookies[name] || null;
}

function getAdminSessionToken(req: NextRequest): string | null {
    return getCookie(req, ADMIN_SESSION_COOKIE);
}

/**
 * Resolve the authenticated wallet address from a verified session cookie.
 * An admin session also counts as a user session.
 */
async function resolveSessionAddress(req: NextRequest): Promise<{ address: string; isAdmin: boolean } | null> {
    const userToken = getCookie(req, USER_SESSION_COOKIE);
    if (userToken) {
        const payload = verifyUserSessionToken(userToken);
        if (payload) {
            return { address: payload.address, isAdmin: false };
        }
    }

    const adminToken = getAdminSessionToken(req);
    if (adminToken) {
        const payload = verifyAdminSessionToken(adminToken);
        if (payload && !(await isAdminSessionRevoked(payload.jti))) {
            return { address: payload.address, isAdmin: payload.isAdmin };
        }
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
    const session = await resolveSessionAddress(req);

    if (!session) {
        throw new UnauthorizedError('Authentication required. Please sign in with your wallet.');
    }

    // Store address in request for later use
    req.userAddress = session.address;
    if (session.isAdmin) {
        req.isAdmin = true;
    }
}

/**
 * Middleware: Require admin user with verified session
 */
export async function withAdmin(req: NextRequest): Promise<void> {
    const token = getAdminSessionToken(req);
    if (!token) {
        throw new UnauthorizedError('Valid admin session required. Please sign in at /admin/login');
    }

    const verified = verifyAdminSessionToken(token);
    if (!verified) {
        throw new UnauthorizedError('Invalid or expired admin session. Please sign in again.');
    }

    if (await isAdminSessionRevoked(verified.jti)) {
        throw new UnauthorizedError('Admin session has been revoked. Please sign in again.');
    }

    const address = verified.address.toLowerCase();
    const allowed = await hasAdminAccess(address);
    if (!verified.isAdmin || !allowed) {
        throw new ForbiddenError('Admin access required. This wallet does not have admin privileges.');
    }

    req.userAddress = address;
    req.isAdmin = true;
}

/**
 * Middleware: Optional authentication (sets user if available, but doesn't require it)
 */
export async function withOptionalAuth(req: NextRequest): Promise<void> {
    const session = await resolveSessionAddress(req);

    if (session) {
        req.userAddress = session.address;
        if (session.isAdmin) {
            req.isAdmin = true;
        }
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


