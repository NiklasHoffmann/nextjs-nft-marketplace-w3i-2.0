'use client';

/**
 * Client-side helper for the wallet-signature user session.
 *
 * The session is established lazily: no signature prompt appears until a
 * request actually needs authentication (401). The signer is registered by
 * `UserSessionProvider`, so non-React services can trigger a sign-in too.
 */

import { devLog } from '@/utils';

type SignMessage = (message: string) => Promise<string>;

interface RegisteredSigner {
    address: string;
    signMessage: SignMessage;
}

let activeSigner: RegisteredSigner | null = null;
let pendingSession: Promise<boolean> | null = null;
let authenticatedAddress: string | null = null;
let declinedAddress: string | null = null;

export function registerUserSessionSigner(signer: RegisteredSigner): void {
    const normalized = signer.address.toLowerCase();

    if (activeSigner?.address !== normalized) {
        authenticatedAddress = null;
        declinedAddress = null;
    }

    activeSigner = { address: normalized, signMessage: signer.signMessage };
}

export function clearUserSessionSigner(): void {
    activeSigner = null;
    authenticatedAddress = null;
    declinedAddress = null;
}

function isUserRejection(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error ?? '');
    return /user rejected|user denied|rejected the request/i.test(message);
}

async function readSessionAddress(): Promise<string | null> {
    // An admin session also satisfies withAuth, so it counts as a valid user session.
    for (const scope of ['user', 'admin'] as const) {
        try {
            const response = await fetch(`/api/auth/session?scope=${scope}`, {
                cache: 'no-store',
                credentials: 'include',
            });

            if (!response.ok) continue;

            const payload = await response.json();
            if (payload?.success && payload.data?.isAuthenticated) {
                return String(payload.data.address).toLowerCase();
            }
        } catch {
            // Try the next scope
        }
    }

    return null;
}

async function signIn(signer: RegisteredSigner): Promise<boolean> {
    const challengeRes = await fetch('/api/auth/challenge?scope=user', {
        cache: 'no-store',
        credentials: 'include',
    });

    if (!challengeRes.ok) {
        devLog.warn('[user-session] Challenge request failed:', challengeRes.status);
        return false;
    }

    const challenge = await challengeRes.json();
    if (!challenge?.success || !challenge.data) return false;

    const { message, nonce, timestamp } = challenge.data;
    const signature = await signer.signMessage(message);

    const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            address: signer.address,
            signature,
            message,
            nonce,
            timestamp,
            scope: 'user',
        }),
    });

    const verifyData = await verifyRes.json().catch(() => null);

    if (!verifyRes.ok || !verifyData?.success) {
        devLog.warn('[user-session] Verification failed:', verifyData?.error || verifyRes.status);
        return false;
    }

    authenticatedAddress = signer.address;
    return true;
}

/**
 * Ensure a valid user session exists for the connected wallet.
 * Returns false (without throwing) if no wallet is connected or the user declines.
 */
export async function ensureUserSession(): Promise<boolean> {
    const signer = activeSigner;
    if (!signer) return false;
    if (authenticatedAddress === signer.address) return true;
    if (declinedAddress === signer.address) return false;
    if (pendingSession) return pendingSession;

    pendingSession = (async () => {
        try {
            const existing = await readSessionAddress();
            if (existing === signer.address) {
                authenticatedAddress = existing;
                return true;
            }

            return await signIn(signer);
        } catch (error) {
            if (isUserRejection(error)) {
                declinedAddress = signer.address;
                devLog.info('[user-session] Signature declined by user');
            } else {
                devLog.error('[user-session] Sign-in failed:', error);
            }
            return false;
        } finally {
            pendingSession = null;
        }
    })();

    return pendingSession;
}

/**
 * fetch() for authenticated endpoints: establishes a user session on 401 and retries once.
 */
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const request: RequestInit = { ...init, credentials: 'include' };

    const response = await fetch(input, request);

    if (response.status !== 401) {
        return response;
    }

    authenticatedAddress = null;

    const established = await ensureUserSession();
    if (!established) {
        return response;
    }

    return fetch(input, request);
}
