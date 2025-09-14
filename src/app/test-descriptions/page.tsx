// Test component to debug the NFTCardDescriptionsManager
"use client";

import React, { useState } from 'react';
import { NFTCardDescriptionsManager } from '@/components/06-admin';

export default function TestNFTCardDescriptions() {
    const [descriptions, setDescriptions] = useState<string[]>([]);

    console.log('Current descriptions:', descriptions);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Test NFT Card Descriptions</h1>
            <div className="max-w-4xl">
                <NFTCardDescriptionsManager
                    descriptions={descriptions}
                    onChange={(newDescriptions) => {
                        console.log('onChange called with:', newDescriptions);
                        setDescriptions(newDescriptions);
                    }}
                    maxDescriptions={3}
                    maxCharactersPerDescription={80}
                />
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-semibold mb-2">Current State:</h2>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(descriptions, null, 2)}
                </pre>
            </div>
        </div>
    );
}