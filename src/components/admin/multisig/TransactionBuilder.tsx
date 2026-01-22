/**
 * TransactionBuilder Component
 * 
 * Form for building and submitting Diamond contract operations via MultiSig.
 */

'use client';

import { useState } from 'react';
import { DiamondOperation, DIAMOND_OPERATION_TEMPLATES } from '@/types/multisig-wallet';
import { useMultisigWallet } from '@/hooks/multisig/useMultisigWallet';
import { createDiamondTransactionRequest, validateOperationArgs } from '@/services/multisig/MultisigService';
import { LoadingState } from '@/components/core/Loading/LoadingState';
import { useRouter } from 'next/navigation';

interface TransactionBuilderProps {
    diamondAddress: string;
    onSuccess?: () => void;
}

export function TransactionBuilder({ diamondAddress, onSuccess }: TransactionBuilderProps) {
    const router = useRouter();
    const { submitTransaction, isSubmitting } = useMultisigWallet();
    const [selectedOperation, setSelectedOperation] = useState<DiamondOperation>(DiamondOperation.PAUSE);
    const [args, setArgs] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const template = DIAMOND_OPERATION_TEMPLATES[selectedOperation];

    const handleOperationChange = (operation: DiamondOperation) => {
        setSelectedOperation(operation);
        setArgs(new Array(DIAMOND_OPERATION_TEMPLATES[operation].args.length).fill(''));
        setError(null);
        setSuccess(false);
    };

    const handleArgChange = (index: number, value: string) => {
        const newArgs = [...args];
        newArgs[index] = value;
        setArgs(newArgs);
    };

    const parseArg = (value: string, type: string): any => {
        if (type === 'address') return value;
        if (type === 'uint256') return BigInt(value || '0');
        if (type === 'address[]') return value.split(',').map(addr => addr.trim());
        if (type === 'uint256[]') return value.split(',').map(val => BigInt(val.trim() || '0'));
        return value;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        try {
            // Parse arguments
            const parsedArgs = args.map((arg, i) => parseArg(arg, template.args[i]?.type || 'string'));

            // Validate
            const validation = validateOperationArgs(selectedOperation, parsedArgs);
            if (!validation.valid) {
                setError(validation.error || 'Invalid arguments');
                return;
            }

            // Create transaction request
            const request = createDiamondTransactionRequest(
                diamondAddress,
                selectedOperation,
                parsedArgs,
                template.description
            );

            // Submit
            const result = await submitTransaction(request);
            if (!result.success) {
                setError(result.error || 'Failed to submit transaction');
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                router.push('/admin/multisig-wallet');
            }, 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit transaction');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Operation Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Operation</label>
                <select
                    value={selectedOperation}
                    onChange={(e) => handleOperationChange(e.target.value as DiamondOperation)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                    {Object.values(DiamondOperation).map((op) => (
                        <option key={op} value={op}>
                            {DIAMOND_OPERATION_TEMPLATES[op].label}
                        </option>
                    ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">{template.description}</p>
            </div>

            {/* Arguments */}
            {template.args.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Parameters</h3>
                    {template.args.map((arg, index) => (
                        <div key={index}>
                            <label className="block text-sm font-medium text-gray-700">
                                {arg.name}
                                <span className="ml-2 text-xs text-gray-500">({arg.type})</span>
                            </label>
                            <input
                                type="text"
                                value={args[index] || ''}
                                onChange={(e) => handleArgChange(index, e.target.value)}
                                placeholder={arg.placeholder}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                required
                            />
                            {arg.description && (
                                <p className="mt-1 text-xs text-gray-500">{arg.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Info Box */}
            <div className="rounded-md bg-blue-50 p-4">
                <h4 className="text-sm font-medium text-blue-800">MultiSig Process</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-700">
                    <li>You will submit this transaction proposal</li>
                    <li>2 of 3 owners must confirm the transaction</li>
                    <li>Transaction executes automatically on the last confirmation</li>
                    <li>You'll pay gas fees for submission</li>
                </ul>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {success && (
                <div className="rounded-md bg-green-50 p-4">
                    <p className="text-sm text-green-800">
                        ✓ Transaction submitted successfully! Redirecting to pending transactions...
                    </p>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting || success}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            >
                {isSubmitting ? (
                    <LoadingState size="sm" message="Submitting..." />
                ) : (
                    <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Submit Transaction
                    </>
                )}
            </button>
        </form>
    );
}
