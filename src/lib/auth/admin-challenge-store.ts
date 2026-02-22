import crypto from 'crypto';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

interface ChallengeEntry {
    nonce: string;
    timestamp: number;
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

export function buildAdminChallengeMessage(nonce: string, timestamp: number): string {
    return `Sign this message to authenticate as admin.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
}

export function createAdminChallenge() {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();

    challengeStore.set(nonce, {
        nonce,
        timestamp,
        expiresAt: timestamp + CHALLENGE_TTL_MS,
    });

    return {
        nonce,
        timestamp,
        message: buildAdminChallengeMessage(nonce, timestamp),
    };
}

export function consumeAdminChallenge(input: {
    nonce: string;
    timestamp: number;
    message: string;
}): { valid: true } | { valid: false; reason: string } {
    const { nonce, timestamp, message } = input;

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

    if (challenge.timestamp !== timestamp) {
        return { valid: false, reason: 'Challenge timestamp mismatch' };
    }

    const expectedMessage = buildAdminChallengeMessage(nonce, timestamp);
    if (message !== expectedMessage) {
        return { valid: false, reason: 'Invalid challenge message' };
    }

    challengeStore.delete(nonce);
    return { valid: true };
}
