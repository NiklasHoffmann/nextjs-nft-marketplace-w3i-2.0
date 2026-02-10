'use client';

import { useMemo, useState } from 'react';
import { useBalance, useChainId, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { useMultisigWallet } from '@/hooks/multisig/useMultisigWallet';
import { getAvailableTokens, type TokenConfig } from '@/config/tokens';
import { WETH_ABI } from '@/config/abis/weth';

function getNetworkLabel(id?: number): string {
    if (!id) return 'Unknown';
    if (id === 1) return 'Ethereum Mainnet';
    if (id === 11155111) return 'Sepolia Testnet';
    if (id === 31337) return 'Hardhat Local';
    return `Chain ${id}`;
}

function formatBalance(value?: string): string {
    if (!value) return '0.0000';
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed)) return '0.0000';
    return parsed.toFixed(4);
}

function formatTokenBalance(token: TokenConfig, value?: bigint): string {
    if (value === undefined || value === null) return '0.0000';
    const formatted = formatUnits(value, token.decimals);
    const parsed = Number.parseFloat(formatted);
    if (Number.isNaN(parsed)) return '0.0000';
    return parsed.toFixed(4);
}

export function MultisigWalletSidebar() {
    const { multiSigAddress, owners, ownerCount, transactionCount } = useMultisigWallet();
    const { data: walletBalance } = useBalance({
        address: multiSigAddress ? (multiSigAddress as `0x${string}`) : undefined,
    });
    const chainId = useChainId();
    const [copied, setCopied] = useState(false);

    const requiredConfirmations = Math.ceil(ownerCount / 2);

    const availableTokens = useMemo(() => {
        if (!chainId) return [];
        return getAvailableTokens(chainId);
    }, [chainId]);

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

    const handleCopyAddress = async () => {
        if (!multiSigAddress) return;
        try {
            await navigator.clipboard.writeText(multiSigAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error('Failed to copy multisig address', err);
        }
    };

    return (
        <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-medium text-gray-700">MultiSig Wallet</div>
                <div className="mt-2 text-xs text-gray-500">Network</div>
                <div className="text-sm font-semibold text-gray-900">{getNetworkLabel(chainId)}</div>
                <div className="mt-3 text-xs text-gray-500">Wallet Address</div>
                <div className="break-all text-xs font-mono text-gray-900">
                    {multiSigAddress || 'No multisig address configured'}
                </div>
                <button
                    type="button"
                    onClick={handleCopyAddress}
                    disabled={!multiSigAddress}
                    className="mt-3 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                    {copied ? 'Copied' : 'Copy Address'}
                </button>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-medium text-gray-700">Overview</div>
                <div className="mt-3 space-y-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between">
                        <span>Owners</span>
                        <span className="font-semibold text-gray-900">{ownerCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Required Confirmations</span>
                        <span className="font-semibold text-gray-900">{requiredConfirmations}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Total Transactions</span>
                        <span className="font-semibold text-gray-900">{transactionCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>ETH Balance</span>
                        <span className="font-semibold text-gray-900">
                            {formatBalance(walletBalance?.formatted)} {walletBalance?.symbol || 'ETH'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-medium text-gray-700">Owners</div>
                {owners.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                        {owners.map((owner) => (
                            <span
                                key={owner as string}
                                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-mono text-gray-700"
                            >
                                {(owner as string).slice(0, 6)}...{(owner as string).slice(-4)}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-gray-500">No owners loaded.</div>
                )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm font-medium text-gray-700">Token Balances</div>
                {availableTokens.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                        {availableTokens.map((token, index) => {
                            const tokenBalance = tokenBalances?.[index]?.result as bigint | undefined;
                            return (
                                <div
                                    key={token.address}
                                    className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-700"
                                >
                                    <div className="font-medium text-gray-900">{token.symbol}</div>
                                    <div>{formatTokenBalance(token, tokenBalance)}</div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-gray-500">No tokens configured.</div>
                )}
            </div>
        </aside>
    );
}
