/**
 * InvalidListingWarning - Shows warning when NFT listing is not tradeable
 * 
 * Displays reasons why a listing is invalid:
 * - owner_mismatch: NFT was transferred to new owner
 * - no_approval: No marketplace approval set
 */

interface InvalidListingWarningProps {
    isValid: boolean;
    invalidReasons: string[] | null;
    invalidatedAt: string | null;
    owner: string | null;
    seller: string | null;
}

export function InvalidListingWarning({
    isValid,
    invalidReasons,
    invalidatedAt,
    owner,
    seller
}: InvalidListingWarningProps) {
    if (isValid || !invalidReasons || invalidReasons.length === 0) {
        return null;
    }

    const hasOwnerMismatch = invalidReasons.includes('owner_mismatch');
    const hasNoApproval = invalidReasons.includes('no_approval');

    return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg mb-6">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                        ⚠️ This NFT is not currently tradeable
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                        <p className="mb-2">This listing cannot be purchased because:</p>
                        <ul className="list-disc list-inside space-y-1">
                            {hasOwnerMismatch && (
                                <li>
                                    <strong>Ownership changed:</strong> The NFT was transferred to a new owner.
                                    The listing data is outdated.
                                </li>
                            )}
                            {hasNoApproval && (
                                <li>
                                    <strong>No marketplace approval:</strong> The current owner has not approved
                                    the marketplace contract to transfer this NFT.
                                </li>
                            )}
                        </ul>

                        {hasOwnerMismatch && owner && seller && (
                            <div className="mt-3 text-xs bg-yellow-100 p-2 rounded">
                                <p><strong>Current Owner:</strong> <code className="text-xs">{owner}</code></p>
                                <p><strong>Listed by:</strong> <code className="text-xs">{seller}</code></p>
                            </div>
                        )}

                        {invalidatedAt && (
                            <p className="mt-2 text-xs text-yellow-600">
                                Detected: {new Date(invalidatedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
