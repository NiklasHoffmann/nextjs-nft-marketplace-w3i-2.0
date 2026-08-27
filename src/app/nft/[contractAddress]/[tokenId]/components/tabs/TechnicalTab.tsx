import { truncateAddress } from '@/utils';
import { NFTAttribute } from '@/types/features/nft-detail';
import { RoyaltyInfo } from '@/types';
import { ContractInfoSection } from '@/app/nft/[contractAddress]/[tokenId]/components/ContractInfoSection';

type MetadataPair = {
    label: string;
    value: unknown;
};

const MAX_METADATA_RENDER_DEPTH = 4;

function isNonEmptyMetadataValue(value: unknown): boolean {
    if (value === null || value === undefined) {
        return false;
    }

    if (typeof value === 'string') {
        return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
        return value.length > 0;
    }

    if (typeof value === 'object') {
        return Object.keys(value).length > 0;
    }

    return true;
}

function toHumanReadableKey(key: string): string {
    return key
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^\w/, (char) => char.toUpperCase());
}

function isLikelyUrl(value: string): boolean {
    if (!value || value.length < 8) {
        return false;
    }

    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'ipfs:';
    } catch {
        return false;
    }
}

function tryStringify(value: unknown): string {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

function isTraitLikeObject(value: unknown): value is Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const obj = value as Record<string, unknown>;
    return (
        (typeof obj.trait_type === 'string' && obj.value !== undefined) ||
        (typeof obj.name === 'string' && obj.value !== undefined)
    );
}

function normalizeMetadataPairs(value: unknown): MetadataPair[] {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value
            .map((entry, index) => {
                if (isTraitLikeObject(entry)) {
                    const label = typeof entry.trait_type === 'string' ? entry.trait_type : String(entry.name);
                    return { label, value: entry.value };
                }

                if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
                    const obj = entry as Record<string, unknown>;
                    const label = typeof obj.key === 'string'
                        ? obj.key
                        : typeof obj.name === 'string'
                            ? obj.name
                            : `Item ${index + 1}`;
                    const entryValue = obj.value !== undefined ? obj.value : obj;
                    return { label, value: entryValue };
                }

                return { label: `Item ${index + 1}`, value: entry };
            })
            .filter((pair) => isNonEmptyMetadataValue(pair.value));
    }

    if (typeof value === 'object') {
        return Object.entries(value as Record<string, unknown>)
            .map(([label, entryValue]) => ({ label, value: entryValue }))
            .filter((pair) => isNonEmptyMetadataValue(pair.value));
    }

    return [];
}

function MetadataValueRenderer({ value, depth = 0 }: { value: unknown; depth?: number }) {
    if (!isNonEmptyMetadataValue(value)) {
        return <span className="text-sm text-gray-500">N/A</span>;
    }

    if (depth >= MAX_METADATA_RENDER_DEPTH) {
        return (
            <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all font-mono">
                {tryStringify(value)}
            </pre>
        );
    }

    if (typeof value === 'string') {
        if (isLikelyUrl(value)) {
            return (
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-700 hover:text-blue-800 underline break-all"
                >
                    {value}
                </a>
            );
        }

        return <span className="text-sm text-gray-900 break-all">{value}</span>;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return <span className="text-sm text-gray-900">{String(value)}</span>;
    }

    if (Array.isArray(value) || typeof value === 'object') {
        const pairs = normalizeMetadataPairs(value);

        if (pairs.length === 0) {
            return (
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all font-mono">
                    {tryStringify(value)}
                </pre>
            );
        }

        return (
            <div className="space-y-2">
                {pairs.map((pair, index) => (
                    <div key={`${pair.label}-${index}`} className="rounded-md border border-gray-200 bg-white p-3">
                        <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 break-all">
                            {toHumanReadableKey(pair.label)}
                        </div>
                        <MetadataValueRenderer value={pair.value} depth={depth + 1} />
                    </div>
                ))}
            </div>
        );
    }

    return <span className="text-sm text-gray-900">{String(value)}</span>;
}

const EXTRA_METADATA_EXCLUDED_KEYS = new Set([
    'name',
    'title',
    'description',
    'image',
    'image_url',
    'imageUrl',
    'imageOriginal',
    'images',
    'imageMeta',
    'blurDataURL',
    'attributes',
    'animationUrl',
    'animation_url',
    'externalUrl',
    'external_url',
    'background_color',
]);

interface TechnicalTabProps {
    contractAddress: string;
    tokenId: string;
    contractName?: string | null;
    contractSymbol?: string | null;
    tokenStandard: string;
    blockchain: string;
    totalSupply?: number | null;
    currentOwner?: string | null;
    creator?: string | null;
    attributes?: NFTAttribute[];
    supportsRoyalty?: boolean;
    royaltyInfo?: RoyaltyInfo | null;
    rarityRank?: number | null;
    rarityScore?: number | null;
    metadata?: Record<string, any> | null;
    // Enhanced contract fields
    ownerBalance?: number | null;
    ownershipBalances?: Record<string, number> | null;
    holderCount?: number | null;
    approved?: string | null;
    isApprovedForAll?: boolean;
    tokenURI?: string | null;
    isListed?: boolean;
    listingStatus?: string | null;
    listingSeller?: string | null;
    listingId?: string | null;
    connectedAddress?: string | null;
}

export default function TechnicalTab({ contractAddress,
    tokenId,
    contractName,
    contractSymbol,
    tokenStandard,
    blockchain,
    totalSupply,
    currentOwner,
    creator,
    attributes,
    supportsRoyalty,
    royaltyInfo,
    rarityRank,
    rarityScore,
    metadata,
    ownerBalance,
    ownershipBalances,
    holderCount,
    approved,
    isApprovedForAll,
    tokenURI,
    isListed,
    listingStatus,
    listingSeller,
    listingId,
    connectedAddress
}: TechnicalTabProps) {
    const additionalMetadataEntries = Object.entries(metadata || {})
        .filter(([key, value]) => {
            if (EXTRA_METADATA_EXCLUDED_KEYS.has(key)) {
                return false;
            }

            return isNonEmptyMetadataValue(value);
        })
        .sort(([a], [b]) => a.localeCompare(b));

    return (
        <div className="space-y-6">
            {/* Contract Information */}
            <ContractInfoSection
                contract={{
                    contractName: contractName || 'Unknown',
                    contractSymbol: contractSymbol || 'N/A',
                    totalSupply: totalSupply ?? null,
                    tokenURI: tokenURI ?? null,
                    owner: currentOwner ?? null,
                    ownerBalance: ownerBalance ?? null,
                    ownershipBalances: ownershipBalances ?? null,
                    holderCount: holderCount ?? null,
                    approved: approved ?? null
                }}
                tokenStandard={tokenStandard}
                isApprovedForAll={isApprovedForAll}
                marketplaceListing={{
                    isListed,
                    status: listingStatus,
                    seller: listingSeller,
                    listingId,
                    connectedAddress
                }}
            />

            {/* Basic NFT Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    NFT Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Contract Address</label>
                        <p className="text-sm font-mono text-gray-900 break-all bg-gray-50 rounded p-2 mt-1">
                            {contractAddress}
                        </p>
                        <button
                            onClick={() => navigator.clipboard.writeText(contractAddress)}
                            className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                        >
                            Copy Address
                        </button>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-500">Token ID</label>
                        <p className="text-sm font-mono text-gray-900 bg-gray-50 rounded p-2 mt-1">{tokenId}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-500">Token Standard</label>
                        <p className="text-sm text-gray-900 font-medium">{tokenStandard}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-500">Blockchain</label>
                        <p className="text-sm text-gray-900 font-medium">{blockchain}</p>
                    </div>
                </div>
            </div>

            {/* Contract Capabilities */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Contract Capabilities
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">Standard Functions</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Transfer</span>
                                <span className="flex items-center text-green-600">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Supported
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Approve</span>
                                <span className="flex items-center text-green-600">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Supported
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Metadata URI</span>
                                <span className="flex items-center text-green-600">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Supported
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-600">Owner Query</span>
                                <span className="flex items-center text-green-600">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Supported
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-md font-medium text-gray-900 mb-3">Extended Functions</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Royalty Info (EIP-2981)</span>
                                <span className={`flex items-center ${supportsRoyalty ? 'text-green-600' : 'text-gray-400'}`}>
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        {supportsRoyalty ? (
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        ) : (
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        )}
                                    </svg>
                                    {supportsRoyalty ? 'Supported' : 'Not Supported'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Collection Info</span>
                                <span className="flex items-center text-green-600">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Supported
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Total Supply</span>
                                <span className="flex items-center text-green-600">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Supported
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-600">Token Exists</span>
                                <span className="flex items-center text-green-600">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Supported
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Royalty Details */}
                {supportsRoyalty && royaltyInfo && (
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="text-md font-medium text-yellow-800 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            EIP-2981 Royalty Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-yellow-700">Royalty Percentage:</span>
                                <span className="text-sm font-medium text-yellow-900 ml-2">
                                    {royaltyInfo.percentage?.toFixed(2) || '0'}%
                                </span>
                            </div>
                            {royaltyInfo.receiver && (
                                <div>
                                    <span className="text-sm text-yellow-700">Recipient:</span>
                                    <span className="text-sm font-mono text-yellow-900 ml-2">
                                        {truncateAddress(royaltyInfo.receiver)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Rarity Information */}
            {(rarityRank || rarityScore) && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Rarity Analysis
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {rarityRank && (
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="text-3xl font-bold text-purple-600 mb-2">#{rarityRank}</div>
                                <div className="text-sm text-purple-800">Rarity Rank</div>
                                <div className="text-xs text-purple-600 mt-1">
                                    Out of {totalSupply?.toLocaleString() || 'Unknown'} total
                                </div>
                            </div>
                        )}

                        {rarityScore && (
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="text-3xl font-bold text-purple-600 mb-2">{rarityScore}</div>
                                <div className="text-sm text-purple-800">Rarity Score</div>
                                <div className="text-xs text-purple-600 mt-1">
                                    Based on trait rarity
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* All Attributes */}
            {attributes && attributes.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        All Attributes ({attributes.length})
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {attributes.map((attr, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                                    {attr.trait_type}
                                </div>
                                <div className="text-sm font-semibold text-gray-900 mb-1">
                                    {attr.value}
                                </div>
                                {attr.display_type && (
                                    <div className="text-xs text-gray-400">
                                        Display Type: {attr.display_type}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Additional Metadata (collection-specific fields) */}
            {additionalMetadataEntries.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m-2.599-1A3.98 3.98 0 017 14m10 0a3.98 3.98 0 01-2.401 1" />
                        </svg>
                        Extended Metadata ({additionalMetadataEntries.length})
                    </h3>

                    <div className="space-y-3">
                        {additionalMetadataEntries.map(([key, value], index) => (
                            <div key={`${key}-${index}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 break-all">
                                    {toHumanReadableKey(key)}
                                </div>
                                <MetadataValueRenderer value={value} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Additional Creator Information */}
            {creator && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Creator Information
                    </h3>

                    <div className="bg-orange-50 rounded-lg p-4">
                        <div>
                            <label className="text-sm font-medium text-orange-700">Creator Address</label>
                            <p className="text-sm font-mono text-orange-900 bg-white rounded p-2 mt-1">
                                {creator}
                            </p>
                            <button
                                onClick={() => navigator.clipboard.writeText(creator)}
                                className="text-xs text-orange-600 hover:text-orange-700 mt-1"
                            >
                                Copy Address
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
