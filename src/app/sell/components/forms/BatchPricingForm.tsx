'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { useForm } from '@/hooks';
import { useListingFlow } from '../../contexts/ListingFlowContext';
import { useMarketplaceContracts, useMarketplaceFees } from '@/hooks/marketplace';
import { useERC20 } from '@/hooks/tokens';
import { ExtendedCurrencySelector } from '@/components/marketplace';
import { ZERO_ADDRESS, getTokenConfig, isNativeETH } from '@/config/tokens';
import { devLog } from '@/utils';

interface BatchPricingFormProps {
    selectedCount: number;
    hasErc1155Selected?: boolean;
    whitelistStatus?: 'not-started' | 'checking' | 'done' | 'failed';
    approvalStatus?: 'not-started' | 'checking' | 'done' | 'failed';
    onSubmit: (data: {
        pricingType: 'fixed' | 'variable';
        fixedPrice?: string;
        startPrice?: string;
        endPrice?: string;
        currency: string; // Changed to string (address)
        priceMode: 'gross' | 'net';
        description: string;
        partialBuyEnabled?: boolean;
    }) => void;
}

export function BatchPricingForm({ selectedCount, hasErc1155Selected = false, whitelistStatus = 'not-started', approvalStatus = 'not-started', onSubmit }: BatchPricingFormProps) {
    const [pricingType, setPricingType] = useState<'fixed' | 'variable'>('fixed');
    const { setProgressStep } = useListingFlow();
    const chainId = useChainId();

    // Get marketplace address and dynamic fees
    const { marketplaceAddress } = useMarketplaceContracts();
    const { calculateFees: calculateFeesBase, innovationFeePercentage, royaltyFeePercentage } = useMarketplaceFees({
        marketplaceAddress,
        contractAddress: undefined, // Batch doesn't have single contract
        tokenId: undefined
    });

    // Wrapper function to support priceMode parameter (gross/net)
    const calculateFeesWithMode = (price: string, priceMode: 'gross' | 'net') => {
        const priceNum = parseFloat(price) || 0;

        if (priceMode === 'net') {
            // Net mode: Calculate gross price from desired net amount
            const totalFeePercentage = innovationFeePercentage + royaltyFeePercentage;
            const grossPrice = priceNum / (1 - totalFeePercentage);
            const marketplaceFee = grossPrice * innovationFeePercentage;
            const royaltyFee = grossPrice * royaltyFeePercentage;

            return {
                marketplaceFee,
                royaltyFee,
                totalFees: marketplaceFee + royaltyFee,
                youReceive: priceNum,
                net: priceNum,
                gross: grossPrice
            };
        } else {
            // Gross mode: Calculate fees from gross price
            const marketplaceFee = priceNum * innovationFeePercentage;
            const royaltyFee = priceNum * royaltyFeePercentage;
            const youReceive = priceNum - marketplaceFee - royaltyFee;

            return {
                marketplaceFee,
                royaltyFee,
                totalFees: marketplaceFee + royaltyFee,
                youReceive,
                net: youReceive,
                gross: priceNum
            };
        }
    };

    // Sync progressStep with whitelist/approval status
    useEffect(() => {
        if (selectedCount === 0) {
            setProgressStep('select');
            return;
        }

        // Whitelist check is running
        if (whitelistStatus === 'checking') {
            setProgressStep('whitelist');
            return;
        }

        // Whitelist failed - stay at select
        if (whitelistStatus === 'failed') {
            setProgressStep('select');
            return;
        }

        // Approval check is running
        if (whitelistStatus === 'done' && approvalStatus === 'checking') {
            setProgressStep('approval');
            return;
        }

        // Approval failed - stay at select
        if (approvalStatus === 'failed') {
            setProgressStep('select');
            return;
        }

        // Both checks successful - form is active
        if (whitelistStatus === 'done' && approvalStatus === 'done') {
            setProgressStep('form');
            return;
        }
    }, [selectedCount, whitelistStatus, approvalStatus, setProgressStep]);

    const form = useForm({
        initialValues: {
            fixedPrice: '',
            startPrice: '',
            endPrice: '',
            currency: ZERO_ADDRESS as string, // Default: ETH (zero address)
            priceMode: 'gross' as 'gross' | 'net', // gross = Brutto (Käufer zahlt), net = Netto (Seller erhält)
            description: '',
            partialBuyEnabled: false
        },
        validate: (values) => {
            const errors: Record<string, string> = {};

            if (pricingType === 'fixed') {
                if (!values.fixedPrice || parseFloat(values.fixedPrice) <= 0) {
                    errors.fixedPrice = 'Bitte geben Sie einen gültigen Preis ein';
                }
            } else {
                if (!values.startPrice || parseFloat(values.startPrice) <= 0) {
                    errors.startPrice = 'Bitte geben Sie einen gültigen Startpreis ein';
                }
                if (!values.endPrice || parseFloat(values.endPrice) <= 0) {
                    errors.endPrice = 'Bitte geben Sie einen gültigen Endpreis ein';
                }
                if (values.startPrice && values.endPrice && parseFloat(values.startPrice) >= parseFloat(values.endPrice)) {
                    errors.endPrice = 'Endpreis muss höher als Startpreis sein';
                }
            }

            if (!values.description.trim()) {
                errors.description = 'Bitte geben Sie eine Beschreibung ein';
            }

            return errors;
        },
        onSubmit: async (values) => {
            // ERC20 Token Approval check (WETH, USDC, DAI)
            const isERC20 = values.currency !== ZERO_ADDRESS;
            if (isERC20 && pricingType === 'fixed' && values.fixedPrice) {
                const needsApproval = !hasEnoughAllowance(values.fixedPrice);
                if (needsApproval) {
                    try {
                        await approve(); // Unlimited approval
                        // Wait a bit for approval to be confirmed
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    } catch (error) {
                        devLog.error('Token approval failed:', error);
                        alert('Token approval failed. Please try again.');
                        return;
                    }
                }
            }

            // Im Netto-Modus: Brutto-Preis für Contract verwenden
            const submissionPrice = pricingType === 'fixed' && values.priceMode === 'net' && values.fixedPrice
                ? fees.grossPrice.toString()
                : undefined;

            onSubmit({
                pricingType,
                fixedPrice: pricingType === 'fixed'
                    ? (values.priceMode === 'net' ? submissionPrice : values.fixedPrice)
                    : undefined,
                startPrice: pricingType === 'variable' ? values.startPrice : undefined,
                endPrice: pricingType === 'variable' ? values.endPrice : undefined,
                currency: values.currency,
                priceMode: values.priceMode,
                description: values.description,
                partialBuyEnabled: hasErc1155Selected ? values.partialBuyEnabled : false
            });
        }
    });

    // Get token config for selected currency
    const selectedTokenConfig = useMemo(() => {
        if (isNativeETH(form.values.currency)) return null;

        // Try to find token config (including mock tokens for development)
        const tokens = ['WETH', 'USDC', 'DAI', 'MOCK_ERC20', 'MOCK_WBTC', 'MOCK_EURS', 'MOCK_USDT'] as const;
        for (const tokenSymbol of tokens) {
            const config = getTokenConfig(chainId, tokenSymbol);
            if (config?.address.toLowerCase() === form.values.currency.toLowerCase()) {
                return config;
            }
        }
        return null;
    }, [form.values.currency, chainId]);

    // Generic ERC20 Hook for approval check (works with any token)
    const {
        hasEnoughAllowance,
        approve,
        balance: tokenBalance,
        isApproving
    } = useERC20({
        tokenAddress: selectedTokenConfig?.address as `0x${string}` | undefined,
        spenderAddress: marketplaceAddress,
        decimals: selectedTokenConfig?.decimals || 18
    });

    // Gebühren berechnen (nur für festen Preis) - dynamisch vom Contract
    // Unterstützt Brutto (Käufer zahlt) und Netto (Seller erhält) Modi
    const fees = pricingType === 'fixed' && form.values.fixedPrice && parseFloat(form.values.fixedPrice) > 0
        ? (() => {
            const inputPrice = parseFloat(form.values.fixedPrice);
            const totalFeeRate = innovationFeePercentage + royaltyFeePercentage;

            if (form.values.priceMode === 'net') {
                // Netto-Modus: Eingegebener Preis = Was Seller erhält
                // Brutto-Preis = Netto / (1 - feeRate)
                const netPrice = inputPrice;
                const grossPrice = netPrice / (1 - totalFeeRate);
                const marketplaceFee = grossPrice * innovationFeePercentage;
                const royaltyFee = grossPrice * royaltyFeePercentage;

                return {
                    grossPrice,
                    marketplaceFee,
                    royaltyFee,
                    totalFees: marketplaceFee + royaltyFee,
                    youReceive: netPrice,
                    marketplaceFeePercentage: innovationFeePercentage * 100,
                    royaltyFeePercentage: royaltyFeePercentage * 100
                };
            } else {
                // Brutto-Modus: Eingegebener Preis = Was Käufer zahlt
                const grossPrice = inputPrice;
                const fees = calculateFeesBase(grossPrice);
                return { ...fees, grossPrice };
            }
        })()
        : { grossPrice: 0, marketplaceFee: 0, royaltyFee: 0, totalFees: 0, youReceive: 0, marketplaceFeePercentage: 0, royaltyFeePercentage: 0 };

    return (
        <form onSubmit={form.handleSubmit} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preis-Konfiguration</h3>

            {/* Pricing Type Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Preis-Strategie
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setPricingType('fixed')}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${pricingType === 'fixed'
                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-md'
                            : 'border-gray-200 hover:border-purple-300 bg-white'
                            }`}
                    >
                        <div className="text-center">
                            <svg className={`w-6 h-6 mx-auto mb-2 ${pricingType === 'fixed' ? 'text-purple-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10m-10 5h10" />
                            </svg>
                            <span className={`text-sm font-medium ${pricingType === 'fixed' ? 'text-purple-900' : 'text-gray-700'}`}>
                                Fester Preis
                            </span>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPricingType('variable')}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${pricingType === 'variable'
                            ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-md'
                            : 'border-gray-200 hover:border-green-300 bg-white'
                            }`}
                    >
                        <div className="text-center">
                            <svg className={`w-6 h-6 mx-auto mb-2 ${pricingType === 'variable' ? 'text-green-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                            <span className={`text-sm font-medium ${pricingType === 'variable' ? 'text-green-900' : 'text-gray-700'}`}>
                                Variable Preise
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {hasErc1155Selected && (
                <div className="mb-6 rounded-xl border border-purple-200 bg-purple-50 p-4">
                    <label className="flex items-center gap-3 text-sm font-medium text-purple-900">
                        <input
                            type="checkbox"
                            checked={form.values.partialBuyEnabled}
                            onChange={(event) => form.setFieldValue('partialBuyEnabled', event.target.checked)}
                            className="h-4 w-4 text-purple-600 border-purple-300 focus:ring-purple-500"
                        />
                        Teilkauf fuer ERC1155 erlauben
                    </label>
                    <p className="text-xs text-purple-700 mt-1">
                        Ermöglicht Käufern, eine Teilmenge der gelisteten ERC1155-Menge zu kaufen.
                    </p>
                </div>
            )}

            {/* Fixed Price */}
            {pricingType === 'fixed' && (
                <>
                    {/* Currency Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Zahlungsmethode *
                        </label>
                        <ExtendedCurrencySelector
                            value={form.values.currency}
                            onChange={(currency) => form.setFieldValue('currency', currency)}
                        />
                        {form.values.currency !== ZERO_ADDRESS && selectedTokenConfig && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{selectedTokenConfig.symbol} Balance: {parseFloat(tokenBalance).toFixed(selectedTokenConfig.decimals === 6 ? 2 : 4)} {selectedTokenConfig.symbol}</span>
                            </div>
                        )}
                    </div>

                    {/* Price Mode Selection (Brutto/Netto) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preisangabe *
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => form.setFieldValue('priceMode', 'gross')}
                                className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${form.values.priceMode === 'gross'
                                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span>Brutto-Preis</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Käufer zahlt</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => form.setFieldValue('priceMode', 'net')}
                                className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${form.values.priceMode === 'net'
                                    ? 'border-green-500 bg-green-50 text-green-900'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Netto-Preis</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Sie erhalten</div>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {form.values.priceMode === 'gross'
                                ? 'Geben Sie den Endpreis ein, den der Käufer zahlt. Gebühren werden automatisch abgezogen.'
                                : 'Geben Sie den Betrag ein, den Sie nach Abzug aller Gebühren erhalten möchten.'
                            }
                        </p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {form.values.priceMode === 'gross' ? 'Preis für alle ' + selectedCount + ' NFTs (Brutto)' : 'Gewünschter Betrag (Netto)'} *
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.0001"
                                {...form.getFieldProps('fixedPrice')}
                                className={`w-full rounded-lg border ${form.hasError('fixedPrice') ? 'border-red-300' : 'border-gray-300'} px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500`}
                                placeholder="0.00"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                                {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}
                            </div>
                        </div>
                        {form.hasError('fixedPrice') && (
                            <p className="mt-1 text-sm text-red-600">{form.getFieldError('fixedPrice')}</p>
                        )}

                        {/* ERC20 Token Approval Warning */}
                        {form.values.currency !== ZERO_ADDRESS && form.values.fixedPrice && parseFloat(form.values.fixedPrice) > 0 && !hasEnoughAllowance(form.values.fixedPrice) && (
                            <div className="mt-2 flex items-start gap-2 text-xs text-orange-700 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>{selectedTokenConfig?.symbol || 'Token'} approval required. You will be asked to approve {selectedTokenConfig?.symbol || 'token'} spending before listing.</span>
                            </div>
                        )}

                        {/* Gebühren-Übersicht */}
                        {form.values.fixedPrice && parseFloat(form.values.fixedPrice) > 0 && (
                            <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200 text-xs space-y-1">
                                {form.values.priceMode === 'net' && (
                                    <div className="flex justify-between text-gray-900 font-semibold pb-1 mb-1 border-b border-gray-200">
                                        <span>Listing-Preis (Brutto):</span>
                                        <span>{fees.grossPrice.toFixed(4)} {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-600">
                                    <span>Marketplace-Gebühr ({(innovationFeePercentage * 100).toFixed(2)}%):</span>
                                    <span>-{fees.marketplaceFee.toFixed(4)} {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Royalty-Gebühr ({(royaltyFeePercentage * 100).toFixed(2)}%):</span>
                                    <span>-{fees.royaltyFee.toFixed(4)} {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-1 mt-2 flex justify-between font-semibold text-gray-900">
                                    <span>Sie erhalten pro NFT (Netto):</span>
                                    <span className="text-green-600">{fees.youReceive.toFixed(4)} {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}</span>
                                </div>
                                <div className="flex justify-between font-bold text-green-700 text-sm pt-1 border-t border-green-200">
                                    <span>Gesamt für {selectedCount} NFTs:</span>
                                    <span>{(fees.youReceive * selectedCount).toFixed(4)} {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Variable Price Range */}
            {pricingType === 'variable' && (
                <>
                    {/* Currency Selection */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Zahlungsmethode *
                        </label>
                        <ExtendedCurrencySelector
                            value={form.values.currency}
                            onChange={(currency) => form.setFieldValue('currency', currency)}
                        />
                        {form.values.currency !== ZERO_ADDRESS && selectedTokenConfig && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{selectedTokenConfig.symbol} Balance: {parseFloat(tokenBalance).toFixed(selectedTokenConfig.decimals === 6 ? 2 : 4)} {selectedTokenConfig.symbol}</span>
                            </div>
                        )}
                    </div>

                    {/* Price Mode Selection (Brutto/Netto) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preisangabe *
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => form.setFieldValue('priceMode', 'gross')}
                                className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${form.values.priceMode === 'gross'
                                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span>Brutto-Preis</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Käufer zahlt</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => form.setFieldValue('priceMode', 'net')}
                                className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${form.values.priceMode === 'net'
                                    ? 'border-green-500 bg-green-50 text-green-900'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Netto-Preis</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Sie erhalten</div>
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {form.values.priceMode === 'gross'
                                ? 'Geben Sie die Preise ein, die Käufer zahlen. Gebühren werden automatisch abgezogen.'
                                : 'Geben Sie die Beträge ein, die Sie nach Abzug aller Gebühren erhalten möchten.'
                            }
                        </p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {form.values.priceMode === 'gross' ? 'Startpreis (niedrigster, Brutto)' : 'Startpreis (niedrigster, Netto)'} *
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.0001"
                                {...form.getFieldProps('startPrice')}
                                className={`w-full rounded-lg border ${form.hasError('startPrice') ? 'border-red-300' : 'border-gray-300'} px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                                placeholder="0.00"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                                {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}
                            </div>
                        </div>
                        {form.hasError('startPrice') && (
                            <p className="mt-1 text-sm text-red-600">{form.getFieldError('startPrice')}</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {form.values.priceMode === 'gross' ? 'Endpreis (höchster, Brutto)' : 'Endpreis (höchster, Netto)'} *
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.0001"
                                {...form.getFieldProps('endPrice')}
                                className={`w-full rounded-lg border ${form.hasError('endPrice') ? 'border-red-300' : 'border-gray-300'} px-4 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500`}
                                placeholder="0.00"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                                {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}
                            </div>
                        </div>
                        {form.hasError('endPrice') && (
                            <p className="mt-1 text-sm text-red-600">{form.getFieldError('endPrice')}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Preise werden gleichmäßig zwischen Start und Ende verteilt
                        </p>
                    </div>

                    {/* Fee Breakdown für beide Preise */}
                    {form.values.startPrice && form.values.endPrice && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                            {/* Startpreis Gebühren */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    Niedrigster Preis (Startpreis)
                                </h4>
                                <div className="pl-6 space-y-1.5 text-xs">
                                    <div className="flex justify-between text-gray-700">
                                        <span>{form.values.priceMode === 'gross' ? 'Bruttopreis' : 'Gewünschter Nettoerlös'}</span>
                                        <span className="font-medium">{parseFloat(form.values.startPrice).toFixed(4)} {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Marketplace Fee ({(innovationFeePercentage * 100).toFixed(2)}%)</span>
                                        <span>-{calculateFeesWithMode(form.values.startPrice, form.values.priceMode).marketplaceFee.toFixed(4)} {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Creator Royalty ({(royaltyFeePercentage * 100).toFixed(2)}%)</span>
                                        <span>-{calculateFeesWithMode(form.values.startPrice, form.values.priceMode).royaltyFee.toFixed(4)} {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}</span>
                                    </div>
                                    <div className="pt-1.5 mt-1.5 border-t border-gray-300 flex justify-between text-gray-900 font-semibold">
                                        <span>{form.values.priceMode === 'gross' ? 'Sie erhalten (pro NFT)' : 'Käufer zahlt (pro NFT)'}</span>
                                        <span className="text-green-600">
                                            {form.values.priceMode === 'gross'
                                                ? calculateFeesWithMode(form.values.startPrice, form.values.priceMode).net.toFixed(4)
                                                : calculateFeesWithMode(form.values.startPrice, form.values.priceMode).gross.toFixed(4)
                                            } {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Endpreis Gebühren */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                    </svg>
                                    Höchster Preis (Endpreis)
                                </h4>
                                <div className="pl-6 space-y-1.5 text-xs">
                                    <div className="flex justify-between text-gray-700">
                                        <span>{form.values.priceMode === 'gross' ? 'Bruttopreis' : 'Gewünschter Nettoerlös'}</span>
                                        <span className="font-medium">{parseFloat(form.values.endPrice).toFixed(4)} {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Marketplace Fee ({(innovationFeePercentage * 100).toFixed(2)}%)</span>
                                        <span>-{calculateFeesWithMode(form.values.endPrice, form.values.priceMode).marketplaceFee.toFixed(4)} {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Creator Royalty ({(royaltyFeePercentage * 100).toFixed(2)}%)</span>
                                        <span>-{calculateFeesWithMode(form.values.endPrice, form.values.priceMode).royaltyFee.toFixed(4)} {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}</span>
                                    </div>
                                    <div className="pt-1.5 mt-1.5 border-t border-gray-300 flex justify-between text-gray-900 font-semibold">
                                        <span>{form.values.priceMode === 'gross' ? 'Sie erhalten (pro NFT)' : 'Käufer zahlt (pro NFT)'}</span>
                                        <span className="text-green-600">
                                            {form.values.priceMode === 'gross'
                                                ? calculateFeesWithMode(form.values.endPrice, form.values.priceMode).net.toFixed(4)
                                                : calculateFeesWithMode(form.values.endPrice, form.values.priceMode).gross.toFixed(4)
                                            } {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Gesamtbetrag Range */}
                            <div className="pt-3 mt-3 border-t-2 border-gray-300">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-900">
                                        {form.values.priceMode === 'gross' ? 'Gesamterlös für alle NFTs' : 'Gesamtbetrag zu zahlen (alle NFTs)'}
                                    </span>
                                    <div className="text-right">
                                        <div className="text-base font-bold text-green-600">
                                            {form.values.priceMode === 'gross'
                                                ? `${(calculateFeesWithMode(form.values.startPrice, form.values.priceMode).net * selectedCount).toFixed(4)} - ${(calculateFeesWithMode(form.values.endPrice, form.values.priceMode).net * selectedCount).toFixed(4)}`
                                                : `${(calculateFeesWithMode(form.values.startPrice, form.values.priceMode).gross * selectedCount).toFixed(4)} - ${(calculateFeesWithMode(form.values.endPrice, form.values.priceMode).gross * selectedCount).toFixed(4)}`
                                            }
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {form.values.currency === ZERO_ADDRESS ? 'ETH' : (selectedTokenConfig?.symbol || 'WETH')} für {selectedCount} NFTs
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ERC20 Token Approval Warning */}
                            {form.values.currency !== ZERO_ADDRESS && (
                                <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div className="text-xs text-amber-800">
                                        <p className="font-semibold mb-1">ERC20 Token Approval erforderlich</p>
                                        <p>Käufer müssen den {selectedTokenConfig?.symbol || 'Token'} Contract erst für die Zahlung freigeben, bevor sie kaufen können.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Description */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung *
                </label>
                <textarea
                    {...form.getFieldProps('description')}
                    rows={3}
                    className={`w-full rounded-xl border ${form.hasError('description') ? 'border-red-300' : 'border-gray-300'} px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 shadow-sm`}
                    placeholder="Beschreiben Sie Ihre Batch-Listings..."
                />
                {form.hasError('description') && (
                    <p className="mt-1 text-sm text-red-600">{form.getFieldError('description')}</p>
                )}
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={whitelistStatus !== 'done' || approvalStatus === 'checking'}
                className={`w-full px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 transform flex items-center justify-center gap-2 ${whitelistStatus !== 'done' || approvalStatus === 'checking'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:scale-105'
                    }`}
            >
                {whitelistStatus === 'failed' ? (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Collection nicht whitelisted
                    </>
                ) : whitelistStatus === 'checking' ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Prüfe Whitelist...
                    </>
                ) : approvalStatus === 'checking' ? (
                    <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Prüfe Approval...
                    </>
                ) : approvalStatus === 'failed' ? (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Approve & List {selectedCount} NFT{selectedCount > 1 ? 's' : ''}
                    </>
                ) : (
                    `${selectedCount} NFT${selectedCount > 1 ? 's' : ''} listen`
                )}
            </button>
        </form>
    );
}
