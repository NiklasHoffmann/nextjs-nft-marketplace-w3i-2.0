/**
 * Utility functions for Admin access control
 */

/**
 * Check if a wallet address has admin access
 * @param walletAddress - The wallet address to check
 * @returns boolean - True if the address has admin access
 */
export function hasAdminAccess(walletAddress: string | undefined): boolean {
    if (!walletAddress) return false;

    // Get admin addresses from environment variable
    const adminAddresses = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || process.env.NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES;

    if (!adminAddresses) {
        // If no admin addresses are configured, deny access
        console.warn('NEXT_PUBLIC_ADMIN_ADDRESSES not configured - denying admin access');
        return false;
    }

    // Parse comma-separated addresses and normalize them
    const allowedAddresses = adminAddresses
        .split(',')
        .map(addr => addr.trim().toLowerCase())
        .filter(addr => addr.length > 0);

    // Check if the wallet address is in the allowed list
    const normalizedWalletAddress = walletAddress.toLowerCase();
    return allowedAddresses.includes(normalizedWalletAddress);
}

/**
 * Check if admin features are in read-only mode for all users
 * @returns boolean - True if admin features are read-only for all users
 */
export function isAdminReadOnlyMode(): boolean {
    return process.env.NEXT_PUBLIC_ADMIN_READ_ONLY_MODE === 'true' ||
        process.env.NEXT_PUBLIC_INSIGHTS_READ_ONLY_MODE === 'true';
}

/**
 * Check if a user can perform admin actions (combines admin access and read-only mode checks)
 * @param walletAddress - The wallet address to check
 * @returns boolean - True if the user can perform admin actions
 */
export function canPerformAdminActions(walletAddress: string | undefined): boolean {
    // If in read-only mode, no one can perform admin actions
    if (isAdminReadOnlyMode()) {
        return false;
    }

    // Check admin access
    return hasAdminAccess(walletAddress);
}

/**
 * Check if a user can view admin features (always true for admins, can be extended)
 * @param walletAddress - The wallet address to check
 * @returns boolean - True if the user can view admin features
 */
export function canViewAdminFeatures(walletAddress: string | undefined): boolean {
    // Only admins can view admin features
    return hasAdminAccess(walletAddress);
}

/**
 * Get a user-friendly message explaining why admin access is restricted
 * @param walletAddress - The wallet address to check
 * @returns string - Explanation message
 */
export function getAdminAccessMessage(walletAddress: string | undefined): string {
    if (!walletAddress) {
        return 'Please connect your wallet to access admin features.';
    }

    if (isAdminReadOnlyMode()) {
        return 'Admin features are currently disabled for maintenance.';
    }

    if (!hasAdminAccess(walletAddress)) {
        return 'You do not have admin permissions. Contact an administrator for access.';
    }

    return 'You have full admin access.';
}

/**
 * Log admin access attempts for security monitoring
 * @param walletAddress - The wallet address attempting access
 * @param action - The action being attempted (view, create, edit, delete)
 * @param resource - The resource being accessed
 * @param granted - Whether access was granted
 */
export function logAdminAccess(
    walletAddress: string | undefined,
    action: 'view' | 'create' | 'edit' | 'delete',
    resource: string,
    granted: boolean
): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        walletAddress: walletAddress || 'anonymous',
        action,
        resource,
        granted,
        userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'server'
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Admin Access Log:', logEntry);
    }

    // In production, this could be sent to a monitoring service
    // Example: sendToMonitoringService(logEntry);
}

/**
 * Validate that an address is properly formatted
 * @param address - The address to validate
 * @returns boolean - True if the address appears to be valid
 */
export function isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get the list of admin addresses (for display purposes only)
 * Note: This returns the addresses for UI purposes but should not be used for security decisions
 * @returns string[] - Array of admin addresses
 */
export function getAdminAddressesList(): string[] {
    const adminAddresses = process.env.NEXT_PUBLIC_ADMIN_ADDRESSES || process.env.NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES;

    if (!adminAddresses) {
        return [];
    }

    return adminAddresses
        .split(',')
        .map(addr => addr.trim().toLowerCase()) // Make consistent with hasAdminAccess
        .filter(addr => addr.length > 0 && isValidEthereumAddress(addr));
}

// Legacy functions for backwards compatibility with insights-specific code
// These can be removed once all code is migrated to use the generic admin functions

/**
 * @deprecated Use hasAdminAccess instead
 */
export function hasInsightsAdminAccess(walletAddress: string | undefined): boolean {
    return hasAdminAccess(walletAddress);
}

/**
 * @deprecated Use isAdminReadOnlyMode instead
 */
export function isInsightsReadOnlyMode(): boolean {
    return isAdminReadOnlyMode();
}

/**
 * @deprecated Use canPerformAdminActions instead
 */
export function canEditInsights(walletAddress: string | undefined): boolean {
    return canPerformAdminActions(walletAddress);
}

/**
 * @deprecated Use canViewAdminFeatures instead
 */
export function canViewInsights(walletAddress: string | undefined): boolean {
    // For insights, everyone can view, but for admin features, only admins can view
    // Keep the original behavior for backwards compatibility
    return true;
}

/**
 * @deprecated Use getAdminAccessMessage instead
 */
export function getInsightsAccessMessage(walletAddress: string | undefined): string {
    return getAdminAccessMessage(walletAddress);
}

/**
 * @deprecated Use logAdminAccess instead
 */
export function logInsightsAccess(
    walletAddress: string | undefined,
    action: 'view' | 'create' | 'edit' | 'delete',
    resource: string,
    granted: boolean
): void {
    logAdminAccess(walletAddress, action, resource, granted);
}