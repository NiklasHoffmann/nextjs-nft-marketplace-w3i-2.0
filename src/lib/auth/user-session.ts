/**
 * User session (non-admin wallet authentication)
 *
 * Same signature-challenge flow as the admin session, but grants no admin
 * privileges. Unlike admin sessions these are not tracked in a revocation
 * registry — they carry no elevated rights and expire after `USER_SESSION_TTL_MS`.
 */

import {
    createSessionToken,
    getSessionCookieOptions,
    verifySessionToken,
    type SessionPayload,
} from '@/lib/auth/session-token';

export const USER_SESSION_COOKIE = 'user-session';
export const USER_SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export type UserSessionPayload = SessionPayload;

export function createUserSessionToken(
    payload: { jti: string; address: string; nonce?: string },
    ttlMs = USER_SESSION_TTL_MS
): string {
    return createSessionToken(
        {
            jti: payload.jti,
            address: payload.address,
            scope: 'user',
            isAdmin: false,
            nonce: payload.nonce,
        },
        ttlMs
    );
}

export function verifyUserSessionToken(token: string): UserSessionPayload | null {
    return verifySessionToken(token, 'user');
}

export function getUserSessionCookieOptions(maxAgeSeconds = USER_SESSION_TTL_MS / 1000) {
    return getSessionCookieOptions(maxAgeSeconds);
}
