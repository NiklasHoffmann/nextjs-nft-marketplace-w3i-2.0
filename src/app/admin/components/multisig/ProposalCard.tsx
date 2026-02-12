/**
 * ProposalCard Component
 * Displays a single MultiSig proposal with actions
 */
"use client";

import { MultisigProposal, ProposalType } from '@/types';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { AddressWithEns } from '@/app/admin/components/shared/AddressWithEns';

interface ProposalCardProps {
    proposal: MultisigProposal;
    hasUserConfirmed: boolean;
    hasUserRejected: boolean;
    onConfirm: (proposalId: string) => Promise<void>;
    onReject: (proposalId: string) => Promise<void>;
    onExecute: (proposal: MultisigProposal) => Promise<void>;
    isLoading?: boolean;
}

const PROPOSAL_TYPE_LABELS: Record<ProposalType, string> = {
    'TRANSFER_OWNERSHIP': 'Transfer Ownership',
    'ACCEPT_OWNERSHIP': 'Accept Ownership',
    'SET_INNOVATION_FEE': 'Set Innovation Fee',
    'ADD_WHITELISTED_COLLECTION': 'Whitelist Collection',
    'REMOVE_WHITELISTED_COLLECTION': 'Remove Collection',
    'BATCH_ADD_COLLECTIONS': 'Batch Add Collections',
    'BATCH_REMOVE_COLLECTIONS': 'Batch Remove Collections',
    'PAUSE_CONTRACT': 'Pause Contract',
    'UNPAUSE_CONTRACT': 'Unpause Contract',
    'DIAMOND_CUT': 'Diamond Upgrade',
    'UPGRADE_FACET': 'Upgrade Facet',
    'ADD_FACET': 'Add Facet',
    'REMOVE_FACET': 'Remove Facet',
    'REPLACE_FACET': 'Replace Facet',
    'CLEAN_LISTING': 'Clean Listing',
    'CUSTOM': 'Custom Function'
};

const PROPOSAL_TYPE_COLORS: Record<ProposalType, string> = {
    'TRANSFER_OWNERSHIP': 'bg-red-100 text-red-700',
    'ACCEPT_OWNERSHIP': 'bg-green-100 text-green-700',
    'SET_INNOVATION_FEE': 'bg-blue-100 text-blue-700',
    'ADD_WHITELISTED_COLLECTION': 'bg-emerald-100 text-emerald-700',
    'REMOVE_WHITELISTED_COLLECTION': 'bg-orange-100 text-orange-700',
    'BATCH_ADD_COLLECTIONS': 'bg-teal-100 text-teal-700',
    'BATCH_REMOVE_COLLECTIONS': 'bg-amber-100 text-amber-700',
    'PAUSE_CONTRACT': 'bg-yellow-100 text-yellow-700',
    'UNPAUSE_CONTRACT': 'bg-lime-100 text-lime-700',
    'DIAMOND_CUT': 'bg-purple-100 text-purple-700',
    'UPGRADE_FACET': 'bg-indigo-100 text-indigo-700',
    'ADD_FACET': 'bg-violet-100 text-violet-700',
    'REMOVE_FACET': 'bg-fuchsia-100 text-fuchsia-700',
    'REPLACE_FACET': 'bg-pink-100 text-pink-700',
    'CLEAN_LISTING': 'bg-rose-100 text-rose-700',
    'CUSTOM': 'bg-gray-100 text-gray-700'
};

export function ProposalCard({
    proposal,
    hasUserConfirmed,
    hasUserRejected,
    onConfirm,
    onReject,
    onExecute,
    isLoading = false
}: ProposalCardProps) {
    const { address } = useAccount();
    const [actionLoading, setActionLoading] = useState(false);

    const isInitiator = address?.toLowerCase() === proposal.initiatedBy.toLowerCase();
    const confirmationProgress = (proposal.confirmations.length / proposal.requiredConfirmations) * 100;
    const timeLeft = proposal.expiresAt - Date.now();
    const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));

    const handleConfirm = async () => {
        setActionLoading(true);
        try {
            await onConfirm(proposal.proposalId);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        setActionLoading(true);
        try {
            await onReject(proposal.proposalId);
        } finally {
            setActionLoading(false);
        }
    };

    const handleExecute = async () => {
        setActionLoading(true);
        try {
            await onExecute(proposal);
        } finally {
            setActionLoading(false);
        }
    };

    const renderStatus = () => {
        switch (proposal.status) {
            case 'PENDING':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">Pending</span>;
            case 'CONFIRMED':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">✓ Confirmed</span>;
            case 'EXECUTED':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">✓ Executed</span>;
            case 'REJECTED':
                return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">✗ Rejected</span>;
            case 'EXPIRED':
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">Expired</span>;
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${PROPOSAL_TYPE_COLORS[proposal.type]}`}>
                            {PROPOSAL_TYPE_LABELS[proposal.type]}
                        </span>
                        {renderStatus()}
                        {isInitiator && (
                            <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded">
                                You initiated
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{proposal.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{proposal.description}</p>
                </div>
            </div>

            {/* Progress Bar */}
            {proposal.status === 'PENDING' && (
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Confirmations: {proposal.confirmations.length}/{proposal.requiredConfirmations}</span>
                        <span className={daysLeft <= 1 ? 'text-red-600 font-medium' : ''}>
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${confirmationProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Function Details */}
            <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">Function Call:</div>
                <div className="font-mono text-sm text-gray-900 break-all">
                    {proposal.functionName}({proposal.functionArgs.map((arg, i) =>
                        typeof arg === 'string' ? `"${arg}"` : String(arg)
                    ).join(', ')})
                </div>
            </div>

            {/* Confirmations List */}
            {proposal.confirmations.length > 0 && (
                <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">Confirmed by:</div>
                    <div className="flex flex-wrap gap-2">
                        {proposal.confirmations.map((conf, idx) => (
                            <div key={idx} className="px-2 py-1 bg-green-50 border border-green-200 rounded text-xs font-mono">
                                <AddressWithEns address={conf.address} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                {proposal.status === 'PENDING' && !hasUserConfirmed && !hasUserRejected && (
                    <>
                        <button
                            onClick={handleConfirm}
                            disabled={actionLoading || isLoading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {actionLoading ? 'Confirming...' : '✓ Confirm'}
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={actionLoading || isLoading}
                            className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {actionLoading ? 'Rejecting...' : '✗ Reject'}
                        </button>
                    </>
                )}

                {proposal.status === 'PENDING' && hasUserConfirmed && (
                    <div className="flex-1 px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-lg text-center">
                        ✓ You confirmed this proposal
                    </div>
                )}

                {proposal.status === 'CONFIRMED' && (
                    <button
                        onClick={handleExecute}
                        disabled={actionLoading || isLoading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {actionLoading ? 'Executing...' : '▶ Execute On-Chain'}
                    </button>
                )}

                {proposal.status === 'EXECUTED' && proposal.txHash && (
                    <a
                        href={`https://sepolia.etherscan.io/tx/${proposal.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors text-center"
                    >
                        View Transaction ↗
                    </a>
                )}
            </div>

            {/* Metadata */}
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex justify-between">
                    <span>Created: {new Date(proposal.createdAt).toLocaleDateString()}</span>
                    <span className="font-mono">{proposal.proposalId.slice(0, 8)}...</span>
                </div>
            </div>
        </div>
    );
}
