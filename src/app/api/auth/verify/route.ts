import { NextRequest, NextResponse } from 'next/server';
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
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { address, signature, message, nonce, timestamp } = body;

        // Validierung
        if (!address || !signature || !message || !nonce || !timestamp) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // PrÃ¼fe ob Timestamp nicht zu alt ist (max 5 Minuten)
        const now = Date.now();
        const age = now - timestamp;
        if (age > 5 * 60 * 1000) {
            return NextResponse.json(
                { error: 'Challenge expired' },
                { status: 400 }
            );
        }

        // Verifiziere Signatur
        const isValid = await verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: signature as `0x${string}`
        });

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            );
        }

        // PrÃ¼fe ob Admin-Adresse
        const isAdmin = isAdminAddress(address);

        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Not an admin address' },
                { status: 403 }
            );
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
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 24 Stunden
            path: '/'
        });

        return NextResponse.json({
            success: true,
            address: address.toLowerCase(),
            isAdmin: true
        });

    } catch (error) {
        console.error('Error verifying signature:', error);
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        );
    }
}
