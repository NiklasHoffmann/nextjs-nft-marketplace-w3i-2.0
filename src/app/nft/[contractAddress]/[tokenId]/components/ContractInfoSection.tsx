/**
 * ContractInfoSection - Displays blockchain contract data
 * 
 * Shows:
 * - Current owner and owner's NFT balance
 * - Approved address for marketplace
 * - Token URI
 * - Total supply
 */

interface ContractInfoSectionProps {
    contract: {
        contractName: string;
        contractSymbol: string;
        totalSupply: number | null;
        tokenURI: string | null;
        owner: string | null;
        ownerBalance: number | null;
        approved: string | null;
    };
    marketplaceAddress?: string;
}

function shortenAddress(address: string | null): string {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

export function ContractInfoSection({
    contract,
    marketplaceAddress = '0x6B6825FbDA1dF2C890086E6E1F31f5D573788224'
}: ContractInfoSectionProps) {
    const isApprovedForMarketplace = contract.approved?.toLowerCase() === marketplaceAddress.toLowerCase();
    const isNoApproval = contract.approved === '0x0000000000000000000000000000000000000000';
    const hasOtherApproval = contract.approved && !isApprovedForMarketplace && !isNoApproval;

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
                    subtitle={contract.ownerBalance !== null ? `Owns ${contract.ownerBalance} NFTs from this collection` : undefined}
                />

                <InfoRow
                    label="Approved Address"
                    value={
                        contract.approved ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
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
                                </div>
                                {isApprovedForMarketplace && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        ✅ Approved for Marketplace
                                    </span>
                                )}
                                {isNoApproval && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        ❌ Not Approved
                                    </span>
                                )}
                                {hasOtherApproval && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        ⚠️ Approved for Other Address
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <span className="text-gray-500">None</span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    ❌ Not Approved
                                </span>
                            </div>
                        )
                    }
                    subtitle={
                        isApprovedForMarketplace
                            ? 'NFT can be sold on this marketplace'
                            : isNoApproval || !contract.approved
                                ? 'NFT cannot be sold - approval required'
                                : 'Approved for different marketplace/address'
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
