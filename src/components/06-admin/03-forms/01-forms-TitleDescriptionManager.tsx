"use client";

/**
 * Title Description Manager
 * 
 * Enhanced description management with title-description pairs:
 * - 🏷️ Multiple titles with descriptions each
 * - ➕ Add/Remove title-description pairs
 * - 📝 Multiple descriptions per title
 * - 🔧 Dynamic editing and validation
 * - 📋 Live preview and organization
 */

import { useCallback } from "react";
import type {
    TitleDescriptionPair,
} from "@/types";

// Import the helper function
const createEmptyPair = (): TitleDescriptionPair => ({
    id: crypto.randomUUID(),
    title: '',
    descriptions: [''],
    createdAt: new Date(),
    updatedAt: new Date()
});

// Generic type for compatible description structures
type DescriptionStructure = {
    titleDescriptionPairs: TitleDescriptionPair[];
};

interface TitleDescriptionManagerProps {
    label: string;
    helpText: string;
    descriptions: DescriptionStructure;
    onChange: (descriptions: DescriptionStructure) => void;
    placeholderTitle?: string;
    placeholderDescription?: string;
}

export default function TitleDescriptionManager({
    label,
    helpText,
    descriptions,
    onChange,
    placeholderTitle = "z.B. 'Exklusive Features', 'Utility & Benefits', 'Roadmap Highlights'",
    placeholderDescription = "Beschreibung für diesen Titel"
}: TitleDescriptionManagerProps) {

    // Ensure descriptions has a proper structure
    const safeDescriptions: DescriptionStructure = descriptions || {
        titleDescriptionPairs: [createEmptyPair()]
    };

    const addTitleDescriptionPair = useCallback(() => {
        const newPair = createEmptyPair();
        const updated: DescriptionStructure = {
            ...safeDescriptions,
            titleDescriptionPairs: [...(safeDescriptions?.titleDescriptionPairs || []), newPair]
        };
        onChange(updated);
    }, [safeDescriptions, onChange]);

    const removeTitleDescriptionPair = useCallback((pairId: string) => {
        const currentPairs = safeDescriptions?.titleDescriptionPairs || [];
        if (currentPairs.length > 1) {
            const updated: DescriptionStructure = {
                ...safeDescriptions,
                titleDescriptionPairs: currentPairs.filter(pair => pair.id !== pairId)
            };
            onChange(updated);
        }
    }, [safeDescriptions, onChange]);

    const updatePairTitle = useCallback((pairId: string, title: string) => {
        const updated: DescriptionStructure = {
            ...safeDescriptions,
            titleDescriptionPairs: (safeDescriptions?.titleDescriptionPairs || []).map(pair =>
                pair.id === pairId
                    ? { ...pair, title, updatedAt: new Date() }
                    : pair
            )
        };
        onChange(updated);
    }, [safeDescriptions, onChange]);

    const addDescriptionToPair = useCallback((pairId: string) => {
        const updated: DescriptionStructure = {
            ...safeDescriptions,
            titleDescriptionPairs: (safeDescriptions?.titleDescriptionPairs || []).map(pair =>
                pair.id === pairId
                    ? { ...pair, descriptions: [...pair.descriptions, ''], updatedAt: new Date() }
                    : pair
            )
        };
        onChange(updated);
    }, [safeDescriptions, onChange]);

    const removeDescriptionFromPair = useCallback((pairId: string, descIndex: number) => {
        const updated: DescriptionStructure = {
            ...safeDescriptions,
            titleDescriptionPairs: (safeDescriptions?.titleDescriptionPairs || []).map(pair =>
                pair.id === pairId && pair.descriptions.length > 1
                    ? {
                        ...pair,
                        descriptions: pair.descriptions.filter((_, i) => i !== descIndex),
                        updatedAt: new Date()
                    }
                    : pair
            )
        };
        onChange(updated);
    }, [safeDescriptions, onChange]);

    const updateDescription = useCallback((pairId: string, descIndex: number, value: string) => {
        const updated: DescriptionStructure = {
            ...safeDescriptions,
            titleDescriptionPairs: (safeDescriptions?.titleDescriptionPairs || []).map(pair =>
                pair.id === pairId
                    ? {
                        ...pair,
                        descriptions: pair.descriptions.map((desc, i) => i === descIndex ? value : desc),
                        updatedAt: new Date()
                    }
                    : pair
            )
        };
        onChange(updated);
    }, [safeDescriptions, onChange]);

    // Calculate statistics with safety checks
    const titleDescriptionPairs = safeDescriptions?.titleDescriptionPairs || [];
    const totalPairs = titleDescriptionPairs.length;
    const activePairs = titleDescriptionPairs.filter((pair: TitleDescriptionPair) =>
        pair.title.trim().length > 0 && pair.descriptions.some((desc: string) => desc.trim().length > 0)
    ).length;
    const totalDescriptions = titleDescriptionPairs
        .reduce((sum: number, pair: TitleDescriptionPair) => sum + pair.descriptions.filter((desc: string) => desc.trim().length > 0).length, 0);

    return (
        <div className="space-y-6">
            {/* Header with Statistics */}
            <div className="flex items-center justify-between">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        {label}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                        {helpText}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-500">
                        {activePairs} von {totalPairs} Titel aktiv
                    </div>
                    <div className="text-xs text-gray-500">
                        {totalDescriptions} Beschreibungen gesamt
                    </div>
                </div>
            </div>

            {/* Title-Description Pairs */}
            <div className="space-y-6">
                {titleDescriptionPairs.map((pair: TitleDescriptionPair, pairIndex: number) => (
                    <div key={pair.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        {/* Pair Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-sm font-semibold text-blue-600">
                                        {pairIndex + 1}
                                    </span>
                                </div>
                                <h4 className="text-sm font-medium text-gray-700">
                                    Titel & Beschreibungen
                                </h4>
                            </div>
                            {titleDescriptionPairs.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeTitleDescriptionPair(pair.id)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                                    title="Titel-Beschreibungs-Paar entfernen"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Title Input */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                                Titel
                            </label>
                            <input
                                type="text"
                                value={pair.title}
                                onChange={(e) => updatePairTitle(pair.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                placeholder={placeholderTitle}
                            />
                        </div>

                        {/* Descriptions */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-medium text-gray-600">
                                    Beschreibungen
                                </label>
                                <span className="text-xs text-gray-500">
                                    {pair.descriptions.filter((desc: string) => desc.trim().length > 0).length} aktiv
                                </span>
                            </div>

                            {pair.descriptions.map((description: string, descIndex: number) => (
                                <div key={descIndex} className="flex gap-3 items-start">
                                    {/* Description Number */}
                                    <div className="flex-shrink-0 w-6 h-8 bg-green-100 rounded flex items-center justify-center">
                                        <span className="text-xs font-medium text-green-600">
                                            {descIndex + 1}
                                        </span>
                                    </div>

                                    {/* Description Input */}
                                    <div className="flex-1">
                                        <textarea
                                            value={description}
                                            onChange={(e) => updateDescription(pair.id, descIndex, e.target.value)}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white text-sm"
                                            placeholder={`${placeholderDescription} ${descIndex + 1} für "${pair.title || 'diesen Titel'}"`}
                                        />
                                        {description.trim().length > 0 && (
                                            <div className="mt-1 text-xs text-gray-400">
                                                {description.trim().length} Zeichen
                                            </div>
                                        )}
                                    </div>

                                    {/* Remove Description Button */}
                                    <div className="flex-shrink-0">
                                        {pair.descriptions.length > 1 ? (
                                            <button
                                                type="button"
                                                onClick={() => removeDescriptionFromPair(pair.id, descIndex)}
                                                className="w-8 h-8 bg-red-100 text-red-600 hover:bg-red-200 rounded flex items-center justify-center transition-colors"
                                                title="Beschreibung entfernen"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Add Description Button */}
                            <button
                                type="button"
                                onClick={() => addDescriptionToPair(pair.id)}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Beschreibung hinzufügen
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add New Title-Description Pair */}
            <div className="border-t pt-4">
                <button
                    type="button"
                    onClick={addTitleDescriptionPair}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Neuen Titel mit Beschreibungen hinzufügen
                </button>
            </div>

            {/* Preview */}
            {activePairs > 0 && (
                <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Preview der Struktur:</h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                        {titleDescriptionPairs
                            .filter((pair: TitleDescriptionPair) => pair.title.trim().length > 0 || pair.descriptions.some((desc: string) => desc.trim().length > 0))
                            .map((pair: TitleDescriptionPair, index: number) => (
                                <div key={pair.id} className="border-l-4 border-blue-500 pl-3">
                                    {pair.title.trim().length > 0 && (
                                        <h5 className="font-medium text-gray-900 text-sm mb-1">
                                            {pair.title}
                                        </h5>
                                    )}
                                    <div className="space-y-1">
                                        {pair.descriptions
                                            .filter((desc: string) => desc.trim().length > 0)
                                            .slice(0, 2)
                                            .map((desc: string, descIndex: number) => (
                                                <p key={descIndex} className="text-xs text-gray-600">
                                                    • {desc.trim()}
                                                </p>
                                            ))}
                                        {pair.descriptions.filter((desc: string) => desc.trim().length > 0).length > 2 && (
                                            <p className="text-xs text-gray-400">
                                                ... +{pair.descriptions.filter((desc: string) => desc.trim().length > 0).length - 2} weitere
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}