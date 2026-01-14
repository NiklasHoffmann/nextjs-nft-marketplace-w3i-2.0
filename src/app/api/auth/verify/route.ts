import { NextRequest, NextResponse } from 'next/server';
import { apiHandler, apiSuccess, parseJsonBody, BadRequestError, UnauthorizedError } from '@/lib/api';
import { verifyMessage } from 'viem';
import { isAdminAddress } from '@/config/admin';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * Einfache JWT-Alternative mit HMAC
 */
function createToken(payload: any): string {
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

    const { address, signature, message, nonce, timestamp } = body;

    // Validierung
    if (!address || !signature || !message || !nonce || !timestamp) {
        throw new BadRequestError('Missing required fields');
    }

    // Prüfe ob Timestamp nicht zu alt ist (max 5 Minuten)
    const now = Date.now();
    const age = now - timestamp;
    if (age > 5 * 60 * 1000) {
        throw new BadRequestError('Challenge expired');
    }

    // Verifiziere Signatur
    const isValid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`
    });

    if (!isValid) {
        throw new UnauthorizedError('Invalid signature');
    }

    // Prüfe ob Admin-Adresse
    const isAdmin = isAdminAddress(address);

    if (!isAdmin) {
        throw new UnauthorizedError('Not an admin address');
    }

    // Erstelle Token
    const token = createToken({
        address: address.toLowerCase(),
        isAdmin: true,
        nonce
    });

    // Setze Session-Cookie
    const cookieStore = await cookies();
    cookieStore.set('admin-session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // 'lax' statt 'strict' für bessere Kompatibilität mit Redirects
        maxAge: 60 * 60 * 24, // 24 Stunden
        path: '/'
    });

    console.log('✅ Admin session created:', {
        address: address.toLowerCase(),
        cookieName: 'admin-session',
        expiresIn: '24h'
    });

    return apiSuccess({
        address: address.toLowerCase(),
        isAdmin: true
    });
});
