"use client";

import React from 'react';

interface ProjectLinkManagerProps {
    projectWebsite?: string;
    projectTwitter?: string;
    projectDiscord?: string;
    onChange: (updates: {
        projectWebsite?: string;
        projectTwitter?: string;
        projectDiscord?: string;
    }) => void;
}

const ProjectLinkManager: React.FC<ProjectLinkManagerProps> = ({
    projectWebsite,
    projectTwitter,
    projectDiscord,
    onChange
}) => {
    const handleInputChange = (field: string, value: string) => {
        onChange({ [field]: value });
    };

    return (
        <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Project Link Manager
            </h3>
            <div className="flex flex-row  gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Website
                    </label>
                    <input
                        type="url"
                        value={projectWebsite || ''}
                        onChange={(e) => handleInputChange('projectWebsite', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://project.com"
                    />
                </div>

                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Twitter
                    </label>
                    <input
                        type="url"
                        value={projectTwitter || ''}
                        onChange={(e) => handleInputChange('projectTwitter', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://twitter.com/project"
                    />
                </div>

                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Discord
                    </label>
                    <input
                        type="url"
                        value={projectDiscord || ''}
                        onChange={(e) => handleInputChange('projectDiscord', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://discord.gg/project"
                    />
                </div>
                <div className='flex-1'>
                    <label className="block text-sm font-medium text-gray-700 mb-2 invisible">
                        Project Instagram
                    </label>
                    <input
                        type="url"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                        placeholder="Coming Soon"
                    />
                </div>
            </div>
        </div>
    );
};

export default ProjectLinkManager;