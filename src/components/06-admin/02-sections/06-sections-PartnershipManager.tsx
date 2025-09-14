"use client";

import React from 'react';

interface PartnershipManagerProps {
    partnerships?: string[];
    partnershipDetails?: string;
    onChange: (updates: {
        partnerships?: string[];
        partnershipDetails?: string;
    }) => void;
}

const PartnershipManager: React.FC<PartnershipManagerProps> = ({
    partnerships,
    partnershipDetails,
    onChange
}) => {
    const handleInputChange = (field: string, value: string | string[]) => {
        onChange({ [field]: value });
    };

    return (
        <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Partnership Manager
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                Manage partnerships and collaborations for this project
            </p>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partnership Details
                </label>
                <textarea
                    value={partnershipDetails || ''}
                    onChange={(e) => handleInputChange('partnershipDetails', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Details zu Partnerschaften und Kooperationen..."
                />
                <p className="mt-1 text-xs text-gray-500">
                    Beschreibe wichtige Partnerschaften, Kooperationen oder strategische Allianzen
                </p>
            </div>
        </div>
    );
};

export default PartnershipManager;