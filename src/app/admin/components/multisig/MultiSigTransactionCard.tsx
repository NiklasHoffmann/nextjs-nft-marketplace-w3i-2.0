/**
 * MultiSigTransactionCard Component
 * 
 * Displays a pending MultiSig transaction with action buttons.
 */

'use client';

import { type PendingMultiSigTx, TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_COLORS } from '@/types';
import { getTransactionStatusLabel, getTransactionStatusColor, formatTransactionValue } from '@/services/multisig';
import { useMultisigWallet } from '@/hooks/multisig/useMultisigWallet';
import { useState } from 'react';
import { LoadingState } from '@/components/core/Loading/LoadingState';

interface MultiSigTransactionCardProps {
    transaction: PendingMultiSigTx;
    onConfirm?: () => void;
    onRevoke?: () => void;
}

export function MultiSigTransactionCard({
    transaction,
    onConfirm,
    onRevoke,
}: MultiSigTransactionCardProps) {
    const { confirmTransaction, revokeConfirmation, isConfirming, isRevoking } = useMultisigWallet();
    const [actionLoading, setActionLoading] = useState(false);

    const handleConfirm = async () => {
        setActionLoading(true);
        try {
            const result = await confirmTransaction(transaction.txIndex);
            if (result.success) {
                onConfirm?.();
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevoke = async () => {
        setActionLoading(true);
        try {
            const result = await revokeConfirmation(transaction.txIndex);
            if (result.success) {
                onRevoke?.();
            }
        } finally {
            setActionLoading(false);
        }
    };

    const statusColor = getTransactionStatusColor(transaction);
    const statusLabel = getTransactionStatusLabel(transaction);
    const typeColor = TRANSACTION_TYPE_COLORS[transaction.transactionType];

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className={`rounded-full bg-${typeColor}-100 px-3 py-1 text-xs font-medium text-${typeColor}-800`}>
                            {TRANSACTION_TYPE_LABELS[transaction.transactionType]}
                        </span>
                        <span className="text-sm text-gray-500">#{transaction.txIndex}</span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900">
                        {transaction.decodedCall?.description || TRANSACTION_TYPE_LABELS[transaction.transactionType]}
                    </h3>
                </div>
                <span className={`rounded-full bg-${statusColor}-100 px-3 py-1 text-xs font-medium text-${statusColor}-800`}>
                    {statusLabel}
                </span>
            </div>

            {/* Details */}
            <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-mono text-gray-900">{transaction.to.slice(0, 10)}...{transaction.to.slice(-8)}</span>
                </div>
                {transaction.value > BigInt(0) && (
                    <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span className="font-medium text-gray-900">
                            {formatTransactionValue(transaction.transactionType, transaction.value)}
                        </span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-gray-600">Initiated by:</span>
                    <span className="font-mono text-gray-900">{transaction.owner.slice(0, 10)}...{transaction.owner.slice(-8)}</span>
                </div>
            </div>

            {/* Decoded Call Info */}
            {transaction.decodedCall && (
                <div className="mt-4 rounded-md bg-gray-50 p-3">
                    <p className="text-xs font-medium text-gray-700">Function Call</p>
                    <p className="mt-1 font-mono text-sm text-gray-900">{transaction.decodedCall.functionName}()</p>
                    {transaction.decodedCall.args.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {transaction.decodedCall.args.map((arg, i) => (
                                <div key={i} className="text-xs">
                                    <span className="text-gray-600">{arg.name}:</span>{' '}
                                    <span className="font-mono text-gray-900">{arg.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Confirmations */}
            <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Confirmations</span>
                    <span className="font-medium text-gray-900">
                        {Number(transaction.numConfirmations)} / {transaction.requiredConfirmations}
                    </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                        className={`h-full bg-${statusColor}-500 transition-all`}
                        style={{
                            width: `${(Number(transaction.numConfirmations) / transaction.requiredConfirmations) * 100}%`,
                        }}
                    />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                    {transaction.confirmations.map((addr) => (
                        <span
                            key={addr}
                            className="rounded bg-green-100 px-2 py-1 text-xs font-mono text-green-800"
                            title={addr}
                        >
                            {addr.slice(0, 6)}...{addr.slice(-4)}
                        </span>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
                {transaction.canConfirm && (
                    <button
                        onClick={handleConfirm}
                        disabled={actionLoading || isConfirming}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                        {actionLoading || isConfirming ? (
                            <LoadingState size="sm" message="Confirming..." />
                        ) : (
                            <>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Confirm
                            </>
                        )}
                    </button>
                )}
                {transaction.canRevoke && (
                    <button
                        onClick={handleRevoke}
                        disabled={actionLoading || isRevoking}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                        {actionLoading || isRevoking ? (
                            <LoadingState size="sm" message="Revoking..." />
                        ) : (
                            <>
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Revoke
                            </>
                        )}
                    </button>
                )}
                {!transaction.canConfirm && !transaction.canRevoke && (
                    <div className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Waiting for confirmations
                    </div>
                )}
            </div>
        </div>
    );
}
