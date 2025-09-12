/**
 * Utility functions for working with smart contracts
 */

import { isValidAddress } from './validation';
import networkMapping from '../constants/network.mapping.json';

/**
 * Standard ERC-721 function selectors
 */
export const ERC721_SELECTORS = {
  BALANCE_OF: '0x70a08231',
  OWNER_OF: '0x6352211e',
  NAME: '0x06fdde03',
  SYMBOL: '0x95d89b41',
  TOKEN_URI: '0xc87b56dd',
  TOTAL_SUPPLY: '0x18160ddd',
  SUPPORTS_INTERFACE: '0x01ffc9a7',
} as const;

/**
 * Standard ERC-2981 (NFT Royalty Standard) function selectors
 */
export const ERC2981_SELECTORS = {
  ROYALTY_INFO: '0x2a55205a',
} as const;

/**
 * Common interface IDs for ERC standards
 */
export const INTERFACE_IDS = {
  ERC721: '0x80ac58cd',
  ERC721_METADATA: '0x5b5e139f',
  ERC721_ENUMERABLE: '0x780e9d63',
  ERC2981: '0x2a55205a',
  ERC165: '0x01ffc9a7',
} as const;

/**
 * Parse contract error messages to user-friendly strings
 */
export const parseContractError = (error: any): string => {
  if (!error) return 'Unknown error occurred';

  const message = error.message || error.reason || error.toString();

  // Common error patterns
  if (message.includes('insufficient funds')) {
    return 'Insufficient funds for this transaction';
  }

  if (message.includes('gas required exceeds allowance')) {
    return 'Transaction would require too much gas';
  }

  if (message.includes('nonce too low')) {
    return 'Transaction nonce is too low. Please try again';
  }

  if (message.includes('replacement transaction underpriced')) {
    return 'Transaction replacement fee is too low';
  }

  if (message.includes('execution reverted')) {
    return 'Transaction was reverted by the contract';
  }

  if (message.includes('user rejected')) {
    return 'Transaction was cancelled by user';
  }

  return message;
};

/**
 * Extract token ID from various formats
 */
export const normalizeTokenId = (tokenId: string | number | bigint): string => {
  if (typeof tokenId === 'bigint') {
    return tokenId.toString();
  }

  if (typeof tokenId === 'number') {
    return tokenId.toString();
  }

  // Handle hex strings
  if (typeof tokenId === 'string' && tokenId.startsWith('0x')) {
    return BigInt(tokenId).toString();
  }

  return tokenId.toString();
};

/**
 * Generate contract call data for common functions
 */
export const generateCallData = {
  balanceOf: (address: string): string => {
    if (!isValidAddress(address)) throw new Error('Invalid address');
    return ERC721_SELECTORS.BALANCE_OF + address.slice(2).padStart(64, '0');
  },

  ownerOf: (tokenId: string): string => {
    const normalizedTokenId = normalizeTokenId(tokenId);
    const hexTokenId = BigInt(normalizedTokenId).toString(16).padStart(64, '0');
    return ERC721_SELECTORS.OWNER_OF + hexTokenId;
  },

  tokenURI: (tokenId: string): string => {
    const normalizedTokenId = normalizeTokenId(tokenId);
    const hexTokenId = BigInt(normalizedTokenId).toString(16).padStart(64, '0');
    return ERC721_SELECTORS.TOKEN_URI + hexTokenId;
  },
};

/**
 * Check if a contract supports a specific interface
 */
export const supportsInterface = async (
  contractAddress: string,
  interfaceId: string,
  provider: any
): Promise<boolean> => {
  try {
    const callData = ERC721_SELECTORS.SUPPORTS_INTERFACE + interfaceId.slice(2).padStart(64, '0');
    const result = await provider.call({
      to: contractAddress,
      data: callData,
    });

    return result !== '0x0000000000000000000000000000000000000000000000000000000000000000';
  } catch {
    return false;
  }
};

/**
 * Get marketplace contract address for a given chain ID
 */
export const getMarketplaceAddress = (chainId?: number): `0x${string}` | undefined => {
  if (!chainId) return undefined;

  const chainConfig = networkMapping[chainId.toString() as keyof typeof networkMapping];
  if (!chainConfig?.NftMarketplace?.[0]) return undefined;

  return chainConfig.NftMarketplace[0] as `0x${string}`;
};
