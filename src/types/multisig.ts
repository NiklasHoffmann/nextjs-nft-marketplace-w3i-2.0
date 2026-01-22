/**
 * MultiSig Proposal System Types
 * Off-chain coordination for admin operations requiring multiple confirmations
 */

export type ProposalType =
    | 'TRANSFER_OWNERSHIP'      // transferOwnership(address)
    | 'ACCEPT_OWNERSHIP'        // acceptOwnership()
    | 'SET_INNOVATION_FEE'      // setInnovationFee(uint32)
    | 'ADD_WHITELISTED_COLLECTION'          // addWhitelistedCollection(address)
    | 'REMOVE_WHITELISTED_COLLECTION'       // removeWhitelistedCollection(address)
    | 'BATCH_ADD_COLLECTIONS'   // batchAddWhitelistedCollections(address[])
    | 'BATCH_REMOVE_COLLECTIONS' // batchRemoveWhitelistedCollections(address[])
    | 'PAUSE_CONTRACT'          // pause()
    | 'UNPAUSE_CONTRACT'        // unpause()
    | 'DIAMOND_CUT'             // diamondCut(...)
    | 'UPGRADE_FACET'           // diamondCut - upgrade facet
    | 'ADD_FACET'               // diamondCut - add facet
    | 'REMOVE_FACET'            // diamondCut - remove facet
    | 'REPLACE_FACET'           // diamondCut - replace facet
    | 'CLEAN_LISTING'           // cleanListing(string)
    | 'CUSTOM';                 // Custom function call

export type ProposalStatus =
    | 'PENDING'       // Waiting for confirmations
    | 'CONFIRMED'     // Enough confirmations, ready to execute
    | 'EXECUTED'      // Successfully executed on-chain
    | 'REJECTED'      // Rejected by an admin
    | 'EXPIRED';      // Expired without execution

export interface ProposalConfirmation {
    address: string;
    timestamp: number;
    signature?: string; // Optional: Sign the proposal data
}

export interface MultisigProposal {
    _id?: string;
    proposalId: string;           // UUID
    type: ProposalType;
    title: string;                // Human-readable title
    description: string;          // Detailed description

    // Initiator
    initiatedBy: string;          // Admin address who created
    initiatedAt: number;          // Timestamp

    // Target data (encoded function call)
    targetContract: string;       // Usually marketplace address
    functionName: string;         // e.g., "transferOwnership"
    functionArgs: any[];          // Arguments for the function
    encodedData?: string;         // Optional: Pre-encoded calldata

    // Confirmation requirements
    requiredConfirmations: number; // e.g., 2 out of 3 admins
    confirmations: ProposalConfirmation[];
    rejections: ProposalConfirmation[];

    // Status
    status: ProposalStatus;

    // Execution
    executedBy?: string;          // Address who executed
    executedAt?: number;          // Execution timestamp
    txHash?: string;              // Transaction hash after execution

    // Expiration
    expiresAt: number;            // Auto-expire after X days

    // Metadata
    createdAt: number;
    updatedAt: number;
}

export interface CreateProposalRequest {
    type: ProposalType;
    title: string;
    description: string;
    targetContract: string;
    functionName: string;
    functionArgs: any[];
    requiredConfirmations?: number; // Default: 2
    expiresInDays?: number;        // Default: 7
}

export interface ProposalListResponse {
    proposals: MultisigProposal[];
    total: number;
    pending: number;
    confirmed: number;
    executed: number;
}

export interface ProposalActionResponse {
    success: boolean;
    proposal: MultisigProposal;
    message: string;
}
