/**
 * BLOCKCHAIN SERVICES - Smart Contract & NFT Interaktion
 * 
 * Blockchain-spezifische Service-Funktionen für:
 * • Contract Calls: Smart Contract Interaktion mit Retry-Logic
 * • NFT Data: Metadata, Ownership, Approval Fetching
 * • RPC Config: Provider-Management & Fallback-Clients
 * • Smart Cache: Contract-Daten Caching mit TTL
 * • Contract Helpers: ABI, Address, Function-Call Utilities
 * • Transaction Service: Centralized transaction handling (REFACTORED)
 * 
 * MOVED FROM: src/utils/blockchain
 * ✅ REFACTORED: Added TransactionService (Dec 2025)
 */

export * from './contracts';
export * from './nft-helpers';
export * from './contract-calls';
export * from './nft-fetcher';
export * from './rpc-config';
export * from './smart-cache';

// Transaction Service (NEW)
export { useTransactionService } from './TransactionService';
export type {
    TransactionResult,
    TransactionStep,
    PurchaseNFTParams,
    UpdateListingParams,
    CancelListingParams,
    CreateListingParams
} from './TransactionService';
