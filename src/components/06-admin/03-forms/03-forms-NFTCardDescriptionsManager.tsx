"use client";

import React, { useCallback } from 'react';

interface NFTCardDescriptionsManagerProps {
    label: string;
    helpText: string;
    descriptions: string[];
    onChange: (descriptions: string[]) => void;
    maxDescriptions?: number;
    maxCharactersPerDescription?: number;
    currentInput?: string;
    onCurrentInputChange?: (input: string) => void;
}

const NFTCardDescriptionsManager: React.FC<NFTCardDescriptionsManagerProps> = ({
    label,
    helpText,
    descriptions,
    onChange,
    maxDescriptions = 2,
    maxCharactersPerDescription = 80,
    currentInput = '',
    onCurrentInputChange
}) => {
    // Add empty description directly like other managers do
    const handleAddDescription = useCallback(() => {
        const updatedDescriptions = [...descriptions, ''];
        onChange(updatedDescriptions);
    }, [descriptions, onChange]);

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
                    <div className="text-xs text-gray-500">
                        {activeDescriptions} von {descriptions.length} aktiv
                    </div>
                    <div className="text-xs text-gray-500">
                        {activeDescriptions} Beschreibungen gesamt
                    </div>
                </div>
            </div>

            {/* Existing Descriptions */}
            {descriptions.length > 0 && (
                <div className="space-y-3">
                    {descriptions.map((description, index) => (
                        <div key={index} className="relative">
                            <div className="flex items-start space-x-3">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => {
                                            const updatedDescriptions = [...descriptions];
                                            updatedDescriptions[index] = e.target.value;
                                            onChange(updatedDescriptions);
                                        }}
                                        maxLength={maxCharactersPerDescription}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        placeholder={`Beschreibung ${index + 1}`}
                                    />
                                    <div className="flex justify-between mt-1">
                                        <div className="text-xs text-gray-500">
                                            Position {index + 1} von {maxDescriptions}
                                        </div>
                                        <div className={`text-xs ${description.length > maxCharactersPerDescription * 0.8 ? 'text-red-600' : 'text-gray-500'}`}>
                                            {description.length}/{maxCharactersPerDescription} Zeichen
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const updatedDescriptions = descriptions.filter((_, i) => i !== index);
                                        onChange(updatedDescriptions);
                                    }}
                                    className="flex-shrink-0 text-red-600 hover:text-red-800 transition-colors duration-200 p-1"
                                    title="Beschreibung entfernen"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Description Button - exact pattern like other managers */}
            {canAddMore && (
                <div className="border-t pt-4">
                    <button
                        type='button'
                        onClick={handleAddDescription}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                    >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Beschreibung hinzufügen
                    </button>
                </div>
            )}

            {/* Validation Messages */}
            {descriptions.length >= maxDescriptions && (
                <div className="bg-yellow-50 p-3 rounded-md">
                    <div className="flex items-start space-x-2">
                        <svg className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
                        </svg>
                        <div className="text-sm text-yellow-800">
                            Maximale Anzahl von {maxDescriptions} Beschreibungen erreicht.
                        </div>
                    </div>
                </div>
            )}

            {/* Current Input Info - only show if there's a current input for submit pattern */}
            {currentInput && currentInput.trim() && (
                <div className="bg-blue-50 p-3 rounded-md">
                    <div className="flex items-start space-x-2">
                        <svg className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-800">
                            <strong>Aktuelle Eingabe:</strong> "{currentInput.trim()}" wird beim Submit mit allen anderen Daten gespeichert
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NFTCardDescriptionsManager;