interface NFTAttribute {
    trait_type: string;
    value: string | number;
    display_type?: string;
    max_value?: number;
}

interface ProjectTabProps {
    nftAddress: string;
    tokenId: string;
    contractName?: string | null;
    collection?: string | null;
    contractSymbol?: string | null;
    tokenStandard: string;
    blockchain: string;
    totalSupply?: number | null;
    currentOwner?: string | null;
    creator?: string | null;
    seller: string;
    description?: string | null;
    rarityRank?: number | null;
    rarityScore?: number | null;
    attributes?: NFTAttribute[] | null;
}

export default function ProjectTab({
    nftAddress,
    tokenId,
    contractName,
    collection,
    contractSymbol,
    tokenStandard,
    blockchain,
    totalSupply,
    currentOwner,
    creator,
    seller,
    description,
    rarityRank,
    rarityScore,
    attributes
}: ProjectTabProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium text-gray-500">Contract Address</label>
                    <p className="text-sm font-mono text-gray-900 break-all">{nftAddress}</p>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-500">Token ID</label>
                    <p className="text-sm font-mono text-gray-900">{tokenId}</p>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-500">Collection Name</label>
                    <p className="text-sm text-gray-900">{contractName || collection || 'Unknown'}</p>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-500">Collection Symbol</label>
                    <p className="text-sm text-gray-900">{contractSymbol || 'N/A'}</p>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-500">Token Standard</label>
                    <p className="text-sm text-gray-900">{tokenStandard}</p>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-500">Blockchain</label>
                    <p className="text-sm text-gray-900">{blockchain}</p>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-500">Total Supply</label>
                    <p className="text-sm text-gray-900">{totalSupply?.toLocaleString() || 'Unknown'}</p>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-500">Current Owner</label>
                    <p className="text-sm font-mono text-gray-900 break-all">
                        {currentOwner ? `${currentOwner.slice(0, 6)}...${currentOwner.slice(-4)}` : 'Loading...'}
                    </p>
                </div>

                {creator && (
                    <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500">Creator</label>
                        <p className="text-sm font-mono text-gray-900 break-all">{creator}</p>
                    </div>
                )}

                <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Listed By</label>
                    <p className="text-sm font-mono text-gray-900 break-all">{seller}</p>
                </div>
            </div>

            {description && (
                <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{description}</p>
                </div>
            )}

            {/* Rarity Information */}
            {(rarityRank || rarityScore) && (
                <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-500">Rarity</label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                        {rarityRank && (
                            <div>
                                <p className="text-xs text-gray-500">Rank</p>
                                <p className="text-lg font-semibold text-purple-600">#{rarityRank}</p>
                            </div>
                        )}
                        {rarityScore && (
                            <div>
                                <p className="text-xs text-gray-500">Score</p>
                                <p className="text-lg font-semibold text-purple-600">{rarityScore}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Attributes */}
            {attributes && attributes.length > 0 && (
                <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-500 mb-3 block">Attributes</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {attributes.map((attr, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {attr.trait_type}
                                </div>
                                <div className="text-sm font-semibold text-gray-900 mt-1">
                                    {attr.value}
                                </div>
                                {attr.display_type && (
                                    <div className="text-xs text-gray-400 mt-1">
                                        {attr.display_type}
                                    </div>
                                )}
                                {attr.max_value && (
                                    <div className="text-xs text-gray-400">
                                        Max: {attr.max_value}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}