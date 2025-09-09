/**
 * Application configuration and constants
 */

import { Currency } from '@/types/currency';

// App metadata
export const APP_CONFIG = {
  name: 'NFT Marketplace',
  description: 'A modern NFT marketplace built with Next.js and Web3',
  version: '2.0.0',
  author: 'Web3 Innovation',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
} as const;

// Web3 Configuration
export const WEB3_CONFIG = {
  defaultChainId: 1, // Ethereum Mainnet
  supportedChainIds: [1, 5, 11155111], // Mainnet, Goerli, Sepolia
  infuraProjectId: process.env.NEXT_PUBLIC_INFURA_PROJECT_ID,
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
} as const;

// GraphQL Subgraph Configuration
export const SUBGRAPH_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/your-subgraph',
  wsEndpoint: process.env.NEXT_PUBLIC_SUBGRAPH_WS_URL,
} as const;

// Currency Configuration
export const SUPPORTED_CURRENCIES: Currency[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    decimals: 18,
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    decimals: 8,
  },
  {
    symbol: 'USD',
    name: 'US Dollar',
    coingeckoId: 'usd',
    decimals: 2,
  },
  {
    symbol: 'EUR',
    name: 'Euro',
    coingeckoId: 'eur',
    decimals: 2,
  },
] as const;

// UI Configuration
export const UI_CONFIG = {
  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },
  image: {
    defaultBlurDataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx4f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bz6rasJsTat2yg4dCLwGRupfphjnFBYc8BUx/9k=',
    maxWidth: 800,
    maxHeight: 600,
    quality: 90,
  },
  animation: {
    duration: 300,
    easing: 'ease-in-out',
  },
} as const;

// API Configuration
export const API_CONFIG = {
  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    rateLimit: 50, // requests per minute for free tier
  },
  ipfs: {
    gateway: 'https://ipfs.io/ipfs/',
    timeout: 10000,
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INSUFFICIENT_FUNDS: 'Insufficient funds for this transaction',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_NFT_ADDRESS: 'Invalid NFT contract address',
  METADATA_LOAD_FAILED: 'Failed to load NFT metadata',
  IMAGE_LOAD_FAILED: 'Failed to load image',
} as const;
