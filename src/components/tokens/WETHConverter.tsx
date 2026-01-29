/**
 * WETH Converter Component
 * 
 * Allows users to wrap/unwrap ETH and manage WETH approvals
 */

'use client';

import { useState, useEffect } from 'react';
import { useWETH } from '@/hooks/tokens';
import { useMarketplaceContracts } from '@/hooks/marketplace';
import { LoadingState, ButtonSpinner } from '@/components/core/Loading';

export function WETHConverter() {
    const { marketplaceAddress } = useMarketplaceContracts();
    const { 
        wrap, 
        unwrap, 
        approve,
        ethBalance, 
        wethBalance, 
        allowance,
        hasEnoughAllowance,
        isWrapping, 
        isUnwrapping,
        isApproving,
        isWrapSuccess,
        isUnwrapSuccess,
        isApproveSuccess,
        refetchBalance,
        refetchEthBalance,
        error
    } = useWETH({ marketplaceAddress });

    const [amount, setAmount] = useState('');
    const [actionType, setActionType] = useState<'wrap' | 'unwrap' | 'approve' | null>(null);

    // Reset form on success
    useEffect(() => {
        if (isWrapSuccess || isUnwrapSuccess || isApproveSuccess) {
            setAmount('');
            setActionType(null);
            // Refetch balances
            refetchBalance();
            refetchEthBalance();
        }
    }, [isWrapSuccess, isUnwrapSuccess, isApproveSuccess, refetchBalance, refetchEthBalance]);

    const handleWrap = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        setActionType('wrap');
        try {
            await wrap(amount);
        } catch (err) {
            console.error('Wrap failed:', err);
        }
    };

    const handleUnwrap = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        setActionType('unwrap');
        try {
            await unwrap(amount);
        } catch (err) {
            console.error('Unwrap failed:', err);
        }
    };

    const handleApprove = async (unlimitedApproval = true) => {
        setActionType('approve');
        try {
            await approve(unlimitedApproval ? undefined : amount);
        } catch (err) {
            console.error('Approve failed:', err);
        }
    };

    const setMaxETH = () => {
        const maxAmount = parseFloat(ethBalance);
        if (maxAmount > 0.01) {
            // Keep 0.01 ETH for gas
            setAmount((maxAmount - 0.01).toFixed(6));
        }
    };

    const setMaxWETH = () => {
        setAmount(parseFloat(wethBalance).toFixed(6));
    };

    const isProcessing = isWrapping || isUnwrapping || isApproving;

    return (
        <div className="space-y-6 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">WETH Converter</h3>
                <div className="text-sm text-gray-500">
                    Wrap & Unwrap ETH
                </div>
            </div>
            
            {/* Balances */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <p className="text-xs font-medium text-blue-600 mb-1">ETH Balance</p>
                    <p className="text-2xl font-bold text-blue-900 font-mono">
                        {parseFloat(ethBalance).toFixed(4)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Native Ether</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <p className="text-xs font-medium text-purple-600 mb-1">WETH Balance</p>
                    <p className="text-2xl font-bold text-purple-900 font-mono">
                        {parseFloat(wethBalance).toFixed(4)}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">Wrapped Ether</p>
                </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Amount
                </label>
                <div className="relative">
                    <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        disabled={isProcessing}
                        className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                        <button
                            type="button"
                            onClick={setMaxETH}
                            disabled={isProcessing}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                        >
                            MAX ETH
                        </button>
                        <button
                            type="button"
                            onClick={setMaxWETH}
                            disabled={isProcessing}
                            className="text-xs font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50"
                        >
                            MAX WETH
                        </button>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={handleWrap}
                    disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                    className="px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isWrapping && actionType === 'wrap' ? (
                        <>
                            <ButtonSpinner />
                            <span>Wrapping...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-lg">→</span>
                            <span>Wrap to WETH</span>
                        </>
                    )}
                </button>
                
                <button
                    onClick={handleUnwrap}
                    disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                    className="px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isUnwrapping && actionType === 'unwrap' ? (
                        <>
                            <ButtonSpinner />
                            <span>Unwrapping...</span>
                        </>
                    ) : (
                        <>
                            <span className="text-lg">←</span>
                            <span>Unwrap to ETH</span>
                        </>
                    )}
                </button>
            </div>

            {/* Marketplace Allowance */}
            {marketplaceAddress && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-700">Marketplace Allowance</p>
                            <p className="text-xs text-gray-500 mt-0.5">Allow marketplace to spend your WETH</p>
                        </div>
                        <p className="text-lg font-mono font-bold text-gray-900">
                            {parseFloat(allowance).toFixed(4)}
                        </p>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleApprove(true)}
                            disabled={isProcessing}
                            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isApproving && actionType === 'approve' ? (
                                <>
                                    <ButtonSpinner />
                                    <span>Approving...</span>
                                </>
                            ) : (
                                <span>Approve Unlimited</span>
                            )}
                        </button>
                        
                        <button
                            onClick={() => handleApprove(false)}
                            disabled={isProcessing || !amount}
                            className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Approve Amount
                        </button>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Success Messages */}
            {isWrapSuccess && actionType === 'wrap' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">✅ Successfully wrapped ETH to WETH!</p>
                </div>
            )}
            {isUnwrapSuccess && actionType === 'unwrap' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">✅ Successfully unwrapped WETH to ETH!</p>
                </div>
            )}
            {isApproveSuccess && actionType === 'approve' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">✅ WETH approved for marketplace!</p>
                </div>
            )}
        </div>
    );
}
