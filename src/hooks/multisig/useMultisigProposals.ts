/**
 * MultiSig Proposals Hook
 * Manages MultiSig proposals for admin operations requiring multiple confirmations
 */
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useNotifications } from '@/contexts/notifications';
import {
    MultisigProposal,
    CreateProposalRequest,
    ProposalListResponse,
    ProposalType,
    ProposalStatus
} from '@/types/multisig';
import { MARKETPLACE_ABI } from '@/config/abis/marketplace';
import { MULTISIG_WALLET_ABI } from '@/config/abis/multisig-wallet';
import { encodeFunctionData } from 'viem';

export function useMultisigProposals(marketplaceAddress?: string) {
    const { address } = useAccount();
    const notifications = useNotifications();
    const { writeContract, data: txHash } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    const [proposals, setProposals] = useState<MultisigProposal[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, executed: 0 });
    const [mounted, setMounted] = useState(false);

    // Client-only mounting
    useEffect(() => {
        setMounted(true);
    }, []);

    /**
     * Fetch all proposals
     */
    const fetchProposals = useCallback(async (filter?: { status?: ProposalStatus; type?: ProposalType }) => {
        if (!mounted) return;
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (filter?.status) params.append('status', filter.status);
            if (filter?.type) params.append('type', filter.type);

            const response = await fetch(`/api/admin/multisig/proposals?${params}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch proposals');
            }

            const data: ProposalListResponse = await response.json();
            setProposals(data.proposals);
            setStats({
                total: data.total,
                pending: data.pending,
                confirmed: data.confirmed,
                executed: data.executed
            });
        } catch (err: any) {
            console.error('Failed to fetch proposals:', err);
            setError(err.message);
            notifications.error('Failed to fetch proposals', err.message);
        } finally {
            setIsLoading(false);
        }
    }, [notifications, mounted]);

    /**
     * Create a new proposal
     */
    const createProposal = async (proposal: CreateProposalRequest): Promise<string | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/multisig/proposals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(proposal)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create proposal');
            }

            const data = await response.json();
            notifications.success('Proposal Created', proposal.title);

            // Refresh list
            await fetchProposals();

            return data.proposalId;
        } catch (err: any) {
            console.error('Failed to create proposal:', err);
            setError(err.message);
            notifications.error('Failed to create proposal', err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Confirm a proposal
     */
    const confirmProposal = async (proposalId: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/multisig/proposals/${proposalId}/confirm`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to confirm proposal');
            }

            const data = await response.json();
            notifications.success('Proposal Confirmed', data.message);

            // Refresh list
            await fetchProposals();

            return true;
        } catch (err: any) {
            console.error('Failed to confirm proposal:', err);
            setError(err.message);
            notifications.error('Failed to confirm', err.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Reject a proposal
     */
    const rejectProposal = async (proposalId: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/admin/multisig/proposals/${proposalId}/reject`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to reject proposal');
            }

            notifications.success('Proposal Rejected', 'Proposal has been rejected');

            // Refresh list
            await fetchProposals();

            return true;
        } catch (err: any) {
            console.error('Failed to reject proposal:', err);
            setError(err.message);
            notifications.error('Failed to reject', err.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Execute a confirmed proposal on-chain
     */
    const executeProposal = async (proposal: MultisigProposal): Promise<boolean> => {
        if (!marketplaceAddress) {
            notifications.error('Error', 'Marketplace address not provided');
            return false;
        }

        if (proposal.status !== 'CONFIRMED') {
            notifications.error('Error', 'Proposal must be confirmed before execution');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Encode function call based on proposal type
            const functionName = proposal.functionName;
            const args = proposal.functionArgs;

            // Determine which ABI to use based on target contract
            // If targeting the marketplace, use marketplace ABI
            // Otherwise (e.g., multisig operations), use multisig ABI
            const isMarketplaceOperation = proposal.targetContract.toLowerCase() === marketplaceAddress?.toLowerCase();
            const contractABI = isMarketplaceOperation ? MARKETPLACE_ABI : MULTISIG_WALLET_ABI;

            notifications.info('Executing Proposal', 'Please confirm the transaction in your wallet...');

            // Execute the contract call
            // Note: We use 'any' here because the proposal can target different contracts
            // with different function signatures. The actual validation happens on-chain.
            writeContract({
                address: proposal.targetContract as `0x${string}`,
                abi: contractABI as any,
                functionName: functionName as any,
                args: args as any,
            });

            return true;
        } catch (err: any) {
            console.error('Failed to execute proposal:', err);
            setError(err.message);
            notifications.error('Execution Failed', err.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle successful transaction
     */
    useEffect(() => {
        if (isSuccess && txHash) {
            // Find the proposal that was just executed
            // This is a simplification - in production you'd track which proposal is being executed
            notifications.success('Transaction Confirmed', 'Proposal executed on-chain successfully!', {
                txHash: txHash.toString()
            });

            // Refresh proposals
            fetchProposals();
        }
    }, [isSuccess, txHash, notifications, fetchProposals]);

    /**
     * Mark proposal as executed in DB
     */
    const markAsExecuted = async (proposalId: string, txHash: string): Promise<boolean> => {
        try {
            const response = await fetch(`/api/admin/multisig/proposals/${proposalId}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ txHash })
            });

            if (!response.ok) {
                throw new Error('Failed to mark as executed');
            }

            await fetchProposals();
            return true;
        } catch (err: any) {
            console.error('Failed to mark as executed:', err);
            return false;
        }
    };

    /**
     * Helper: Check if current user has confirmed a proposal
     */
    const hasUserConfirmed = useCallback((proposal: MultisigProposal): boolean => {
        if (!address) return false;
        return proposal.confirmations.some(
            c => c.address.toLowerCase() === address.toLowerCase()
        );
    }, [address]);

    /**
     * Helper: Check if current user has rejected a proposal
     */
    const hasUserRejected = useCallback((proposal: MultisigProposal): boolean => {
        if (!address) return false;
        return proposal.rejections.some(
            r => r.address.toLowerCase() === address.toLowerCase()
        );
    }, [address]);

    return {
        // Data
        proposals,
        stats,
        isLoading: isLoading || isConfirming,
        error,

        // Actions
        fetchProposals,
        createProposal,
        confirmProposal,
        rejectProposal,
        executeProposal,
        markAsExecuted,

        // Helpers
        hasUserConfirmed,
        hasUserRejected,

        // Transaction state
        txHash,
        isConfirming,
        isSuccess
    };
}
