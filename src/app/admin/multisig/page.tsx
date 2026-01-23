/**
 * Admin MultiSig Management Page
 * Central hub for creating, confirming, and executing MultiSig proposals
 */
"use client";

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import Link from 'next/link';
import { useMultisigProposals } from '@/hooks/multisig/useMultisigProposals';
import { ProposalCard } from '@/components/admin/multisig/ProposalCard';
import { CreateProposalModal } from '@/components/admin/multisig/CreateProposalModal';
import { LoadingState } from '@/components/core/Loading';
import { ProposalStatus, ProposalType } from '@/types';
import { NETWORK_CONFIG } from '@/config/networks';

export default function AdminMultisigPage() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const [mounted, setMounted] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<ProposalStatus | 'ALL'>('ALL');
    const [filterType, setFilterType] = useState<ProposalType | 'ALL'>('ALL');

    // Get marketplace address
    const getMarketplaceAddress = (): string => {
        const chainIdStr = chainId?.toString() || '11155111';
        const mapping = NETWORK_CONFIG as Record<string, { NftMarketplace: string[] }>;
        return mapping[chainIdStr]?.NftMarketplace?.[0] || '';
    };

    const marketplaceAddress = getMarketplaceAddress();

    const hookResult = useMultisigProposals(marketplaceAddress);

    const {
        proposals = [],
        stats = { total: 0, pending: 0, confirmed: 0, executed: 0 },
        isLoading = false,
        error = null,
        fetchProposals = async () => { },
        createProposal = async () => null,
        confirmProposal = async () => { },
        rejectProposal = async () => { },
        executeProposal = async () => false,
        markAsExecuted = async () => { },
        hasUserConfirmed = () => false,
        hasUserRejected = () => false,
        txHash,
        isConfirming = false,
        isSuccess = false
    } = hookResult || {};

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch proposals on mount
    useEffect(() => {
        if (mounted && isConnected) {
            fetchProposals();
        }
    }, [mounted, isConnected, fetchProposals]);

    // Handle successful execution
    useEffect(() => {
        if (isSuccess && txHash) {
            // Find which proposal was executed and mark it
            const executedProposal = proposals.find(p => p.status === 'CONFIRMED');
            if (executedProposal) {
                markAsExecuted(executedProposal.proposalId, txHash.toString());
            }
        }
    }, [isSuccess, txHash, proposals, markAsExecuted]);

    if (!mounted) {
        return null;
    }

    const handleCreateProposal = async (data: any) => {
        await createProposal({
            ...data,
            requiredConfirmations: 2, // Configurable
            expiresInDays: 7
        });
    };

    const handleConfirm = async (proposalId: string) => {
        await confirmProposal(proposalId);
    };

    const handleReject = async (proposalId: string) => {
        await rejectProposal(proposalId);
    };

    const handleExecute = async (proposal: any) => {
        const success = await executeProposal(proposal);
        // Transaction will be tracked via useEffect above
    };

    // Filter proposals (safe after mounted check)
    const filteredProposals = proposals.filter(p => {
        if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
        if (filterType !== 'ALL' && p.type !== filterType) return false;
        return true;
    });

    // Get proposals requiring user action
    const actionRequired = proposals.filter(p =>
        p.status === 'PENDING' &&
        !hasUserConfirmed(p) &&
        !hasUserRejected(p)
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Link
                            href="/admin"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Zurück zum Admin Panel
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">MultiSig Management</h1>
                                <p className="text-gray-600 mb-3">
                                    Multi-Signatur Verwaltung für kritische Admin-Operationen
                                </p>
                                <div className="inline-flex items-center gap-2 text-sm">
                                    <span className="text-gray-500">Need immediate execution as owner?</span>
                                    <Link
                                        href="/admin/marketplace"
                                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                                    >
                                        Direct Marketplace Admin →
                                    </Link>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                New Proposal
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="text-sm text-gray-600">Total Proposals</div>
                            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                        </div>
                        <div className="bg-white border border-yellow-200 rounded-lg p-4">
                            <div className="text-sm text-yellow-700">Pending</div>
                            <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
                        </div>
                        <div className="bg-white border border-green-200 rounded-lg p-4">
                            <div className="text-sm text-green-700">Confirmed</div>
                            <div className="text-2xl font-bold text-green-900">{stats.confirmed}</div>
                        </div>
                        <div className="bg-white border border-blue-200 rounded-lg p-4">
                            <div className="text-sm text-blue-700">Executed</div>
                            <div className="text-2xl font-bold text-blue-900">{stats.executed}</div>
                        </div>
                    </div>

                    {/* Action Required Alert */}
                    {actionRequired.length > 0 && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <div className="p-1 bg-amber-200 rounded">
                                    <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-medium text-amber-900">
                                        {actionRequired.length} {actionRequired.length === 1 ? 'proposal' : 'proposals'} require your action
                                    </div>
                                    <div className="text-sm text-amber-700">
                                        Review and confirm or reject pending proposals below
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="mb-6 flex gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="EXECUTED">Executed</option>
                                <option value="REJECTED">Rejected</option>
                                <option value="EXPIRED">Expired</option>
                            </select>
                        </div>

                        <button
                            onClick={() => fetchProposals()}
                            disabled={isLoading}
                            className="mt-auto px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? 'Loading...' : 'Refresh'}
                        </button>
                    </div>

                    {/* Proposals List */}
                    {isLoading && proposals.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <LoadingState size="lg" />
                        </div>
                    ) : error ? (
                        <div className="p-8 bg-red-50 border border-red-200 rounded-lg text-center">
                            <div className="text-red-700 font-medium mb-2">Failed to load proposals</div>
                            <div className="text-red-600 text-sm">{error}</div>
                        </div>
                    ) : filteredProposals.length === 0 ? (
                        <div className="p-12 bg-white border border-gray-200 rounded-lg text-center">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="text-gray-600 font-medium mb-2">No proposals found</div>
                            <div className="text-gray-500 text-sm">
                                {filterStatus !== 'ALL' || filterType !== 'ALL'
                                    ? 'Try adjusting your filters'
                                    : 'Create your first proposal to get started'}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredProposals.map((proposal) => (
                                <ProposalCard
                                    key={proposal.proposalId}
                                    proposal={proposal}
                                    hasUserConfirmed={hasUserConfirmed(proposal)}
                                    hasUserRejected={hasUserRejected(proposal)}
                                    onConfirm={handleConfirm}
                                    onReject={handleReject}
                                    onExecute={handleExecute}
                                    isLoading={isLoading || isConfirming}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Proposal Modal */}
            <CreateProposalModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateProposal}
                marketplaceAddress={marketplaceAddress}
            />
        </div>
    );
}
