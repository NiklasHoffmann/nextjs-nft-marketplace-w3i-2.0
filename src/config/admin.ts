/**
 * Admin Configuration
 * Zentrale Konfiguration für Admin-Zugriff
 */

// Admin Wallet-Adressen aus .env laden
const getAdminAddresses = (): string[] => {
    const addresses = process.env.NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES || '';
    return addresses
        .split(',')
        .map(addr => addr.trim().toLowerCase())
        .filter(addr => addr.length > 0);
};

export const ADMIN_ADDRESSES = getAdminAddresses();

/**
 * Prüft ob eine Wallet-Adresse Admin-Rechte hat
 */
export const isAdminAddress = (address: string | undefined | null): boolean => {
    if (!address) return false;
    const normalized = address.toLowerCase();
    return ADMIN_ADDRESSES.includes(normalized);
};

/**
 * App-weite Sperre aktiviert?
 * Wenn true, haben nur Admins Zugriff auf die gesamte App
 */
export const APP_LOCK_ENABLED = process.env.NEXT_PUBLIC_APP_LOCK_ENABLED === 'true';

/**
 * Öffentliche Routen die auch bei aktivierter App-Sperre erreichbar sind
 */
export const PUBLIC_ROUTES = [
    '/api/auth', // Auth-Endpoints müssen öffentlich bleiben
];

/**
 * Routen die immer Admin-Rechte erfordern (auch ohne App-Sperre)
 */
export const ADMIN_ONLY_ROUTES = [
    '/admin',
    '/api/nft/admin',
];
