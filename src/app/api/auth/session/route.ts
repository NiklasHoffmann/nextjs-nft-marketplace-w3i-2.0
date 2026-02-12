import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, UnauthorizedError, InternalError } from '@/lib/api';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { devLog } from '@/utils';

const JWT_SECRET = process.env.JWT_SECRET;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Verifiziert und dekodiert ein Token
 */
function verifyToken(token: string): any | null {
    try {
        if (!JWT_SECRET) {
            return null;
        }
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [header, payload, signature] = parts;

        if (!payload) {
            return null;
        }

        // Verifiziere Signatur
        const expectedSignature = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(`${header}.${payload}`)
            .digest('base64url');

        if (signature !== expectedSignature) {
            return null;
        }

        // Dekodiere Payload
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());

        // PrÃ¼fe Ablaufdatum
        if (decodedPayload.exp && decodedPayload.exp < Date.now()) {
            return null;
        }

        return decodedPayload;
    } catch (error) {
        return null;
    }
}

/**
 * GET /api/auth/session
 * Prüft ob eine gültige Admin-Session existiert
 */
export const GET = apiHandler(async (request: NextRequest) => {
    if (!JWT_SECRET) {
        throw new InternalError('JWT_SECRET is not configured');
    }
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-session')?.value;

    devLog.info('🔍 Session check:', {
        hasCookie: !!token,
        cookieName: 'admin-session'
    });

    if (!token) {
        devLog.info('❌ No session cookie found');
        const response = apiSuccess({
            isAuthenticated: false
        });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
    }

    const payload = verifyToken(token);

    devLog.info('🔐 Token verification:', {
        isValid: !!payload,
        hasAdmin: payload?.isAdmin,
        address: payload?.address
    });

    if (!payload || !payload.isAdmin || typeof payload.address !== 'string') {
        devLog.info('❌ Invalid token or not admin');
        const response = apiSuccess({
            isAuthenticated: false
        });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
    }

    const normalizedAddress = payload.address.toLowerCase();
    devLog.info('✅ Session valid for:', normalizedAddress);
    const response = apiSuccess({
        isAuthenticated: true,
        address: normalizedAddress,
        isAdmin: payload.isAdmin,
        expiresAt: payload.exp ?? null
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
});
