'use client';

import { useMemo, useState } from 'react';
import { encodeAbiParameters, formatUnits, parseUnits } from 'viem';
import { useRouter } from 'next/navigation';
import { useMultisigWallet } from '@/hooks/multisig/useMultisigWallet';
import { TransactionType, type SubmitTransactionRequest } from '@/types';
import { validateTransactionRequest } from '@/services/multisig';
import { LoadingState } from '@/components/core/Loading/LoadingState';
import { useBalance, useChainId, useReadContracts } from 'wagmi';
import { getAvailableTokens, type TokenConfig } from '@/config/tokens';
import { WETH_ABI } from '@/config/abis/weth';

interface WalletOperationBuilderProps {
    onSuccess?: () => void;
}

type WalletOperationTemplate = {
    id: string;
    label: string;
    description: string;
    transactionType: TransactionType;
    args: Array<{
        name: string;
        type: string;
        placeholder?: string;
        description?: string;
    }>;
};

const walletOperationTemplates: WalletOperationTemplate[] = [
    {
        id: 'eth_transfer',
        label: 'ETH Transfer',
        description: 'Send ETH from the MultiSig wallet',
        transactionType: TransactionType.ETH,
        args: [
            {
                name: 'recipient',
                type: 'address',
                placeholder: '0x...',
                description: 'Recipient wallet address',
            },
            {
                name: 'amountEth',
                type: 'decimal',
                placeholder: '0.25',
                description: 'Amount in ETH',
            },
        ],
    },
    {
        id: 'erc20_transfer',
        label: 'ERC20 Transfer',
        description: 'Send ERC20 tokens from the MultiSig wallet',
        transactionType: TransactionType.ERC20,
        args: [
            {
                name: 'tokenAddress',
                type: 'address',
                placeholder: '0x...',
                description: 'ERC20 token contract address',
            },
            {
                name: 'recipient',
                type: 'address',
                placeholder: '0x...',
                description: 'Recipient wallet address',
            },
            {
                name: 'amount',
                type: 'decimal',
                placeholder: '50',
                description: 'Token amount in normal units',
            },
        ],
    },
    {
        id: 'erc20_transfer_from',
        label: 'ERC20 TransferFrom',
        description: 'Move ERC20 tokens from another address (requires allowance)',
        transactionType: TransactionType.ERC20_TRANSFER_FROM,
        args: [
            {
                name: 'tokenAddress',
                type: 'address',
                placeholder: '0x...',
                description: 'ERC20 token contract address',
            },
            {
                name: 'from',
                type: 'address',
                placeholder: '0x...',
                description: 'Source address with allowance',
            },
            {
                name: 'recipient',
                type: 'address',
                placeholder: '0x...',
                description: 'Recipient wallet address',
            },
            {
                name: 'amount',
                type: 'decimal',
                placeholder: '50',
                description: 'Token amount in normal units',
            },
        ],
    },
    {
        id: 'erc721_transfer',
        label: 'ERC721 Transfer',
        description: 'Transfer an ERC721 token from the MultiSig wallet',
        transactionType: TransactionType.ERC721,
        args: [
            {
                name: 'tokenAddress',
                type: 'address',
                placeholder: '0x...',
                description: 'ERC721 contract address',
            },
            {
                name: 'recipient',
                type: 'address',
                placeholder: '0x...',
                description: 'Recipient wallet address',
            },
            {
                name: 'tokenId',
                type: 'uint256',
                placeholder: '1',
                description: 'Token ID',
            },
        ],
    },
    {
        id: 'add_owner',
        label: 'Add Owner',
        description: 'Add a new MultiSig owner',
        transactionType: TransactionType.AddOwner,
        args: [
            {
                name: 'newOwner',
                type: 'address',
                placeholder: '0x...',
                description: 'Owner address to add',
            },
        ],
    },
    {
        id: 'remove_owner',
        label: 'Remove Owner',
        description: 'Remove an existing MultiSig owner',
        transactionType: TransactionType.RemoveOwner,
        args: [
            {
                name: 'owner',
                type: 'address',
                placeholder: '0x...',
                description: 'Owner address to remove',
            },
        ],
    },
    {
        id: 'batch_transfer',
        label: 'Batch Transfer',
        description: 'Submit a batch transfer (JSON array required)',
        transactionType: TransactionType.BatchTransaction,
        args: [
            {
                name: 'batchJson',
                type: 'json',
                placeholder: '[{"to":"0x...","tokenAddress":"0x...","value":"0","tokenId":"0"}]',
                description: 'Array of { to, tokenAddress, value, tokenId } objects',
            },
        ],
    },
    {
        id: 'custom_call',
        label: 'Custom Call',
        description: 'Submit a custom contract call from the MultiSig wallet',
        transactionType: TransactionType.Other,
        args: [
            {
                name: 'target',
                type: 'address',
                placeholder: '0x...',
                description: 'Target contract address',
            },
            {
                name: 'valueEth',
                type: 'decimal',
                placeholder: '0',
                description: 'ETH value to send',
            },
            {
                name: 'calldata',
                type: 'bytes',
                placeholder: '0x',
                description: 'Hex calldata',
            },
        ],
    },
];

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

function parseBigInt(value: string, label: string): bigint {
    if (!value || !/^[0-9]+$/.test(value)) {
        throw new Error(`Invalid ${label} value`);
    }
    return BigInt(value);
}

function ensureAddress(value: string, label: string): `0x${string}` {
    if (!addressRegex.test(value)) {
        throw new Error(`Invalid ${label} address`);
    }
    return value as `0x${string}`;
}

export function WalletOperationBuilder({ onSuccess }: WalletOperationBuilderProps) {
    const router = useRouter();
    const { submitTransaction, isSubmitting, multiSigAddress, owners } = useMultisigWallet();
    const hasMultiSigAddress = Boolean(multiSigAddress);
    const chainId = useChainId();
    const defaultTemplate: WalletOperationTemplate = walletOperationTemplates[0] || {
        id: 'eth_transfer',
        label: 'ETH Transfer',
        description: 'Send ETH from the MultiSig wallet',
        transactionType: TransactionType.ETH,
        args: [
            {
                name: 'recipient',
                type: 'address',
                placeholder: '0x...'
            },
            {
                name: 'amountEth',
                type: 'decimal',
                placeholder: '0.25'
            }
        ]
    };
    const [selectedOperation, setSelectedOperation] = useState<string>(defaultTemplate.id);
    const [args, setArgs] = useState<string[]>([]);
    const [selectedTokenAddress, setSelectedTokenAddress] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const template = walletOperationTemplates.find((item) => item.id === selectedOperation) || defaultTemplate;
    const isEthTransfer = selectedOperation === 'eth_transfer';
    const isErc20Transfer = selectedOperation === 'erc20_transfer';
    const isErc20TransferFrom = selectedOperation === 'erc20_transfer_from';
    const isErc721Transfer = selectedOperation === 'erc721_transfer';
    const isOwnerOperation = selectedOperation === 'add_owner' || selectedOperation === 'remove_owner';
    const isBatchTransfer = selectedOperation === 'batch_transfer';
    const isCustomCall = selectedOperation === 'custom_call';

    const availableTokens = useMemo(() => {
        if (!chainId) return [];
        return getAvailableTokens(chainId);
    }, [chainId]);

    const activeToken = useMemo(() => {
        if (!selectedTokenAddress) return undefined;
        return availableTokens.find((token) => token.address.toLowerCase() === selectedTokenAddress.toLowerCase());
    }, [availableTokens, selectedTokenAddress]);

    const { data: ethBalance } = useBalance({
        address: multiSigAddress ? (multiSigAddress as `0x${string}`) : undefined,
    });

    const tokenBalanceContracts = useMemo(() => {
        if (!multiSigAddress || availableTokens.length === 0) return [];
        return availableTokens.map((token) => ({
            address: token.address,
            abi: WETH_ABI,
            functionName: 'balanceOf',
            args: [multiSigAddress],
        }));
    }, [availableTokens, multiSigAddress]);

    const { data: tokenBalances } = useReadContracts({
        contracts: tokenBalanceContracts,
        query: {
            enabled: tokenBalanceContracts.length > 0,
        },
    });

    const handleOperationChange = (operation: string) => {
        setSelectedOperation(operation);
        const next = walletOperationTemplates.find((item) => item.id === operation);
        setArgs(new Array(next?.args.length || 0).fill(''));
        setError(null);
        setSuccess(false);

        if (operation === 'erc20_transfer' || operation === 'erc20_transfer_from') {
            const defaultToken = availableTokens[0];
            if (defaultToken) {
                setSelectedTokenAddress(defaultToken.address);
                setArgs([defaultToken.address, ...new Array((next?.args.length || 1) - 1).fill('')]);
            }
        }
    };

    const handleArgChange = (index: number, value: string) => {
        const nextArgs = [...args];
        nextArgs[index] = value;
        setArgs(nextArgs);
    };

    const handleOwnerSelect = (owner: string) => {
        const nextArgs = [...args];
        nextArgs[0] = owner;
        setArgs(nextArgs);
    };

    const handleTokenSelect = (address: string) => {
        setSelectedTokenAddress(address);
        const nextArgs = [...args];
        nextArgs[0] = address;
        setArgs(nextArgs);
    };

    const formatTokenBalance = (token: TokenConfig, value?: bigint) => {
        if (value === undefined || value === null) return '0';
        return formatUnits(value, token.decimals);
    };

    const selectedTokenBalance = useMemo(() => {
        if (!activeToken) return null;
        const index = availableTokens.findIndex((token) => token.address === activeToken.address);
        if (index < 0) return null;
        const value = tokenBalances?.[index]?.result as bigint | undefined;
        return formatTokenBalance(activeToken, value);
    }, [activeToken, availableTokens, tokenBalances]);

    const buildRequest = (): SubmitTransactionRequest => {
        switch (template.id) {
            case 'eth_transfer': {
                const recipient = ensureAddress(args[0] || '', 'recipient');
                const amount = parseUnits(args[1] || '0', 18);
                return {
                    transactionType: TransactionType.ETH,
                    to: recipient,
                    value: amount,
                    data: '0x',
                    description: template.label,
                };
            }
            case 'erc20_transfer': {
                const tokenAddress = ensureAddress(args[0] || selectedTokenAddress || '', 'token');
                const recipient = ensureAddress(args[1] || '', 'recipient');
                const decimals = activeToken?.decimals ?? 18;
                const amount = parseUnits(args[2] || '0', decimals);
                const data = encodeAbiParameters(
                    [{ name: 'tokenAddress', type: 'address' }],
                    [tokenAddress]
                );
                return {
                    transactionType: TransactionType.ERC20,
                    to: recipient,
                    value: amount,
                    data,
                    description: template.label,
                };
            }
            case 'erc20_transfer_from': {
                const tokenAddress = ensureAddress(args[0] || selectedTokenAddress || '', 'token');
                const from = ensureAddress(args[1] || '', 'from');
                const recipient = ensureAddress(args[2] || '', 'recipient');
                const decimals = activeToken?.decimals ?? 18;
                const amount = parseUnits(args[3] || '0', decimals);
                const data = encodeAbiParameters(
                    [
                        { name: 'tokenAddress', type: 'address' },
                        { name: 'from', type: 'address' },
                    ],
                    [tokenAddress, from]
                );
                return {
                    transactionType: TransactionType.ERC20_TRANSFER_FROM,
                    to: recipient,
                    value: amount,
                    data,
                    description: template.label,
                };
            }
            case 'erc721_transfer': {
                const tokenAddress = ensureAddress(args[0] || '', 'token');
                const recipient = ensureAddress(args[1] || '', 'recipient');
                const tokenId = parseBigInt(args[2] || '', 'tokenId');
                const data = encodeAbiParameters(
                    [{ name: 'tokenAddress', type: 'address' }],
                    [tokenAddress]
                );
                return {
                    transactionType: TransactionType.ERC721,
                    to: recipient,
                    value: tokenId,
                    data,
                    description: template.label,
                };
            }
            case 'add_owner': {
                const newOwner = ensureAddress(args[0] || '', 'new owner');
                return {
                    transactionType: TransactionType.AddOwner,
                    to: newOwner,
                    value: BigInt(0),
                    data: '0x',
                    description: template.label,
                };
            }
            case 'remove_owner': {
                const owner = ensureAddress(args[0] || '', 'owner');
                return {
                    transactionType: TransactionType.RemoveOwner,
                    to: owner,
                    value: BigInt(0),
                    data: '0x',
                    description: template.label,
                };
            }
            case 'batch_transfer': {
                if (!multiSigAddress) {
                    throw new Error('MultiSig address is not available for this network');
                }
                const raw = args[0] || '';
                let parsed: Array<{ to: `0x${string}`; tokenAddress: `0x${string}`; value: bigint; tokenId: bigint }> = [];
                try {
                    const input = JSON.parse(raw) as Array<{
                        to: string;
                        tokenAddress: string;
                        value: string | number;
                        tokenId: string | number;
                    }>;
                    parsed = input.map((item) => ({
                        to: ensureAddress(item.to, 'to'),
                        tokenAddress: ensureAddress(item.tokenAddress, 'tokenAddress'),
                        value: BigInt(item.value),
                        tokenId: BigInt(item.tokenId),
                    }));
                } catch (err) {
                    throw new Error('Invalid batch JSON payload');
                }

                const data = encodeAbiParameters(
                    [
                        {
                            name: 'batchTransactions',
                            type: 'tuple[]',
                            components: [
                                { name: 'to', type: 'address' },
                                { name: 'tokenAddress', type: 'address' },
                                { name: 'value', type: 'uint256' },
                                { name: 'tokenId', type: 'uint256' },
                            ],
                        },
                    ],
                    [parsed]
                );

                return {
                    transactionType: TransactionType.BatchTransaction,
                    to: multiSigAddress,
                    value: BigInt(0),
                    data,
                    description: template.label,
                };
            }
            case 'custom_call': {
                const target = ensureAddress(args[0] || '', 'target');
                const value = parseUnits(args[1] || '0', 18);
                const calldata = args[2] || '';
                if (!calldata.startsWith('0x')) {
                    throw new Error('Calldata must be hex starting with 0x');
                }
                return {
                    transactionType: TransactionType.Other,
                    to: target,
                    value,
                    data: calldata,
                    description: template.label,
                };
            }
            default:
                throw new Error('Unsupported wallet operation');
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        setSuccess(false);

        if (!hasMultiSigAddress) {
            setError('MultiSig address is not configured for this network.');
            return;
        }

        try {
            const request = buildRequest();
            const validation = validateTransactionRequest(request);
            if (!validation.valid) {
                setError(validation.error || 'Invalid transaction data');
                return;
            }

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
            <div>
                <label className="block text-sm font-medium text-gray-700">Wallet Operation</label>
                <select
                    value={selectedOperation}
                    onChange={(e) => handleOperationChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                >
                    {walletOperationTemplates.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.label}
                        </option>
                    ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">{template.description}</p>
            </div>

            {(isEthTransfer || isErc20Transfer || isErc20TransferFrom || isErc721Transfer) && (
                <div className="rounded-md border border-gray-200 bg-white p-4">
                    <div className="text-sm font-medium text-gray-700">Asset</div>
                    {isEthTransfer && (
                        <div className="mt-2 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                            <span className="font-medium text-gray-900">ETH</span>
                            <span className="text-gray-700">
                                {ethBalance ? ethBalance.formatted : '0.0000'} {ethBalance?.symbol || 'ETH'}
                            </span>
                        </div>
                    )}
                    {(isErc20Transfer || isErc20TransferFrom) && (
                        <>
                            <select
                                value={selectedTokenAddress}
                                onChange={(e) => handleTokenSelect(e.target.value)}
                                className="mt-2 block w-full rounded-md border-gray-200 bg-white text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="">Select token</option>
                                {availableTokens.map((token) => (
                                    <option key={token.address} value={token.address}>
                                        {token.symbol} - {token.address.slice(0, 6)}...{token.address.slice(-4)}
                                    </option>
                                ))}
                            </select>
                            {activeToken && (
                                <div className="mt-2 text-xs text-gray-600">
                                    Using {activeToken.symbol} with {activeToken.decimals} decimals.
                                </div>
                            )}
                            {activeToken && selectedTokenBalance !== null && (
                                <div className="mt-1 text-xs text-gray-600">
                                    Wallet balance: {selectedTokenBalance} {activeToken.symbol}
                                </div>
                            )}
                        </>
                    )}
                    {isErc721Transfer && (
                        <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                            Provide token address and token ID below.
                        </div>
                    )}
                </div>
            )}

            {isOwnerOperation && (
                <div className="rounded-md border border-gray-200 bg-white p-4">
                    <div className="text-sm font-medium text-gray-700">Owners</div>
                    {owners.length > 0 ? (
                        <div className="mt-3 space-y-3">
                            {selectedOperation === 'remove_owner' && (
                                <select
                                    value={args[0] || ''}
                                    onChange={(e) => handleOwnerSelect(e.target.value)}
                                    className="block w-full rounded-md border-gray-200 bg-white text-sm shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                >
                                    <option value="">Select owner to remove</option>
                                    {owners.map((owner) => (
                                        <option key={owner as string} value={owner as string}>
                                            {owner as string}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {owners.map((owner) => (
                                    <button
                                        key={owner as string}
                                        type="button"
                                        onClick={() => handleOwnerSelect(owner as string)}
                                        className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-mono text-gray-700 hover:bg-gray-200"
                                    >
                                        {(owner as string).slice(0, 6)}...{(owner as string).slice(-4)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2 text-sm text-gray-500">No owners found.</div>
                    )}
                </div>
            )}

            {isBatchTransfer && (
                <div className="rounded-md border border-gray-200 bg-white p-4">
                    <div className="text-sm font-medium text-gray-700">Batch Payload</div>
                    <div className="mt-2 text-sm text-gray-600">
                        Provide a JSON array using raw units for values and token IDs.
                    </div>
                </div>
            )}

            {isCustomCall && (
                <div className="rounded-md border border-gray-200 bg-white p-4">
                    <div className="text-sm font-medium text-gray-700">Custom Call</div>
                    <div className="mt-2 text-sm text-gray-600">
                        Make sure the target contract expects the calldata provided below.
                    </div>
                </div>
            )}

            {template.args.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Parameters</h3>
                    {template.args.map((arg, index) => (
                        <div key={arg.name}>
                            <label className="block text-sm font-medium text-gray-700">
                                {arg.name}
                                <span className="ml-2 text-xs text-gray-500">({arg.type})</span>
                            </label>
                            {arg.type === 'json' ? (
                                <textarea
                                    value={args[index] || ''}
                                    onChange={(e) => handleArgChange(index, e.target.value)}
                                    placeholder={arg.placeholder}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    rows={4}
                                    required
                                />
                            ) : (
                                <input
                                    type={arg.type === 'decimal' ? 'number' : 'text'}
                                    value={args[index] || ''}
                                    onChange={(e) => handleArgChange(index, e.target.value)}
                                    placeholder={arg.placeholder}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                                    inputMode={arg.type === 'decimal' ? 'decimal' : arg.type === 'uint256' ? 'numeric' : undefined}
                                    step={arg.type === 'decimal' ? 'any' : undefined}
                                    required
                                />
                            )}
                            {arg.description && (
                                <p className="mt-1 text-xs text-gray-500">{arg.description}</p>
                            )}
                            {selectedOperation === 'eth_transfer' && arg.name === 'amountEth' && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Wallet balance: {ethBalance ? ethBalance.formatted : '0.0000'} {ethBalance?.symbol || 'ETH'}
                                </p>
                            )}
                            {selectedOperation === 'erc20_transfer' && arg.name === 'amount' && activeToken && selectedTokenBalance !== null && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Wallet balance: {selectedTokenBalance} {activeToken.symbol}
                                </p>
                            )}
                            {selectedOperation === 'erc20_transfer_from' && arg.name === 'amount' && activeToken && selectedTokenBalance !== null && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Wallet balance: {selectedTokenBalance} {activeToken.symbol}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="rounded-md bg-emerald-50 p-4">
                <h4 className="text-sm font-medium text-emerald-800">Wallet Operation Notes</h4>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-emerald-700">
                    <li>Amounts use normal units (ETH or token units)</li>
                    <li>ERC20 TransferFrom requires prior allowance</li>
                    <li>Batch JSON still uses raw units</li>
                </ul>
            </div>

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

            <button
                type="submit"
                disabled={isSubmitting || success || !hasMultiSigAddress}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
                {isSubmitting ? (
                    <LoadingState size="sm" message="Submitting..." />
                ) : (
                    <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Submit Wallet Operation
                    </>
                )}
            </button>
        </form>
    );
}
