"use client";

/**
 * Tags Manager Component
 * 
 * Features:
 * - 🏷️ Dynamic Tag Addition
 * - ❌ Tag Removal
 * - 📝 Auto-complete Suggestions
 * - ✅ Validation & Deduplication
 */

import { useState, useCallback } from "react";

interface TagsManagerProps {
    tags: string[];
    onChange: (tags: string[]) => void;
}

const SUGGESTED_TAGS = [
    'Premium', 'Exclusive', 'Limited', 'Rare', 'Utility', 'Access',
    'Staking', 'Rewards', 'Gaming', 'Metaverse', 'Art', 'Collectible',
    'Music', 'Sports', 'Fashion', 'Avatar', 'PFP', 'Membership',
    'VIP', 'Early Access', 'Whitelist', 'Community', 'Governance',
    'DeFi', 'Yield', 'NFT', 'Web3', 'Crypto', 'Blockchain', 'Digital',
    'Virtual', 'Augmented Reality', '3D', 'Interactive', 'Social',
    'Event', 'Ticket', 'Charity', 'Fundraising', 'Collaboration',
    'Partnership', 'Innovation', 'Technology', 'Creative', 'Design',
    'Fun', 'Entertainment', 'Lifestyle', 'Education', 'Learning',
    'Inspiration', 'Motivation', 'Wellness', 'Health', 'Fitness',
    'Travel', 'Adventure', 'Nature', 'Environment', 'Sustainability',
];

export default function TagsManager({ tags, onChange }: TagsManagerProps) {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredSuggestions = SUGGESTED_TAGS.filter(
        tag =>
            tag.toLowerCase().includes(inputValue.toLowerCase()) &&
            !tags.includes(tag) &&
            inputValue.length > 0
    );

    const addTag = useCallback((tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            onChange([...tags, trimmedTag]);
        }
        setInputValue('');
        setShowSuggestions(false);
    }, [tags, onChange]);

    const removeTag = useCallback((indexToRemove: number) => {
        onChange(tags.filter((_, index) => index !== indexToRemove));
    }, [tags, onChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputValue.trim()) {
                addTag(inputValue);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    }, [inputValue, addTag]);

    return (
        <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Tags
                </label>
                <span className="text-xs text-gray-500">
                    {tags.length} Tags
                </span>
            </div>

            {/* Current Tags */}
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                        <div
                            key={index}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                            <span>{tag}</span>
                            <button
                                type="button"
                                onClick={() => removeTag(index)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="Tag entfernen"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Tag Input */}
            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowSuggestions(e.target.value.length > 0);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(inputValue.length > 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tag hinzufügen (Enter drücken oder aus Vorschlägen wählen)"
                />

                {/* Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredSuggestions.slice(0, 10).map((suggestion, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => addTag(suggestion)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors text-sm"
                            >
                                <span className="font-medium">{suggestion}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Add Buttons */}
            <div className="space-y-2">
                <p className="text-xs text-gray-500">Beliebte Tags:</p>
                <div className="flex flex-wrap gap-2">
                    {SUGGESTED_TAGS.slice(0, 8).filter(tag => !tags.includes(tag)).map((tag, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                            + {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-500">
                💡 Tags helfen beim Kategorisieren und Filtern von NFTs. Verwende relevante Begriffe, die die Eigenschaften oder den Nutzen des NFTs beschreiben.
            </div>
        </div>
    );
}