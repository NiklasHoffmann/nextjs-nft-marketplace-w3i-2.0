/**
 * Utility functions for formatting data
 */

import { devLog } from '@/utils';
import { FormattedPrice } from '@/types';
import { formatEther as viemFormatEther } from 'viem';

/**
 * Format Wei value to Ether with proper decimals
 * Supports both string and bigint inputs
 */
export const formatEther = (weiValue: string | bigint): string => {
    try {
        // Convert Wei to ETH (1 ETH = 10^18 Wei)
        const wei = typeof weiValue === 'bigint' ? weiValue : BigInt(weiValue);
        const formatted = viemFormatEther(wei);

        const [whole = formatted] = formatted.split('.');
        if (whole.length > 15) {
            return formatted;
        }

        const ethValue = Number(formatted);

        // Format with appropriate decimal places
        if (ethValue === 0) {
            return '0';
        } else if (ethValue < 0.0001) {
            // For very small values, use more decimals
            return ethValue.toFixed(8).replace(/\.?0+$/, '');
        } else if (ethValue < 1) {
            // For values less than 1 ETH, show up to 6 decimals
            return ethValue.toFixed(6).replace(/\.?0+$/, '');
        }

        // For values >= 1 ETH, show up to 4 decimals
        return ethValue.toFixed(4).replace(/\.?0+$/, '');
    } catch (error) {
        devLog.error('formatters', 'Error formatting ether:', error);
        // Return original value as string if conversion fails
        return String(weiValue);
    }
};

/**
 * Trim token amounts to a max number of decimals without rounding up.
 */
export const formatTokenDisplay = (
    amount: string | number,
    decimals: number,
    maxDecimals: number = 4
): string => {
    const safeDecimals = Math.max(0, Math.min(maxDecimals, decimals));
    const normalized = typeof amount === 'number'
        ? amount.toFixed(Math.min(6, decimals))
        : amount;

    if (!normalized.includes('.')) return normalized;

    const [whole = normalized, fraction = ''] = normalized.split('.');
    const trimmedFraction = fraction.slice(0, safeDecimals).replace(/0+$/, '');
    return trimmedFraction ? `${whole}.${trimmedFraction}` : whole;
};

/**
 * Card price display format:
 * - default 2 decimals
 * - if this would be 0.00, show 4 decimals
 */
export const formatCardCurrencyAmount = (amount: string | number): string => {
    const numeric = typeof amount === 'number' ? amount : Number(amount);

    if (!Number.isFinite(numeric)) {
        return '0.00';
    }

    const absValue = Math.abs(numeric);
    if (absValue > 0 && absValue < 0.01) {
        return numeric.toFixed(4);
    }

    return numeric.toFixed(2);
};

/**
 * Format Ethereum address with ellipsis
 */
export const formatAddress = (address: string, startChars: number = 6, endChars: number = 4): string => {
    if (!address || address.length < startChars + endChars) {
        return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Format price with currency symbol and optional USD value
 */
export const formatPrice = (
    amount: string | number,
    currency: string = 'ETH',
    usdValue?: number
): FormattedPrice => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    const formattedValue = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: currency === 'ETH' ? 4 : 2,
    }).format(numericAmount);

    const result: FormattedPrice = {
        value: formattedValue,
        symbol: currency,
    };

    if (usdValue) {
        result.usdValue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(usdValue);
    }

    return result;
};

/**
 * Format large numbers with K, M, B suffixes
 */
export const formatCompactNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
    }).format(num);
};

/**
 * Format percentage with proper sign and decimals
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
    const formatted = value.toFixed(decimals);
    return value >= 0 ? `+${formatted}%` : `${formatted}%`;
};

/**
 * Format date to human-readable string
 */
export const formatDate = (date: Date | string | number): string => {
    const dateObj = new Date(date);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(dateObj);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string | number): string => {
    const now = new Date();
    const dateObj = new Date(date);
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return 'just now';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        return formatDate(dateObj);
    }
};
