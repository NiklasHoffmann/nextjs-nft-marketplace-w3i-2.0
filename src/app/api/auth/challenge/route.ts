import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GET /api/auth/challenge
 * Generiert eine zufällige Challenge-Nachricht für Wallet-Signatur
 */
export async function GET(request: NextRequest) {
    try {
        // Generiere eindeutige Challenge
        const nonce = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        
        // Challenge-Nachricht die signiert werden muss
        const message = `Sign this message to authenticate as admin.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
        
        return NextResponse.json({
            message,
            nonce,
            timestamp
        });
    } catch (error) {
        console.error('Error generating challenge:', error);
        return NextResponse.json(
            { error: 'Failed to generate challenge' },
            { status: 500 }
        );
    }
}
