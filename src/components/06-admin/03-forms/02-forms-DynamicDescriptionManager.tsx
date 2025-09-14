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
    descriptions: string[];
    onChange: (descriptions: string[]) => void;
}

export default function DynamicDescriptionManager({
    descriptions,
    onChange
}: DynamicDescriptionManagerProps) {

    const addDescription = useCallback(() => {
        onChange([...descriptions, '']);
    }, [descriptions, onChange]);

    const removeDescription = useCallback((index: number) => {
        if (descriptions.length > 1) {
            onChange(descriptions.filter((_, i) => i !== index));
        }
    }, [descriptions, onChange]);

    const updateDescription = useCallback((index: number, value: string) => {
        const updated = [...descriptions];
        updated[index] = value;
        onChange(updated);
    }, [descriptions, onChange]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Descriptions
                </label>
                <span className="text-xs text-gray-500">
                    {descriptions.filter(desc => desc.trim().length > 0).length} aktiv
                </span>
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
                                placeholder={`Description ${index + 1} (z.B. "Premium access to exclusive events")`}
                            />
                            {description.trim().length > 0 && (
                                <div className="mt-1 text-xs text-gray-500">
                                    {description.trim().length} Zeichen
                                </div>
                            )}
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
            <div className="border-t pt-4">
                <button
                    type="button"
                    onClick={addDescription}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Description hinzufügen
                </button>
            </div>

            {/* Preview */}
            {descriptions.some(desc => desc.trim().length > 0) && (
                <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex flex-wrap gap-2">
                            {descriptions
                                .filter(desc => desc.trim().length > 0)
                                .slice(0, 2)
                                .map((desc, index) => (
                                    <div key={index} className="bg-white px-2 py-1 rounded text-xs text-gray-600 border">
                                        {desc.trim()}
                                    </div>
                                ))}
                            {descriptions.filter(desc => desc.trim().length > 0).length > 2 && (
                                <div className="bg-white px-2 py-1 rounded text-xs text-gray-500 border">
                                    +{descriptions.filter(desc => desc.trim().length > 0).length - 2} mehr
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}