"use client";

/**
 * Enhanced NFT Description Display
 * 
 * Displays NFT-specific descriptions in both legacy and enhanced formats:
 * - 📝 Legacy: Simple description list
 * - 🏷️ Enhanced: Title-description pairs with organized structure
 * - 🎨 Beautiful styling and responsive design
 * - ⚡ Fallback support for backward compatibility
 */

import { useState } from "react";
import type { NFTProjectDescriptions } from "@/types/05-features/03-nft-insights";

interface EnhancedNFTDescriptionDisplayProps {
    // Enhanced structure (preferred)
    specificDescriptions?: NFTProjectDescriptions;
    // Legacy support
    descriptions?: string[];
    description?: string;
    // Display options
    showTitle?: boolean;
    maxItemsPerTitle?: number;
    className?: string;
}

export default function EnhancedNFTDescriptionDisplay({
    specificDescriptions,
    descriptions,
    description,
    showTitle = true,
    maxItemsPerTitle = 3,
    className = ""
}: EnhancedNFTDescriptionDisplayProps) {
    const [expandedTitles, setExpandedTitles] = useState<Set<string>>(new Set());

    const toggleTitleExpansion = (titleId: string) => {
        const newExpanded = new Set(expandedTitles);
        if (newExpanded.has(titleId)) {
            newExpanded.delete(titleId);
        } else {
            newExpanded.add(titleId);
        }
        setExpandedTitles(newExpanded);
    };

    // Determine what to display
    const hasEnhancedStructure = specificDescriptions?.titleDescriptionPairs?.length ? specificDescriptions.titleDescriptionPairs.length > 0 : false;
    const hasLegacyDescriptions = descriptions?.length ? descriptions.length > 0 : false;
    const hasSingleDescription = description?.trim()?.length ? description.trim().length > 0 : false;

    // Return early if no content
    if (!hasEnhancedStructure && !hasLegacyDescriptions && !hasSingleDescription) {
        return null;
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {showTitle && (
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    NFT Details
                </h3>
            )}

            {/* Enhanced Structure Display */}
            {hasEnhancedStructure && specificDescriptions && (
                <div className="space-y-4">
                    {specificDescriptions.titleDescriptionPairs
                        .filter(pair => pair.title.trim().length > 0 || pair.descriptions.some(desc => desc.trim().length > 0))
                        .map((pair) => {
                            const validDescriptions = pair.descriptions.filter(desc => desc.trim().length > 0);
                            const isExpanded = expandedTitles.has(pair.id);
                            const shouldShowToggle = validDescriptions.length > maxItemsPerTitle;
                            const displayDescriptions = isExpanded ? validDescriptions : validDescriptions.slice(0, maxItemsPerTitle);

                            return (
                                <div key={pair.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    {/* Title */}
                                    {pair.title.trim().length > 0 && (
                                        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                            {pair.title}
                                        </h4>
                                    )}

                                    {/* Descriptions */}
                                    {validDescriptions.length > 0 && (
                                        <div className="space-y-2">
                                            {displayDescriptions.map((desc, index) => (
                                                <div key={index} className="flex items-start gap-2">
                                                    <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    <p className="text-sm text-gray-700 leading-relaxed">
                                                        {desc.trim()}
                                                    </p>
                                                </div>
                                            ))}

                                            {/* Toggle button for more descriptions */}
                                            {shouldShowToggle && (
                                                <button
                                                    onClick={() => toggleTitleExpansion(pair.id)}
                                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium mt-2"
                                                >
                                                    {isExpanded ? (
                                                        <>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                            </svg>
                                                            Weniger anzeigen
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                            {validDescriptions.length - maxItemsPerTitle} weitere anzeigen
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            )}

            {/* Legacy Structure Display (if no enhanced structure) */}
            {!hasEnhancedStructure && hasLegacyDescriptions && descriptions && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="space-y-2">
                        {descriptions.filter(desc => desc.trim().length > 0).map((desc, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {desc.trim()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Single Description Fallback */}
            {!hasEnhancedStructure && !hasLegacyDescriptions && hasSingleDescription && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <p className="text-sm text-gray-700 leading-relaxed">
                        {description}
                    </p>
                </div>
            )}

            {/* Enhanced Structure Indicator */}
            {hasEnhancedStructure && specificDescriptions && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Erweiterte Struktur mit {specificDescriptions.titleDescriptionPairs.length} Bereichen
                </div>
            )}
        </div>
    );
}