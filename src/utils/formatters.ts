/**
 * Utility functions for formatting data
 */

import { FormattedPrice } from '@/types';

/**
 * Format Wei value to Ether with proper decimals
 */
export const formatEther = (weiValue: string): string => {
  try {
    // Convert Wei to ETH (1 ETH = 10^18 Wei)
    const wei = BigInt(weiValue);
    const ethBigInt = wei / BigInt(10 ** 18);
    const remainder = wei % BigInt(10 ** 18);

    // Format with decimals if there's a remainder
    if (remainder === BigInt(0)) {
      return ethBigInt.toString();
    } else {
      // Convert remainder to decimal part (up to 4 decimal places for readability)
      const decimal = Number(remainder) / (10 ** 18);
      const formatted = (Number(ethBigInt) + decimal).toFixed(4);
      // Remove trailing zeros
      return parseFloat(formatted).toString();
    }
  } catch (error) {
    console.error('Error formatting ether:', error);
    return weiValue; // Return original value if conversion fails
  }
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
