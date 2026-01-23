/**
 * BLOCKCHAIN SERVICES - Smart Contract & NFT Interaktion
 * 
 * Blockchain-spezifische Service-Funktionen für:
 * • Contract Calls: Smart Contract Interaktion mit Retry-Logic
 * • NFT Data: Metadata, Ownership, Approval Fetching
 * • RPC Config: Provider-Management & Fallback-Clients
 * • Contract Helpers: ABI, Address, Function-Call Utilities
 * • Transaction Service: Centralized transaction handling (REFACTORED)
 * 
 * MOVED FROM: src/utils/blockchain
 * ✅ REFACTORED: Added TransactionService (Dec 2025)
 * ✅ Cache moved to: @/services/cache
 */

export * from './contracts';
export * from './nft-helpers';
export * from './contract-calls';
export * from './nft-fetcher';
export * from './rpc-config';

// Transaction Service (NEW)
export { useTransactionService } from './transaction-service';
export type {
    TransactionResult,
    TransactionStep,
    PurchaseNFTParams,
    UpdateListingParams,
    CancelListingParams,
    CreateListingParams
} from './transaction-service';
