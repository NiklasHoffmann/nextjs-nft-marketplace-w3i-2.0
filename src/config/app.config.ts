/**
 * APPLICATION CONFIGURATION
 * 
 * Zentrale Konfiguration für App-weite Einstellungen
 */

/**
 * Home Page Redirect Einstellungen
 */
export const HOME_CONFIG = {
    /**
     * Aktiviert automatischen Redirect von / zu einer anderen Route
     * 
     * true = User wird automatisch weitergeleitet
     * false = User bleibt auf Home Page
     */
    ENABLE_REDIRECT: false,

    /**
     * Ziel-Route für den Redirect
     * 
     * Optionen:
     * - '/history-towers' (Spiel)
     * - '/marketplace' (Marketplace)
     * - '/wallet' (User Wallet)
     */
    REDIRECT_TARGET: '/history-towers' as const,
} as const;

/**
 * Feature Flags
 */
export const FEATURES = {
    /** Marketplace Features aktiviert */
    MARKETPLACE_ENABLED: true,

    /** Batch-Listing im Sell-Flow (temporarily disabled, set to true to re-enable) */
    SELL_BATCH_LISTING: false,

    /** History Towers Spiel aktiviert */
    GAME_ENABLED: true,

    /** Admin Features sichtbar */
    ADMIN_FEATURES: true,
} as const;
