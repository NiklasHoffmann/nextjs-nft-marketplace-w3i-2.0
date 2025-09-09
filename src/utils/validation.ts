/**
 * Validation utility functions
 */

/**
 * Validate Ethereum address
 */
export const isValidAddress = (address: string): boolean => {
  if (!address) return false;
  
  // Check if it starts with 0x and has 42 characters total
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address);
};

/**
 * Validate token ID (should be a valid number or numeric string)
 */
export const isValidTokenId = (tokenId: string | number): boolean => {
  if (tokenId === '' || tokenId === null || tokenId === undefined) return false;
  
  const numericTokenId = typeof tokenId === 'string' ? parseInt(tokenId, 10) : tokenId;
  return !isNaN(numericTokenId) && numericTokenId >= 0;
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate IPFS hash
 */
export const isValidIpfsHash = (hash: string): boolean => {
  if (!hash) return false;
  
  // QmHash format (most common)
  const qmHashRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  // CID v1 format
  const cidV1Regex = /^baf[0-9a-z]{56}$/;
  
  return qmHashRegex.test(hash) || cidV1Regex.test(hash);
};

/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate that a string is not empty or only whitespace
 */
export const isNonEmptyString = (value: string): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Validate that a value is a positive number
 */
export const isPositiveNumber = (value: number | string): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && num > 0;
};

/**
 * Validate NFT metadata structure
 */
export const isValidNFTMetadata = (metadata: any): boolean => {
  if (!metadata || typeof metadata !== 'object') return false;
  
  // At minimum, should have name or image
  return typeof metadata.name === 'string' || typeof metadata.image === 'string';
};

/**
 * Sanitize string to prevent XSS
 */
export const sanitizeString = (str: string): string => {
  if (!str) return '';
  
  return str
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};
