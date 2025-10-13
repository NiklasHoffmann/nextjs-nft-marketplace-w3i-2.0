import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * Verifiziert und dekodiert ein Token
 */
function verifyToken(token: string): any | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const [header, body, signature] = parts;

        // Verifiziere Signatur
        const expectedSignature = crypto
            .createHmac('sha256', JWT_SECRET)
            .update(`${header}.${body}`)
            .digest('base64url');

        if (signature !== expectedSignature) {
            return null;
        }

        // Dekodiere Payload
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString());

        // Prüfe Ablaufdatum
        if (payload.exp && payload.exp < Date.now()) {
            return null;
        }

        return payload;
    } catch (error) {
        return null;
    }
}

/**
 * GET /api/auth/session
 * Prüft ob eine gültige Admin-Session existiert
 */
export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('admin-session')?.value;

        if (!token) {
            return NextResponse.json({
                isAuthenticated: false
            });
        }

        const payload = verifyToken(token);

        if (!payload || !payload.isAdmin) {
            return NextResponse.json({
                isAuthenticated: false
            });
        }

        return NextResponse.json({
            isAuthenticated: true,
            address: payload.address,
            isAdmin: payload.isAdmin
        });

    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json({
            isAuthenticated: false
        });
    }
}
