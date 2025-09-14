"use client";

import React, { useState, useCallback } from 'react';

interface NFTCardDescriptionsManagerProps {
    descriptions: string[];
    onChange: (descriptions: string[]) => void;
    maxDescriptions?: number;
    maxCharactersPerDescription?: number;
}

const NFTCardDescriptionsManager: React.FC<NFTCardDescriptionsManagerProps> = ({
    descriptions,
    onChange,
    maxDescriptions = 2,
    maxCharactersPerDescription = 80
}) => {
    const [newDescription, setNewDescription] = useState('');

    console.log('🎴 NFTCardDescriptionsManager rendered with:', {
        descriptions,
        descriptionsLength: descriptions.length,
        maxDescriptions,
        maxCharactersPerDescription
    });

    const handleAddDescription = useCallback(() => {
        console.log('🎴 handleAddDescription called with:', {
            newDescription: newDescription.trim(),
            currentDescriptions: descriptions,
            maxDescriptions,
            maxCharactersPerDescription
        });

        if (
            newDescription.trim() &&
            descriptions.length < maxDescriptions &&
            newDescription.trim().length <= maxCharactersPerDescription
        ) {
            const updatedDescriptions = [...descriptions, newDescription.trim()];
            console.log('🎴 Calling onChange with:', updatedDescriptions);
            onChange(updatedDescriptions);
            setNewDescription('');
        } else {
            console.log('🎴 handleAddDescription validation failed:', {
                hasText: !!newDescription.trim(),
                underLimit: descriptions.length < maxDescriptions,
                underCharLimit: newDescription.trim().length <= maxCharactersPerDescription
            });
        }
    }, [newDescription, descriptions, onChange, maxDescriptions, maxCharactersPerDescription]);

    const handleRemoveDescription = useCallback((index: number) => {
        const newDescriptions = descriptions.filter((_, i) => i !== index);
        console.log('🎴 Removing description at index', index, 'new array:', newDescriptions);
        onChange(newDescriptions);
    }, [descriptions, onChange]);

    const handleUpdateDescription = useCallback((index: number, value: string) => {
        if (value.length <= maxCharactersPerDescription) {
            const newDescriptions = descriptions.map((desc, i) =>
                i === index ? value : desc
            );
            console.log('🎴 Updating description at index', index, 'new array:', newDescriptions);
            onChange(newDescriptions);
        }
    }, [descriptions, onChange, maxCharactersPerDescription]);

    const canAddMore = descriptions.length < maxDescriptions;
    const charactersRemaining = maxCharactersPerDescription - newDescription.length;
    const isNewDescriptionValid = newDescription.trim().length > 0 && newDescription.length <= maxCharactersPerDescription;

    console.log('🎴 Button state:', {
        canAddMore,
        charactersRemaining,
        isNewDescriptionValid,
        newDescriptionLength: newDescription.length,
        newDescriptionTrimmed: newDescription.trim()
    });

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-purple-800">NFT Card Descriptions</h3>
                    <p className="text-sm text-purple-600">
                        Kurze Beschreibungen die direkt in der NFT Card angezeigt werden
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-600">
                        {descriptions.length} / {maxDescriptions} Descriptions
                    </div>
                    <div className="text-xs text-gray-500">
                        Max. {maxCharactersPerDescription} Zeichen pro Description
                    </div>
                </div>
            </div>

            {/* Existing Descriptions */}
            <div className="space-y-3">
                {descriptions.map((description, index) => (
                    <div key={index} className="border border-purple-200 rounded-lg p-3 bg-purple-50">
                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <textarea
                                    value={description}
                                    onChange={(e) => handleUpdateDescription(index, e.target.value)}
                                    className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    rows={2}
                                    placeholder="Description für NFT Card..."
                                />
                                <div className="mt-1 flex items-center justify-between">
                                    <div className="text-xs text-gray-500">
                                        Description #{index + 1}
                                    </div>
                                    <div className={`text-xs ${description.length > maxCharactersPerDescription * 0.9
                                        ? 'text-red-600'
                                        : description.length > maxCharactersPerDescription * 0.7
                                            ? 'text-yellow-600'
                                            : 'text-gray-500'
                                        }`}>
                                        {description.length} / {maxCharactersPerDescription}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveDescription(index)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
                                title="Description entfernen"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add New Description */}
            {canAddMore && (
                <div className="border border-dashed border-purple-300 rounded-lg p-4 bg-purple-50">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-purple-700 mb-2">
                                Neue Description hinzufügen
                            </label>
                            <textarea
                                value={newDescription}
                                onChange={(e) => {
                                    console.log('🎴 Textarea onChange:', e.target.value);
                                    setNewDescription(e.target.value);
                                }}
                                className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                rows={2}
                                placeholder="z.B. 'Access to multisignature wallet with 2/3 approvals required'"
                                maxLength={maxCharactersPerDescription}
                            />
                            <div className="mt-1 flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                    Diese Description wird in der NFT Card angezeigt
                                </div>
                                <div className={`text-xs ${charactersRemaining < 10
                                    ? 'text-red-600'
                                    : charactersRemaining < 20
                                        ? 'text-yellow-600'
                                        : 'text-gray-500'
                                    }`}>
                                    {charactersRemaining} Zeichen übrig
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('🎴 Button clicked!', {
                                    isNewDescriptionValid,
                                    newDescription: newDescription.trim(),
                                    event: e.type
                                });
                                handleAddDescription();
                            }}
                            disabled={!isNewDescriptionValid}
                            className={`w-full py-2 px-4 rounded-md transition-colors ${isNewDescriptionValid
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Description hinzufügen
                            </div>
                        </button>
                    </div>
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

            {/* Preview Box */}
            {descriptions.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Vorschau in NFT Card
                    </h4>
                    <div className="flex flex-wrap gap-1">
                        {descriptions.slice(0, 2).map((desc, index) => (
                            <div key={index} className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-white/20 text-xs text-gray-600">
                                {desc}
                            </div>
                        ))}
                        {descriptions.length > 2 && (
                            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-white/20 text-xs text-gray-500">
                                +{descriptions.length - 2}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        So werden die Descriptions in der NFT Card dargestellt (nur die ersten 2 werden angezeigt, weitere als "+X")
                    </p>
                </div>
            )}
        </div>
    );
};

export default NFTCardDescriptionsManager;