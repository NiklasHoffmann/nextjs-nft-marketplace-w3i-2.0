"use client";

import React from 'react';

interface BasicInfoManagerProps {
    customTitle: string;
    category: string;
    onCustomTitleChange: (title: string) => void;
    onCategoryChange: (category: string) => void;
}

const BasicInfoManager: React.FC<BasicInfoManagerProps> = ({
    customTitle,
    category,
    onCustomTitleChange,
    onCategoryChange,
}) => {
    return (
        <div className="space-y-6 border-t pt-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Basic Information
                    </h3>
                    <p className="text-sm text-blue-700">
                        Optional details for this NFT
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Title
                    </label>
                    <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => onCustomTitleChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="z.B. Premium Access NFT"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                    </label>
                    <select
                        value={category}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select Category</option>
                        <option value="Art">Art</option>
                        <option value="Gaming">Gaming</option>
                        <option value="Music">Music</option>
                        <option value="Sports">Sports</option>
                        <option value="Collectibles">Collectibles</option>
                        <option value="Utility">Utility</option>
                        <option value="Membership">Membership</option>
                        <option value="Virtual Real Estate">Virtual Real Estate</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default BasicInfoManager;