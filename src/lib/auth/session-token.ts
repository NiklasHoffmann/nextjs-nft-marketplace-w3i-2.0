/**
 * Signed session tokens (HS256 JWT-style)
 *
 * Shared implementation for both admin and user sessions. The `scope` claim
 * keeps the two isolated: a user token can never be replayed as an admin token.
 */

import crypto from 'crypto';

export type SessionScope = 'admin' | 'user';

/** Defaults to 'admin' so existing admin clients keep working without a scope param. */
export function parseSessionScope(value: string | null | undefined): SessionScope {
    return value === 'user' ? 'user' : 'admin';
}

export interface SessionPayload {
    jti: string;
    address: string;
    scope: SessionScope;
    isAdmin: boolean;
    iat: number;
    exp: number;
    nonce?: string;
}

function signToken(header: string, payload: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    return crypto
        .createHmac('sha256', secret)
        .update(`${header}.${payload}`)
        .digest('base64url');
}

export function createSessionToken(
    input: {
        jti: string;
        address: string;
        scope: SessionScope;
        isAdmin?: boolean;
        nonce?: string;
    },
    ttlMs: number
): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

    const bodyPayload: SessionPayload = {
        jti: input.jti,
        address: input.address.toLowerCase(),
        scope: input.scope,
        isAdmin: input.isAdmin ?? input.scope === 'admin',
        nonce: input.nonce,
        iat: Date.now(),
        exp: Date.now() + ttlMs,
    };

    const body = Buffer.from(JSON.stringify(bodyPayload)).toString('base64url');
    const signature = signToken(header, body);

    return `${header}.${body}.${signature}`;
}

export function verifySessionToken(token: string, expectedScope: SessionScope): SessionPayload | null {
    try {
        if (!process.env.JWT_SECRET) {
            return null;
        }

        const [header, payload, signature] = token.split('.');
        if (!header || !payload || !signature) {
            return null;
        }

        const expectedSignature = signToken(header, payload);
        const provided = Buffer.from(signature);
        const expected = Buffer.from(expectedSignature);
        if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
            return null;
        }

        const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Partial<SessionPayload>;

        if (!data.address || typeof data.address !== 'string') {
            return null;
        }

        if (!data.jti || typeof data.jti !== 'string') {
            return null;
        }

        if (typeof data.exp !== 'number' || data.exp < Date.now()) {
            return null;
        }

        // Tokens issued before scopes existed are admin sessions.
        const scope: SessionScope = data.scope === 'user' ? 'user' : 'admin';
        if (scope !== expectedScope) {
            return null;
        }

        return {
            jti: data.jti,
            address: data.address.toLowerCase(),
            scope,
            isAdmin: Boolean(data.isAdmin),
            iat: typeof data.iat === 'number' ? data.iat : 0,
            exp: data.exp,
            nonce: data.nonce,
        };
    } catch {
        return null;
    }
}

export function getSessionCookieOptions(maxAgeSeconds: number) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: maxAgeSeconds,
        path: '/',
    };
}
