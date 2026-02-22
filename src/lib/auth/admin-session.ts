import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;

export interface AdminSessionPayload {
    jti: string;
    address: string;
    isAdmin: boolean;
    iat: number;
    exp: number;
    nonce?: string;
}

function signToken(header: string, payload: string): string {
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    return crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');
}

export function createAdminSessionToken(
    payload: Pick<AdminSessionPayload, 'address' | 'jti'> & Partial<Pick<AdminSessionPayload, 'isAdmin' | 'nonce'>>,
    ttlMs = 24 * 60 * 60 * 1000
): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

    const bodyPayload: AdminSessionPayload = {
        jti: payload.jti,
        address: payload.address.toLowerCase(),
        isAdmin: payload.isAdmin ?? true,
        nonce: payload.nonce,
        iat: Date.now(),
        exp: Date.now() + ttlMs,
    };

    const body = Buffer.from(JSON.stringify(bodyPayload)).toString('base64url');
    const signature = signToken(header, body);

    return `${header}.${body}.${signature}`;
}

export function verifyAdminSessionToken(token: string): AdminSessionPayload | null {
    try {
        if (!JWT_SECRET) {
            return null;
        }

        const [header, payload, signature] = token.split('.');
        if (!header || !payload || !signature) {
            return null;
        }

        const expectedSignature = signToken(header, payload);
        if (signature !== expectedSignature) {
            return null;
        }

        const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as AdminSessionPayload;

        if (!data.address || typeof data.address !== 'string') {
            return null;
        }

        if (!data.jti || typeof data.jti !== 'string') {
            return null;
        }

        if (typeof data.exp !== 'number' || data.exp < Date.now()) {
            return null;
        }

        return {
            ...data,
            address: data.address.toLowerCase(),
            isAdmin: Boolean(data.isAdmin),
        };
    } catch {
        return null;
    }
}

export function getAdminSessionCookieOptions(maxAgeSeconds = 60 * 60 * 24) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: maxAgeSeconds,
        path: '/',
    };
}
