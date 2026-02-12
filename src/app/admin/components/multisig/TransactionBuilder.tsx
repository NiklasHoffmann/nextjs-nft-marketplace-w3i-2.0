/**
 * TransactionBuilder Component
 * 
 * Form for building and submitting Diamond contract operations via MultiSig.
 */

'use client';

import { useMemo, useState } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { DiamondOperation, DIAMOND_OPERATION_TEMPLATES, MULTISIG_ADDRESSES } from '@/types';
import { useMultisigWallet } from '@/hooks/multisig/useMultisigWallet';
import { createDiamondTransactionRequest, validateOperationArgs } from '@/services/multisig';
import { LoadingState } from '@/components/core/Loading/LoadingState';
import { useRouter } from 'next/navigation';
import { GETTER_FACET_ABI } from '@/config/abis/getter-facet';
import { IDEATION_MARKET_FACET_ABI } from '@/config/abis/ideation-market-facet';
import { COLLECTION_WHITELIST_FACET_ABI } from '@/config/abis/collection-whitelist-facet';
import { BUYER_WHITELIST_FACET_ABI } from '@/config/abis/buyer-whitelist-facet';
import { PAUSE_FACET_ABI } from '@/config/abis/pause-facet';
import { OWNERSHIP_FACET_ABI } from '@/config/abis/ownership-facet';
import { DIAMOND_CUT_ABI } from '@/config/abis/diamond-cut';
import { getAvailableTokens, getCurrencySymbolByAddress } from '@/config/tokens';
import { useChainId } from 'wagmi';
import { getMultisigAddress } from '@/config';

interface TransactionBuilderProps {
    diamondAddress: string;
    onSuccess?: () => void;
}

export function TransactionBuilder({ diamondAddress, onSuccess }: TransactionBuilderProps) {
    const router = useRouter();
    const { submitTransaction, isSubmitting } = useMultisigWallet();
    const chainId = useChainId();
    const publicClient = usePublicClient();
    const hasAddress = Boolean(diamondAddress);
    const [selectedOperation, setSelectedOperation] = useState<DiamondOperation>(DiamondOperation.PAUSE);
    const [args, setArgs] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [selectedWhitelistCollection, setSelectedWhitelistCollection] = useState<string>('');
    const [selectedAllowedCurrency, setSelectedAllowedCurrency] = useState<string>('');

    const multisigAddress = useMemo(() => {
        if (!chainId) return undefined;
        return getMultisigAddress(chainId) || (chainId === 1 ? MULTISIG_ADDRESSES.mainnet : MULTISIG_ADDRESSES.sepolia);
    }, [chainId]);

    const template = DIAMOND_OPERATION_TEMPLATES[selectedOperation];

    const { data: currentFee } = useReadContract({
        address: diamondAddress as `0x${string}`,
        abi: GETTER_FACET_ABI,
        functionName: 'getInnovationFee',
        query: { enabled: hasAddress },
    });

    const { data: whitelistedCollections } = useReadContract({
        address: diamondAddress as `0x${string}`,
        abi: GETTER_FACET_ABI,
        functionName: 'getWhitelistedCollections',
        query: { enabled: hasAddress },
    });

    const { data: allowedCurrencies } = useReadContract({
        address: diamondAddress as `0x${string}`,
        abi: GETTER_FACET_ABI,
        functionName: 'getAllowedCurrencies',
        query: { enabled: hasAddress },
    });

    const { data: contractOwner } = useReadContract({
        address: diamondAddress as `0x${string}`,
        abi: GETTER_FACET_ABI,
        functionName: 'getContractOwner',
        query: { enabled: hasAddress },
    });

    const availableTokens = useMemo(() => {
        if (!chainId) return [];
        return getAvailableTokens(chainId);
    }, [chainId]);

    const allowedCurrencyDisplay = useMemo(() => {
        if (!Array.isArray(allowedCurrencies)) return [];
        return allowedCurrencies.map((currency) => {
            const address = String(currency);
            const token = availableTokens.find((item) => item.address.toLowerCase() === address.toLowerCase());
            const symbol = token?.symbol || getCurrencySymbolByAddress(chainId || 1, address);
            const name = token?.name || (symbol === 'ETH' ? 'Ether' : 'Unknown Token');
            return {
                address,
                symbol,
                name,
            };
        });
    }, [allowedCurrencies, availableTokens, chainId]);

    const currentFeePercent = useMemo(() => {
        if (currentFee === undefined || currentFee === null) return null;
        const feeValue = Number(currentFee);
        if (Number.isNaN(feeValue)) return null;
        return (feeValue / 1000).toFixed(2);
    }, [currentFee]);

    const handleOperationChange = (operation: DiamondOperation) => {
        setSelectedOperation(operation);
        setArgs(new Array(DIAMOND_OPERATION_TEMPLATES[operation].args.length).fill(''));
        setError(null);
        setSuccess(false);
        setSelectedWhitelistCollection('');
        setSelectedAllowedCurrency('');
    };

    const handleArgChange = (index: number, value: string) => {
        const newArgs = [...args];
        newArgs[index] = value;
        setArgs(newArgs);
    };

    const fillArg = (index: number, value: string) => {
        const newArgs = [...args];
        newArgs[index] = value;
        setArgs(newArgs);
    };

    const appendArg = (index: number, value: string) => {
        const current = args[index] || '';
        const next = current
            ? `${current}, ${value}`
            : value;
        const newArgs = [...args];
        newArgs[index] = next;
        setArgs(newArgs);
    };

    const parseArg = (value: string, type: string): any => {
        if (type === 'address') return value;
        if (type === 'uint256' || type === 'uint128') return BigInt(value || '0');
        if (type === 'address[]') {
            return value
                .split(',')
                .map(addr => addr.trim())
                .filter(addr => addr.length > 0);
        }
        if (type === 'uint256[]') return value.split(',').map(val => BigInt(val.trim() || '0'));
        return value;
    };

    const preflightWhitelistCheck = async (operation: DiamondOperation, parsedArgs: any[]) => {
        if (!publicClient) return;

        if (operation === DiamondOperation.ADD_WHITELISTED_COLLECTION) {
            const collection = parsedArgs[0] as string;
            const isWhitelisted = await publicClient.readContract({
                address: diamondAddress as `0x${string}`,
                abi: GETTER_FACET_ABI,
                functionName: 'isCollectionWhitelisted',
                args: [collection as `0x${string}`]
            });

            if (isWhitelisted) {
                throw new Error('Collection is already whitelisted.');
            }
        }

        if (operation === DiamondOperation.REMOVE_WHITELISTED_COLLECTION) {
            const collection = parsedArgs[0] as string;
            const isWhitelisted = await publicClient.readContract({
                address: diamondAddress as `0x${string}`,
                abi: GETTER_FACET_ABI,
                functionName: 'isCollectionWhitelisted',
                args: [collection as `0x${string}`]
            });

            if (!isWhitelisted) {
                throw new Error('Collection is not whitelisted.');
            }
        }

        if (operation === DiamondOperation.BATCH_ADD_COLLECTIONS) {
            const collections = (parsedArgs[0] as string[]) || [];
            const results = await Promise.all(collections.map((collection) =>
                publicClient.readContract({
                    address: diamondAddress as `0x${string}`,
                    abi: GETTER_FACET_ABI,
                    functionName: 'isCollectionWhitelisted',
                    args: [collection as `0x${string}`]
                }).then((value) => ({ collection, value }))
            ));

            const alreadyWhitelisted = results.filter((result) => result.value).map((result) => result.collection);
            if (alreadyWhitelisted.length > 0) {
                throw new Error(`Already whitelisted: ${alreadyWhitelisted.join(', ')}`);
            }
        }

        if (operation === DiamondOperation.BATCH_REMOVE_COLLECTIONS) {
            const collections = (parsedArgs[0] as string[]) || [];
            const results = await Promise.all(collections.map((collection) =>
                publicClient.readContract({
                    address: diamondAddress as `0x${string}`,
                    abi: GETTER_FACET_ABI,
                    functionName: 'isCollectionWhitelisted',
                    args: [collection as `0x${string}`]
                }).then((value) => ({ collection, value }))
            ));

            const notWhitelisted = results.filter((result) => !result.value).map((result) => result.collection);
            if (notWhitelisted.length > 0) {
                throw new Error(`Not whitelisted: ${notWhitelisted.join(', ')}`);
            }
        }
    };

    const getOperationAbi = (operation: DiamondOperation) => {
        switch (operation) {
            case DiamondOperation.SET_INNOVATION_FEE:
            case DiamondOperation.CLEAN_LISTING:
                return IDEATION_MARKET_FACET_ABI;
            case DiamondOperation.ADD_WHITELISTED_COLLECTION:
            case DiamondOperation.REMOVE_WHITELISTED_COLLECTION:
            case DiamondOperation.BATCH_ADD_COLLECTIONS:
            case DiamondOperation.BATCH_REMOVE_COLLECTIONS:
                return COLLECTION_WHITELIST_FACET_ABI;
            case DiamondOperation.ADD_BUYER_WHITELIST_ADDRESSES:
            case DiamondOperation.REMOVE_BUYER_WHITELIST_ADDRESSES:
                return BUYER_WHITELIST_FACET_ABI;
            case DiamondOperation.PAUSE:
            case DiamondOperation.UNPAUSE:
                return PAUSE_FACET_ABI;
            case DiamondOperation.TRANSFER_OWNERSHIP:
            case DiamondOperation.ACCEPT_OWNERSHIP:
                return OWNERSHIP_FACET_ABI;
            case DiamondOperation.DIAMOND_CUT:
                return DIAMOND_CUT_ABI;
            default:
                return undefined;
        }
    };

    const preflightDiamondOperation = async (operation: DiamondOperation, parsedArgs: any[]) => {
        if (!publicClient || !multisigAddress) return;

        const abi = getOperationAbi(operation);
        if (!abi) return;

        const functionName = DIAMOND_OPERATION_TEMPLATES[operation].functionSignature.split('(')[0];

        try {
            await publicClient.simulateContract({
                address: diamondAddress as `0x${string}`,
                abi,
                functionName: functionName as any,
                args: parsedArgs as any,
                account: multisigAddress as `0x${string}`
            });
        } catch (simulationError: any) {
            const reason = simulationError?.shortMessage
                || simulationError?.message
                || 'Diamond simulation failed';
            throw new Error(`Diamond call would revert for MultiSig: ${reason}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!hasAddress) {
            setError('Marketplace address is not configured for this network.');
            return;
        }

        try {
            // Parse arguments
            const parsedArgs = args.map((arg, i) => parseArg(arg, template.args[i]?.type || 'string'));

            // Validate
            const validation = validateOperationArgs(selectedOperation, parsedArgs);
            if (!validation.valid) {
                setError(validation.error || 'Invalid arguments');
                return;
            }

            if (multisigAddress && contractOwner) {
                const ownerLower = String(contractOwner).toLowerCase();
                const multisigLower = multisigAddress.toLowerCase();
                if (ownerLower !== multisigLower) {
                    throw new Error('Marketplace owner is not the MultiSig wallet. Transfer ownership to MultiSig first.');
                }
            }

            await preflightWhitelistCheck(selectedOperation, parsedArgs);
            await preflightDiamondOperation(selectedOperation, parsedArgs);

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
                router.push('/admin/marketplace-governance');
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    disabled={!hasAddress}
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
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                required
                            />
                            {arg.description && (
                                <p className="mt-1 text-xs text-gray-500">{arg.description}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {selectedOperation === DiamondOperation.SET_INNOVATION_FEE && currentFeePercent !== null && (
                <div className="rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-700">
                    Current fee: <span className="font-medium">{currentFeePercent}%</span>
                </div>
            )}

            {(selectedOperation === DiamondOperation.REMOVE_WHITELISTED_COLLECTION ||
                selectedOperation === DiamondOperation.BATCH_REMOVE_COLLECTIONS) && (
                    <div className="rounded-md border border-gray-200 bg-white p-4">
                        <div className="text-sm font-medium text-gray-700">Whitelisted Collections</div>
                        {Array.isArray(whitelistedCollections) && whitelistedCollections.length > 0 ? (
                            <div className="mt-3 space-y-3">
                                <select
                                    value={selectedWhitelistCollection}
                                    onChange={(e) => setSelectedWhitelistCollection(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                >
                                    <option value="">Select collection</option>
                                    {whitelistedCollections.map((collection) => (
                                        <option key={collection as string} value={collection as string}>
                                            {collection as string}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!selectedWhitelistCollection) return;
                                            if (selectedOperation === DiamondOperation.BATCH_REMOVE_COLLECTIONS) {
                                                appendArg(0, selectedWhitelistCollection);
                                            } else {
                                                fillArg(0, selectedWhitelistCollection);
                                            }
                                        }}
                                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Use Selected
                                    </button>
                                    {selectedOperation === DiamondOperation.BATCH_REMOVE_COLLECTIONS && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!Array.isArray(whitelistedCollections)) return;
                                                fillArg(0, whitelistedCollections.join(', '));
                                            }}
                                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Use All
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {whitelistedCollections.map((collection) => (
                                        <button
                                            key={collection as string}
                                            type="button"
                                            onClick={() => {
                                                if (selectedOperation === DiamondOperation.BATCH_REMOVE_COLLECTIONS) {
                                                    appendArg(0, collection as string);
                                                } else {
                                                    fillArg(0, collection as string);
                                                }
                                            }}
                                            className="rounded-full bg-gray-100 px-3 py-1 text-xs font-mono text-gray-700 hover:bg-gray-200"
                                        >
                                            {(collection as string).slice(0, 6)}...{(collection as string).slice(-4)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2 text-sm text-gray-500">No whitelisted collections found.</div>
                        )}
                    </div>
                )}

            {(selectedOperation === DiamondOperation.ADD_ALLOWED_CURRENCY ||
                selectedOperation === DiamondOperation.REMOVE_ALLOWED_CURRENCY) && (
                    <div className="rounded-md border border-gray-200 bg-white p-4">
                        <div className="text-sm font-medium text-gray-700">Allowed Currencies</div>
                        {Array.isArray(allowedCurrencies) && allowedCurrencies.length > 0 ? (
                            <div className="mt-3 space-y-3">
                                <select
                                    value={selectedAllowedCurrency}
                                    onChange={(e) => setSelectedAllowedCurrency(e.target.value)}
                                    className="block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                >
                                    <option value="">Select currency</option>
                                    {allowedCurrencyDisplay.map((currency) => (
                                        <option key={currency.address} value={currency.address}>
                                            {currency.symbol} - {currency.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!selectedAllowedCurrency) return;
                                            fillArg(0, selectedAllowedCurrency);
                                        }}
                                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Use Selected
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {allowedCurrencyDisplay.map((currency) => (
                                        <button
                                            key={currency.address}
                                            type="button"
                                            onClick={() => fillArg(0, currency.address)}
                                            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
                                        >
                                            <span className="font-semibold">{currency.symbol}</span>{' '}
                                            <span className="text-gray-500">·</span>{' '}
                                            {currency.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2 text-sm text-gray-500">No allowed currencies found.</div>
                        )}
                    </div>
                )}

            {/* Info Box */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                <h4 className="text-sm font-medium text-gray-900">MultiSig Process</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
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
                    <div className="mt-3">
                        <button
                            type="button"
                            onClick={() => router.push('/admin/marketplace-governance')}
                            className="rounded-md border border-green-200 bg-white px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-100"
                        >
                            View pending in Governance
                        </button>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting || success || !hasAddress}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
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
