import crypto from 'crypto';
import type { SessionScope } from '@/lib/auth/session-token';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

interface ChallengeEntry {
    nonce: string;
    timestamp: number;
    scope: SessionScope;
    expiresAt: number;
}

const challengeStore = new Map<string, ChallengeEntry>();

const cleanupInterval = setInterval(() => {
    const now = Date.now();

    for (const [nonce, entry] of challengeStore.entries()) {
        if (entry.expiresAt <= now) {
            challengeStore.delete(nonce);
        }
    }
}, 60 * 1000);

cleanupInterval.unref?.();

export function buildChallengeMessage(scope: SessionScope, nonce: string, timestamp: number): string {
    const intent = scope === 'admin' ? 'authenticate as admin' : 'authenticate with your wallet';
    return `Sign this message to ${intent}.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
}

export function buildAdminChallengeMessage(nonce: string, timestamp: number): string {
    return buildChallengeMessage('admin', nonce, timestamp);
}

export function createChallenge(scope: SessionScope) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();

    challengeStore.set(nonce, {
        nonce,
        timestamp,
        scope,
        expiresAt: timestamp + CHALLENGE_TTL_MS,
    });

    return {
        nonce,
        timestamp,
        message: buildChallengeMessage(scope, nonce, timestamp),
    };
}

export function createAdminChallenge() {
    return createChallenge('admin');
}

export function consumeChallenge(input: {
    nonce: string;
    timestamp: number;
    message: string;
    scope: SessionScope;
}): { valid: true } | { valid: false; reason: string } {
    const { nonce, timestamp, message, scope } = input;

    if (!/^[a-f0-9]{32}$/i.test(nonce)) {
        return { valid: false, reason: 'Invalid nonce format' };
    }

    const challenge = challengeStore.get(nonce);
    if (!challenge) {
        return { valid: false, reason: 'Challenge not found or already used' };
    }

    const now = Date.now();
    if (challenge.expiresAt <= now) {
        challengeStore.delete(nonce);
        return { valid: false, reason: 'Challenge expired' };
    }

    if (challenge.scope !== scope) {
        return { valid: false, reason: 'Challenge scope mismatch' };
    }

    if (challenge.timestamp !== timestamp) {
        return { valid: false, reason: 'Challenge timestamp mismatch' };
    }

    const expectedMessage = buildChallengeMessage(scope, nonce, timestamp);
    if (message !== expectedMessage) {
        return { valid: false, reason: 'Invalid challenge message' };
    }

    challengeStore.delete(nonce);
    return { valid: true };
}

export function consumeAdminChallenge(input: {
    nonce: string;
    timestamp: number;
    message: string;
}): { valid: true } | { valid: false; reason: string } {
    return consumeChallenge({ ...input, scope: 'admin' });
}
