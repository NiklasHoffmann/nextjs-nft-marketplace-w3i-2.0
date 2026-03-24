/**
 * ContractInfoSection - Displays blockchain contract data
 * 
 * Shows:
 * - Current owner and owner's NFT balance
 * - Approved address for marketplace
 * - Token URI
 * - Total supply
 */

'use client';

import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import { getMarketplaceAddress } from '@/services/blockchain/contracts';
import { devLog } from '@/utils';

interface ContractInfoSectionProps {
    contract: {
        contractName: string;
        contractSymbol: string;
        totalSupply: number | null;
        tokenURI: string | null;
        owner: string | null;
        ownerBalance: number | null;
        ownershipBalances?: Record<string, number> | null;
        holderCount?: number | null;
        approved: string | null;
    };
    tokenStandard?: string;
    isApprovedForAll?: boolean; // Operator-level approval (separate prop!)
    marketplaceListing?: {
        isListed?: boolean;
        status?: string | null;
        seller?: string | null;
        listingId?: string | null;
        connectedAddress?: string | null;
    };
}

function InfoRow({ label, value, subtitle }: { label: string; value: React.ReactNode; subtitle?: string }) {
    return (
        <div className="py-3 border-b border-gray-200 last:border-0">
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900 break-all">{value}</dd>
            {subtitle && <dd className="mt-1 text-xs text-gray-500">{subtitle}</dd>}
        </div>
    );
}

export function ContractInfoSection({ contract, tokenStandard, isApprovedForAll, marketplaceListing }: ContractInfoSectionProps) {
    // Get current chain ID from wagmi
    const chainId = useChainId();

    // Get marketplace address from network.mapping.json for current chain
    const marketplaceAddress = getMarketplaceAddress(chainId);
    const isErc1155 = tokenStandard === 'ERC1155';
    devLog.log('🏷️ ContractInfoSection - contract:', contract);
    devLog.log('🏷️ ContractInfoSection - isApprovedForAll:', isApprovedForAll);

    // Check Token-Level Approval (getApproved)
    const hasTokenApproval = !isErc1155 && contract.approved && marketplaceAddress
        ? contract.approved.toLowerCase() === marketplaceAddress.toLowerCase()
        : false;

    // Check Operator-Level Approval (isApprovedForAll)
    const hasOperatorApproval = isApprovedForAll === true;

    // NFT is approved if EITHER token-level OR operator-level approval exists
    const isApprovedForMarketplace = hasTokenApproval || hasOperatorApproval;

    const isNoApproval = !isErc1155 && contract.approved === '0x0000000000000000000000000000000000000000';
    const hasOtherApproval = contract.approved && !hasTokenApproval && !isNoApproval;
    const ownershipEntries = useMemo(() => {
        if (!contract.ownershipBalances || typeof contract.ownershipBalances !== 'object') {
            return [] as Array<{ address: string; amount: number }>;
        }

        return Object.entries(contract.ownershipBalances)
            .map(([address, amount]) => ({
                address,
                amount: Number(amount),
            }))
            .filter((entry) => /^0x[a-f0-9]{40}$/i.test(entry.address) && Number.isFinite(entry.amount) && entry.amount > 0)
            .sort((a, b) => b.amount - a.amount);
    }, [contract.ownershipBalances]);

    const derivedHolderCount = contract.holderCount ?? ownershipEntries.length;
    const totalKnownUnits = ownershipEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const untrackedUnits = contract.totalSupply !== null
        ? Math.max(contract.totalSupply - totalKnownUnits, 0)
        : 0;
    const shouldShowHoldersSection = isErc1155 && (ownershipEntries.length > 1 || untrackedUnits > 0);
    const listingStatus = marketplaceListing?.status ?? null;
    const isActiveListing = Boolean(
        marketplaceListing?.isListed &&
        (!listingStatus || listingStatus === 'LISTED' || listingStatus === 'PARTIALLY_FILLED')
    );
    const listingSeller = marketplaceListing?.seller ?? null;
    const connectedAddress = marketplaceListing?.connectedAddress ?? null;
    const isListingSeller = Boolean(
        isActiveListing &&
        listingSeller &&
        connectedAddress &&
        listingSeller.toLowerCase() === connectedAddress.toLowerCase()
    );

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📜 Contract Information</h3>

            <dl className="divide-y divide-gray-200">
                <InfoRow
                    label="Collection"
                    value={
                        <div>
                            <span className="font-medium">{contract.contractName}</span>
                            <span className="ml-2 text-gray-500">({contract.contractSymbol})</span>
                        </div>
                    }
                />

                <InfoRow
                    label="Total Supply"
                    value={contract.totalSupply ? `${contract.totalSupply.toLocaleString()} NFTs` : 'Unknown'}
                />

                <InfoRow
                    label="Current Owner"
                    value={
                        contract.owner ? (
                            <div className="flex items-center gap-2">
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                    {contract.owner}
                                </code>
                                <button
                                    onClick={() => navigator.clipboard.writeText(contract.owner!)}
                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                    title="Copy address"
                                >
                                    📋
                                </button>
                            </div>
                        ) : 'Unknown'
                    }
                    subtitle={contract.ownerBalance !== null
                        ? (isErc1155
                            ? `Owns ${contract.ownerBalance} units of this token (ERC1155)`
                            : `Owns ${contract.ownerBalance} NFTs from this collection`)
                        : undefined}
                />

                <InfoRow
                    label="Marketplace Listing"
                    value={
                        isActiveListing && listingSeller ? (
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Active Listing
                                    </span>
                                    {listingStatus && (
                                        <span className="text-xs text-gray-500">Status: {listingStatus}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Seller:</span>
                                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                        {listingSeller}
                                    </code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(listingSeller)}
                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                        title="Copy seller address"
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <span className="text-gray-500 text-xs">Not currently listed</span>
                        )
                    }
                    subtitle={
                        isActiveListing
                            ? (isListingSeller
                                ? 'This listing belongs to your connected wallet.'
                                : 'This listing belongs to another wallet holder.')
                            : 'No active marketplace listing for this token at the moment.'
                    }
                />

                {shouldShowHoldersSection && (
                    <InfoRow
                        label="ERC1155 Holders"
                        value={
                            ownershipEntries.length > 0 || untrackedUnits > 0 ? (
                                <div className="space-y-2">
                                    <div className="text-xs text-gray-500">Known holders: {derivedHolderCount}</div>
                                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                                        {ownershipEntries.slice(0, 20).map((entry) => (
                                            <div key={entry.address} className="flex items-center justify-between gap-3 bg-gray-50 rounded px-2 py-1.5">
                                                <code className="text-xs bg-white px-2 py-1 rounded">{entry.address}</code>
                                                <span className="text-xs font-semibold text-gray-700">Qty: {entry.amount}</span>
                                            </div>
                                        ))}
                                        {untrackedUnits > 0 && (
                                            <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                                                <span className="text-xs font-medium text-amber-800">Untracked holders (estimated)</span>
                                                <span className="text-xs font-semibold text-amber-900">Qty: {untrackedUnits}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <span className="text-gray-500 text-xs">No holder balances cached yet</span>
                            )
                        }
                        subtitle="ERC1155 can have multiple owners for the same tokenId"
                    />
                )}

                <InfoRow
                    label="Approval Status"
                    value={
                        <div className="space-y-2">
                            {/* Show Token-Level Approval (getApproved) */}
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Token Approval (getApproved):</div>
                                <div className="flex items-center gap-2">
                                    {isErc1155 ? (
                                        <span className="text-gray-500 text-xs">Not applicable for ERC1155</span>
                                    ) : contract.approved && !isNoApproval ? (
                                        <>
                                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                                {contract.approved}
                                            </code>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(contract.approved!)}
                                                className="text-blue-600 hover:text-blue-800 text-xs"
                                                title="Copy address"
                                            >
                                                📋
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-gray-500 text-xs">None (0x000...)</span>
                                    )}
                                </div>
                                {hasTokenApproval && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                                        ✅ Approved for this Token
                                    </span>
                                )}
                                {hasOtherApproval && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                                        ⚠️ Approved for Other Address
                                    </span>
                                )}
                            </div>

                            {/* Show Operator-Level Approval (isApprovedForAll) */}
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Operator Approval (isApprovedForAll):</div>
                                <div className="flex items-center gap-2">
                                    {hasOperatorApproval ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ✅ All NFTs Approved for Marketplace
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            ❌ Not Set
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Final Status */}
                            <div className="pt-2 border-t border-gray-200">
                                {isApprovedForMarketplace ? (
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-green-700">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="font-medium text-sm">Can be listed on marketplace</span>
                                        </div>
                                        {hasOperatorApproval && hasOtherApproval && (
                                            <p className="text-xs text-gray-600 ml-7">
                                                ℹ️ Token is approved via Operator Approval. Token-level approval for other marketplace is ignored.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-700">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <span className="font-medium text-sm">Approval required to list</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    }
                    subtitle={
                        isErc1155 && hasOperatorApproval
                            ? '✨ ERC1155 uses operator approval (isApprovedForAll)'
                            : hasOperatorApproval
                            ? '✨ All your NFTs from this collection are approved (recommended)'
                            : hasTokenApproval
                                ? '✨ Only this specific NFT is approved'
                                : 'Set approval to enable trading on marketplace'
                    }
                />

                <InfoRow
                    label="Token URI"
                    value={
                        contract.tokenURI ? (
                            <div className="flex items-center gap-2">
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs break-all">
                                    {contract.tokenURI.length > 60
                                        ? `${contract.tokenURI.slice(0, 60)}...`
                                        : contract.tokenURI}
                                </code>
                                {contract.tokenURI.startsWith('ipfs://') && (
                                    <a
                                        href={contract.tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-xs"
                                    >
                                        🔗 View
                                    </a>
                                )}
                            </div>
                        ) : 'Unknown'
                    }
                />
            </dl>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                    💡 This data is fetched directly from the blockchain and updated every sync cycle.
                </p>
            </div>
        </div>
    );
}
