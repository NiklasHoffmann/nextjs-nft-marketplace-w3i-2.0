"use client";

/**
 * NFT Database Selector Component
 * 
 * Ermöglicht Auswahl von NFTs aus der MongoDB Datenbank
 * Features:
 * - 🗄️ Lädt NFTs aus nft_metadata Collection
 * - 🔍 Suchfunktion nach Name, Contract, TokenID
 * - 📋 Dropdown mit NFT-Vorschau
 * - ✅ Automatisches Setzen von Contract + TokenID
 */

import { useState, useEffect, useMemo } from 'react';

interface NFT {
    contractAddress: string;
    tokenId: string;
    name?: string;
    image?: string;
}

interface NFTDatabaseSelectorProps {
    contractAddress: string;
    tokenId: string;
    onSelect: (contractAddress: string, tokenId: string) => void;
}

export default function NFTDatabaseSelector({
    contractAddress,
    tokenId,
    onSelect
}: NFTDatabaseSelectorProps) {
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // NFTs aus Datenbank laden
    useEffect(() => {
        async function loadNFTs() {
            try {
                console.log('🔍 Loading NFTs from database...');
                const res = await fetch('/api/admin/nfts/list', {
                    credentials: 'include' // Include session cookie
                });
                
                console.log('📡 API Response status:', res.status, res.ok);
                
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error('❌ API Error:', res.status, errorText);
                    return;
                }
                
                const result = await res.json();
                console.log('📦 NFT List API Response:', result);
                
                if (result.success && result.data?.nfts) {
                    console.log(`✅ Loaded ${result.data.nfts.length} NFTs from database`);
                    setNfts(result.data.nfts);
                } else {
                    console.warn('⚠️ Unexpected response structure:', result);
                    setNfts([]);
                }
            } catch (e) {
                console.error('❌ Error loading NFTs:', e);
                setNfts([]);
            } finally {
                setLoading(false);
            }
        }

        loadNFTs();
    }, []);

    // Gefilterte NFTs basierend auf Suchbegriff
    const filteredNFTs = useMemo(() => {
        if (!searchTerm) return nfts;

        const lower = searchTerm.toLowerCase();
        return nfts.filter(nft =>
            nft.name?.toLowerCase().includes(lower) ||
            nft.contractAddress.toLowerCase().includes(lower) ||
            nft.tokenId.includes(lower)
        );
    }, [nfts, searchTerm]);

    // Aktuell ausgewähltes NFT
    const selectedNFT = useMemo(() => {
        if (!contractAddress || !tokenId) return null;
        return nfts.find(
            nft => nft.contractAddress.toLowerCase() === contractAddress.toLowerCase()
                && nft.tokenId === tokenId
        );
    }, [nfts, contractAddress, tokenId]);

    const handleSelect = (nft: NFT) => {
        onSelect(nft.contractAddress, nft.tokenId);
        setShowDropdown(false);
        setSearchTerm('');
    };

    const handleClear = () => {
        onSelect('', '');
        setSearchTerm('');
    };

    return (
        <div className="space-y-4 border-t pt-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900">NFT aus Datenbank wählen</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Wähle ein NFT aus der Datenbank um dessen Insights zu bearbeiten
                </p>
            </div>

            {/* Aktuell ausgewähltes NFT */}
            {selectedNFT && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {selectedNFT.image && (
                                <img
                                    src={selectedNFT.image}
                                    alt={selectedNFT.name || 'NFT'}
                                    className="w-12 h-12 rounded object-cover"
                                />
                            )}
                            <div>
                                <p className="font-medium text-gray-900">
                                    {selectedNFT.name || `NFT #${selectedNFT.tokenId}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {selectedNFT.contractAddress.slice(0, 8)}...{selectedNFT.contractAddress.slice(-6)} #{selectedNFT.tokenId}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClear}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                            Auswahl aufheben
                        </button>
                    </div>
                </div>
            )}

            {/* Suchfeld */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    NFT suchen ({nfts.length} verfügbar)
                </label>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Nach Name, Contract oder TokenID suchen..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Dropdown mit NFT-Liste */}
                {showDropdown && !loading && filteredNFTs.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto">
                        {filteredNFTs.slice(0, 50).map((nft) => (
                            <button
                                key={`${nft.contractAddress}-${nft.tokenId}`}
                                onClick={() => handleSelect(nft)}
                                className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left border-b border-gray-100 last:border-b-0"
                            >
                                {nft.image && (
                                    <img
                                        src={nft.image}
                                        alt={nft.name || 'NFT'}
                                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                        {nft.name || `NFT #${nft.tokenId}`}
                                    </p>
                                    <p className="text-sm text-gray-600 truncate">
                                        {nft.contractAddress.slice(0, 8)}...{nft.contractAddress.slice(-6)} #{nft.tokenId}
                                    </p>
                                </div>
                            </button>
                        ))}
                        {filteredNFTs.length > 50 && (
                            <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
                                +{filteredNFTs.length - 50} weitere NFTs... Suche verfeinern
                            </div>
                        )}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center">
                        <p className="text-gray-600">Lade NFTs...</p>
                    </div>
                )}

                {/* No Results */}
                {showDropdown && !loading && searchTerm && filteredNFTs.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center">
                        <p className="text-gray-600">Keine NFTs gefunden</p>
                    </div>
                )}
            </div>

            {/* Schließen-Button für Dropdown */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    );
}
