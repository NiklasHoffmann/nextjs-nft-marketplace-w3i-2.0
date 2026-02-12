import { NextRequest, NextResponse } from 'next/server';
import { apiHandler, apiSuccess, parseJsonBody, BadRequestError, UnauthorizedError, InternalError } from '@/lib/api';
import { verifyMessage } from 'viem';
import { isAdminAddress } from '@/config/admin';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { devLog } from '@/utils';

const JWT_SECRET = process.env.JWT_SECRET;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Einfache JWT-Alternative mit HMAC
 */
function createToken(payload: any): string {
    if (!JWT_SECRET) {
        throw new InternalError('JWT_SECRET is not configured');
    }
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({
        ...payload,
        iat: Date.now(),
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24h
    })).toString('base64url');

    const signature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${body}`)
        .digest('base64url');

    return `${header}.${body}.${signature}`;
}

/**
 * POST /api/auth/verify
 * Verifiziert die Signatur und erstellt eine Session
 */
export const POST = apiHandler(async (request: NextRequest) => {
    const body = await parseJsonBody<{
        address: string;
        signature: string;
        message: string;
        nonce: string;
        timestamp: number;
    }>(request);

    if (!JWT_SECRET) {
        throw new InternalError('JWT_SECRET is not configured');
    }

    const { address, signature, message, nonce, timestamp } = body;

    // Validierung
    if (!address || !signature || !message || !nonce || !timestamp) {
        throw new BadRequestError('Missing required fields');
    }

    if (typeof timestamp !== 'number') {
        throw new BadRequestError('Invalid timestamp');
    }

    // Prüfe ob Timestamp nicht zu alt ist (max 5 Minuten)
    const now = Date.now();
    const age = now - timestamp;
    if (age > 5 * 60 * 1000) {
        throw new BadRequestError('Challenge expired');
    }

    // Verifiziere Signatur
    const normalizedAddress = address.toLowerCase();
    if (!/^0x[a-fA-F0-9]{40}$/.test(normalizedAddress)) {
        throw new BadRequestError('Invalid wallet address');
    }

    const expectedMessage = `Sign this message to authenticate as admin.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
    if (message !== expectedMessage) {
        throw new BadRequestError('Invalid challenge message');
    }

    const isValid = await verifyMessage({
        address: normalizedAddress as `0x${string}`,
        message,
        signature: signature as `0x${string}`
    });

    if (!isValid) {
        throw new UnauthorizedError('Invalid signature');
    }

    // Prüfe ob Admin-Adresse
    const isAdmin = isAdminAddress(normalizedAddress);

    if (!isAdmin) {
        throw new UnauthorizedError('Not an admin address');
    }

    // Erstelle Token
    const token = createToken({
        address: normalizedAddress,
        isAdmin: true,
        nonce
    });

    // Setze Session-Cookie
    const cookieStore = await cookies();
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // 'lax' statt 'strict' für bessere Kompatibilität mit Redirects
        maxAge: 60 * 60 * 24, // 24 Stunden
        path: '/',
    } as const;

    cookieStore.set('admin-session', token, cookieOptions);

    devLog.info('✅ Admin session created:', {
        address: normalizedAddress,
        cookieName: 'admin-session',
        expiresIn: '24h'
    });

    const response = apiSuccess({
        address: normalizedAddress,
        isAdmin: true
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
});
