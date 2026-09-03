import {
    createSessionToken,
    getSessionCookieOptions,
    verifySessionToken,
    type SessionPayload,
} from '@/lib/auth/session-token';

export const ADMIN_SESSION_COOKIE = 'admin-session';
export const ADMIN_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export type AdminSessionPayload = SessionPayload;

export function createAdminSessionToken(
    payload: Pick<AdminSessionPayload, 'address' | 'jti'> & Partial<Pick<AdminSessionPayload, 'isAdmin' | 'nonce'>>,
    ttlMs = ADMIN_SESSION_TTL_MS
): string {
    return createSessionToken(
        {
            jti: payload.jti,
            address: payload.address,
            scope: 'admin',
            isAdmin: payload.isAdmin ?? true,
            nonce: payload.nonce,
        },
        ttlMs
    );
}

export function verifyAdminSessionToken(token: string): AdminSessionPayload | null {
    return verifySessionToken(token, 'admin');
}

export function getAdminSessionCookieOptions(maxAgeSeconds = ADMIN_SESSION_TTL_MS / 1000) {
    return getSessionCookieOptions(maxAgeSeconds);
}
