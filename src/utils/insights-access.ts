/**
 * Utility functions for NFT Insights access control
 */

/**
 * Check if a wallet address has admin access to create/edit insights
 * @param walletAddress - The wallet address to check
 * @returns boolean - True if the address has admin access
 */
export function hasInsightsAdminAccess(walletAddress: string | undefined): boolean {
    if (!walletAddress) return false;

    // Get admin addresses from environment variable
    const adminAddresses = process.env.NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES;

    if (!adminAddresses) {
        // If no admin addresses are configured, deny access
        console.warn('NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES not configured - denying insights admin access');
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
 * Check if insights are in read-only mode for all users
 * @returns boolean - True if insights are read-only for all users
 */
export function isInsightsReadOnlyMode(): boolean {
    return process.env.NEXT_PUBLIC_INSIGHTS_READ_ONLY_MODE === 'true';
}

/**
 * Check if a user can edit insights (combines admin access and read-only mode checks)
 * @param walletAddress - The wallet address to check
 * @returns boolean - True if the user can edit insights
 */
export function canEditInsights(walletAddress: string | undefined): boolean {
    // If in read-only mode, no one can edit
    if (isInsightsReadOnlyMode()) {
        return false;
    }

    // Check admin access
    return hasInsightsAdminAccess(walletAddress);
}

/**
 * Check if a user can view insights (always true for now, but can be extended)
 * @param walletAddress - The wallet address to check
 * @returns boolean - True if the user can view insights
 */
export function canViewInsights(_walletAddress: string | undefined): boolean {
    // For now, everyone can view insights
    // This could be extended later to have private insights or other restrictions
    return true;
}

/**
 * Get a user-friendly message explaining why insights editing is restricted
 * @param walletAddress - The wallet address to check
 * @returns string - Explanation message
 */
export function getInsightsAccessMessage(walletAddress: string | undefined): string {
    if (!walletAddress) {
        return 'Please connect your wallet to access insights.';
    }

    if (isInsightsReadOnlyMode()) {
        return 'Insights editing is currently disabled for maintenance.';
    }

    if (!hasInsightsAdminAccess(walletAddress)) {
        return 'You do not have permission to create or edit insights. Contact an administrator for access.';
    }

    return 'You have full access to create and edit insights.';
}

/**
 * Log access attempts for security monitoring
 * @param walletAddress - The wallet address attempting access
 * @param action - The action being attempted (view, create, edit, delete)
 * @param resource - The resource being accessed (e.g., NFT contract:tokenId)
 * @param granted - Whether access was granted
 */
export function logInsightsAccess(
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
        console.log('🔐 Insights Access Log:', logEntry);
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
    const adminAddresses = process.env.NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES;

    if (!adminAddresses) {
        return [];
    }

    return adminAddresses
        .split(',')
        .map(addr => addr.trim().toLowerCase()) // Make consistent with hasInsightsAdminAccess
        .filter(addr => addr.length > 0 && isValidEthereumAddress(addr));
}