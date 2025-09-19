"use client";

/**
 * Dynamic Description Manager
 * 
 * Features:
 * - ➕ Add Description Button
 * - ❌ Remove Description Button  
 * - 📝 Individual Text Inputs
 * - 🔢 Auto-numbering
 * - ✅ Validation & Preview
 */

import { useCallback } from "react";

interface DynamicDescriptionManagerProps {
    label: string;
    helpText: string;
    descriptions: string[];
    onChange: (descriptions: string[]) => void;
    maxDescriptions?: number;
    maxCharactersPerDescription?: number;
    placeholderText?: string;
}

export default function DynamicDescriptionManager({
    label = "Descriptions",
    helpText = "Füge Beschreibungen hinzu oder entferne sie",
    descriptions,
    onChange,
    maxDescriptions = 10,
    maxCharactersPerDescription = 200,
    placeholderText = "Beschreibung eingeben..."
}: DynamicDescriptionManagerProps) {

    const addDescription = useCallback(() => {
        if (descriptions.length < maxDescriptions) {
            onChange([...descriptions, '']);
        }
    }, [descriptions, onChange, maxDescriptions]);

    const removeDescription = useCallback((index: number) => {
        if (descriptions.length > 1) {
            onChange(descriptions.filter((_, i) => i !== index));
        }
    }, [descriptions, onChange]);

    const updateDescription = useCallback((index: number, value: string) => {
        if (value.length <= maxCharactersPerDescription) {
            const updated = [...descriptions];
            updated[index] = value;
            onChange(updated);
        }
    }, [descriptions, onChange, maxCharactersPerDescription]);

    const canAddMore = descriptions.length < maxDescriptions;
    const activeDescriptions = descriptions.filter(desc => desc.trim().length > 0).length;

    return (
        <div className="space-y-4">
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
                    <div className="text-sm text-gray-600">
                        {activeDescriptions} / {descriptions.length} aktiv
                    </div>
                    <div className="text-xs text-gray-500">
                        Max. {maxDescriptions} Descriptions
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {descriptions.map((description, index) => (
                    <div key={index} className="flex gap-3 items-start">
                        {/* Description Number */}
                        <div className="flex-shrink-0 w-8 h-10 bg-blue-100 rounded-md flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                                {index + 1}
                            </span>
                        </div>

                        {/* Description Input */}
                        <div className="flex-1">
                            <textarea
                                value={description}
                                onChange={(e) => updateDescription(index, e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder={placeholderText}
                                maxLength={maxCharactersPerDescription}
                            />
                            <div className="mt-1 flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                    Description {index + 1}
                                </div>
                                <div className={`text-xs ${(maxCharactersPerDescription - description.length) < 10
                                    ? 'text-red-600'
                                    : (maxCharactersPerDescription - description.length) < 20
                                        ? 'text-yellow-600'
                                        : 'text-gray-500'
                                    }`}>
                                    {maxCharactersPerDescription - description.length} Zeichen übrig
                                </div>
                            </div>
                        </div>

                        {/* Remove Button */}
                        <div className="flex-shrink-0">
                            {descriptions.length > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => removeDescription(index)}
                                    className="w-10 h-10 bg-red-100 text-red-600 hover:bg-red-200 rounded-md flex items-center justify-center transition-colors"
                                    title="Description entfernen"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Description Button */}
            {canAddMore && (
                <div className="border-t pt-4">
                    <button
                        type="button"
                        onClick={addDescription}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Beschreibung hinzufügen
                    </button>
                </div>
            )}

            {/* Limits Info */}
            {!canAddMore && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <div>
                            <p className="text-sm font-medium text-amber-800">
                                Maximum erreicht
                            </p>
                            <p className="text-xs text-amber-700">
                                Du hast die maximale Anzahl von {maxDescriptions} Descriptions erreicht. Entferne eine bestehende Description, um eine neue hinzuzufügen.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview */}
            {activeDescriptions > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Preview
                    </h4>
                    <div className="flex flex-wrap gap-1">
                        {descriptions
                            .filter(desc => desc.trim().length > 0)
                            .slice(0, 3)
                            .map((desc, index) => (
                                <div key={index} className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-white/20 text-xs text-gray-600">
                                    {desc.trim()}
                                </div>
                            ))}
                        {activeDescriptions > 3 && (
                            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-white/20 text-xs text-gray-500">
                                +{activeDescriptions - 3}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        So werden die aktiven Descriptions angezeigt
                    </p>
                </div>
            )}
        </div>
    );
}