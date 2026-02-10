import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, UnauthorizedError } from '@/lib/api';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Verifiziert und dekodiert ein Token
 */
function verifyToken(token: string): any | null {
    try {
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
    const cookieStore = await cookies();
    const token = cookieStore.get('admin-session')?.value;

    console.log('🔍 Session check:', {
        hasCookie: !!token,
        cookieName: 'admin-session'
    });

    if (!token) {
        console.log('❌ No session cookie found');
        const response = apiSuccess({
            isAuthenticated: false
        });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
    }

    const payload = verifyToken(token);

    console.log('🔐 Token verification:', {
        isValid: !!payload,
        hasAdmin: payload?.isAdmin,
        address: payload?.address
    });

    if (!payload || !payload.isAdmin) {
        console.log('❌ Invalid token or not admin');
        const response = apiSuccess({
            isAuthenticated: false
        });
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        return response;
    }

    console.log('✅ Session valid for:', payload.address);
    const response = apiSuccess({
        isAuthenticated: true,
        address: payload.address,
        isAdmin: payload.isAdmin
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
});
