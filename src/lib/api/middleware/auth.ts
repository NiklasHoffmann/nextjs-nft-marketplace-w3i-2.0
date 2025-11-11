/**
 * Admin Authentication Middleware
 * 
 * Prüft ob der User Admin-Rechte hat
 */

import { NextRequest } from 'next/server';
import { UnauthorizedError, ForbiddenError } from '../errors';

// Admin addresses aus Environment Variable
const ADMIN_ADDRESSES = (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || '')
    .split(',')
    .map(addr => addr.trim().toLowerCase())
    .filter(Boolean);

/**
 * Extrahiert die Wallet-Adresse aus dem Request
 * Sucht in Headers, Query Params oder Body
 */
export async function extractWalletAddress(request: NextRequest): Promise<string | null> {
    // 1. Check Authorization Header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const address = authHeader.substring(7);
        if (isValidAddress(address)) {
            return address.toLowerCase();
        }
    }

    // 2. Check Custom Header
    const walletHeader = request.headers.get('x-wallet-address');
    if (walletHeader && isValidAddress(walletHeader)) {
        return walletHeader.toLowerCase();
    }

    // 3. Check Query Parameter
    const { searchParams } = new URL(request.url);
    const walletParam = searchParams.get('wallet');
    if (walletParam && isValidAddress(walletParam)) {
        return walletParam.toLowerCase();
    }

    // 4. Check Request Body (für POST/PUT)
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        try {
            const body = await request.json();
            if (body.wallet && isValidAddress(body.wallet)) {
                return body.wallet.toLowerCase();
            }
            if (body.address && isValidAddress(body.address)) {
                return body.address.toLowerCase();
            }
        } catch {
            // Body is not JSON or already consumed
        }
    }

    return null;
}

/**
 * Prüft ob eine Adresse gültig ist (basic check)
 */
function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Prüft ob eine Wallet-Adresse Admin-Rechte hat
 */
export function isAdminAddress(address: string | null): boolean {
    if (!address) return false;
    return ADMIN_ADDRESSES.includes(address.toLowerCase());
}

/**
 * Middleware: Requires Admin Authentication
 * 
 * Wirft einen Error wenn der User kein Admin ist
 */
export async function requireAdmin(request: NextRequest): Promise<string> {
    const walletAddress = await extractWalletAddress(request);

    if (!walletAddress) {
        throw new UnauthorizedError('Wallet address required');
    }

    if (!isAdminAddress(walletAddress)) {
        throw new ForbiddenError('Admin access required');
    }

    return walletAddress;
}

/**
 * Middleware: Optional Admin Check
 * 
 * Gibt true zurück wenn Admin, false sonst (wirft keinen Error)
 */
export async function checkAdmin(request: NextRequest): Promise<boolean> {
    try {
        await requireAdmin(request);
        return true;
    } catch {
        return false;
    }
}

/**
 * Extrahiert Wallet-Adresse ohne Admin-Check
 * Nützlich für User-spezifische Endpoints
 */
export async function getWalletAddress(request: NextRequest): Promise<string | null> {
    return await extractWalletAddress(request);
}
