"use client";

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useMarketplaceAdmin } from '@/hooks/marketplace/useMarketplaceAdmin';
import { useReadContract } from 'wagmi';
import marketplaceAbi from '@/constants/marketplace.abi.json';
import networkMapping from '@/constants/network.mapping.json';
import { isAddress } from 'viem';
import { hasAdminAccess } from '@/utils';
import Link from 'next/link';
import { AdminModeIndicator } from '@/components/admin/AdminModeIndicator';
import { MigrationBanner } from '@/components/admin/MigrationBanner';

export default function MarketplaceAdminPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [mounted, setMounted] = useState(false);

  // Get marketplace address for current chain
  const getMarketplaceAddress = (): string => {
    const chainIdStr = chainId?.toString() || '11155111'; // Default to Sepolia
    const mapping = networkMapping as Record<string, { NftMarketplace: string[] }>;
    return mapping[chainIdStr]?.NftMarketplace?.[0] || '';
  };

  const MARKETPLACE_ADDRESS = getMarketplaceAddress();

  // Admin functions
  const {
    setInnovationFee,
    addWhitelistedCollection,
    removeWhitelistedCollection,
    batchAddWhitelistedCollections,
    batchRemoveWhitelistedCollections,
    addBuyerWhitelistAddresses,
    removeBuyerWhitelistAddresses,
    cleanListing,
    isLoading,
    isSuccess,
    error,
    txHash
  } = useMarketplaceAdmin(MARKETPLACE_ADDRESS);

  // Form states
  const [newFee, setNewFee] = useState('2500'); // 2.5% default
  const [singleCollection, setSingleCollection] = useState('');
  const [batchCollections, setBatchCollections] = useState('');
  const [listingIdToClean, setListingIdToClean] = useState('');
  const [buyerWhitelistListingId, setBuyerWhitelistListingId] = useState('');
  const [buyerAddresses, setBuyerAddresses] = useState('');

  // Read current values
  const { data: currentFee } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: marketplaceAbi,
    functionName: 'getInnovationFee',
  });

  const { data: whitelistedCollections, refetch: refetchCollections } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: marketplaceAbi,
    functionName: 'getWhitelistedCollections',
  });

  const { data: contractOwner } = useReadContract({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: marketplaceAbi,
    functionName: 'getContractOwner',
  }) as { data: string | undefined };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isSuccess) {
      refetchCollections();
    }
  }, [isSuccess, refetchCollections]);

  if (!mounted) {
    return null;
  }

  const isAdmin = hasAdminAccess(address);
  const isOwner = contractOwner && address && (contractOwner as string).toLowerCase() === address.toLowerCase();

  const handleSetFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setInnovationFee(parseInt(newFee));
    } catch (err) {
      console.error('Failed to set fee:', err);
    }
  };

  const handleAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddress(singleCollection)) {
      console.error('❌ [Admin Page] Invalid collection address:', singleCollection);
      alert('Invalid address');
      return;
    }
    console.log('📄 [Admin Page] Initiating single collection add:', {
      collection: singleCollection,
      marketplace: MARKETPLACE_ADDRESS
    });
    try {
      await addWhitelistedCollection(singleCollection);
      console.log('✅ [Admin Page] Collection add initiated successfully');
      setSingleCollection('');
    } catch (err) {
      console.error('❌ [Admin Page] Failed to add collection:', err);
    }
  };

  const handleRemoveCollection = async (collectionAddress: string) => {
    console.log('🗑️ [Admin Page] Initiating collection removal:', {
      collection: collectionAddress,
      marketplace: MARKETPLACE_ADDRESS
    });
    try {
      await removeWhitelistedCollection(collectionAddress);
      console.log('✅ [Admin Page] Collection removal initiated successfully');
    } catch (err) {
      console.error('❌ [Admin Page] Failed to remove collection:', err);
    }
  };

  const handleBatchAddCollections = async (e: React.FormEvent) => {
    e.preventDefault();
    const addresses = batchCollections
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr && isAddress(addr));

    console.log('📦 [Admin Page] Processing batch add request:', {
      totalLines: batchCollections.split('\n').length,
      validAddresses: addresses.length,
      addresses
    });

    if (addresses.length === 0) {
      console.error('❌ [Admin Page] No valid addresses found in batch');
      alert('No valid addresses found');
      return;
    }

    console.log('🚀 [Admin Page] Initiating batch add for', addresses.length, 'collections');
    try {
      await batchAddWhitelistedCollections(addresses);
      console.log('✅ [Admin Page] Batch add initiated successfully');
      setBatchCollections('');
    } catch (err) {
      console.error('❌ [Admin Page] Failed to batch add collections:', err);
    }
  };

  const handleBatchRemoveCollections = async (e: React.FormEvent) => {
    e.preventDefault();
    const addresses = batchCollections
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr && isAddress(addr));

    console.log('📦 [Admin Page] Processing batch remove request:', {
      totalLines: batchCollections.split('\n').length,
      validAddresses: addresses.length,
      addresses
    });

    if (addresses.length === 0) {
      console.error('❌ [Admin Page] No valid addresses found in batch');
      alert('No valid addresses found');
      return;
    }

    console.log('🚀 [Admin Page] Initiating batch remove for', addresses.length, 'collections');
    try {
      await batchRemoveWhitelistedCollections(addresses);
      console.log('✅ [Admin Page] Batch remove initiated successfully');
      setBatchCollections('');
    } catch (err) {
      console.error('❌ [Admin Page] Failed to batch remove collections:', err);
    }
  };

  const handleCleanListing = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🧹 [Admin Page] Initiating listing cleanup:', {
      listingId: listingIdToClean,
      marketplace: MARKETPLACE_ADDRESS
    });
    try {
      await cleanListing(listingIdToClean);
      console.log('✅ [Admin Page] Clean listing initiated successfully');
      setListingIdToClean('');
    } catch (err) {
      console.error('❌ [Admin Page] Failed to clean listing:', err);
    }
  };

  const handleAddBuyerWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    const addresses = buyerAddresses
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr && isAddress(addr));

    console.log('👥 [Admin Page] Processing buyer whitelist add:', {
      listingId: buyerWhitelistListingId,
      totalLines: buyerAddresses.split('\n').length,
      validAddresses: addresses.length,
      addresses
    });

    if (addresses.length === 0) {
      console.error('❌ [Admin Page] No valid buyer addresses found');
      alert('No valid addresses found');
      return;
    }

    console.log('🚀 [Admin Page] Initiating buyer whitelist add for listing', buyerWhitelistListingId);
    try {
      await addBuyerWhitelistAddresses(buyerWhitelistListingId, addresses);
      console.log('✅ [Admin Page] Buyer whitelist add initiated successfully');
      setBuyerAddresses('');
    } catch (err) {
      console.error('❌ [Admin Page] Failed to add buyer whitelist:', err);
    }
  };

  const handleRemoveBuyerWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    const addresses = buyerAddresses
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr && isAddress(addr));

    console.log('👥 [Admin Page] Processing buyer whitelist removal:', {
      listingId: buyerWhitelistListingId,
      totalLines: buyerAddresses.split('\n').length,
      validAddresses: addresses.length,
      addresses
    });

    if (addresses.length === 0) {
      console.error('❌ [Admin Page] No valid buyer addresses found');
      alert('No valid addresses found');
      return;
    }

    console.log('🚀 [Admin Page] Initiating buyer whitelist removal for listing', buyerWhitelistListingId);
    try {
      await removeBuyerWhitelistAddresses(buyerWhitelistListingId, addresses);
      console.log('✅ [Admin Page] Buyer whitelist removal initiated successfully');
      setBuyerAddresses('');
    } catch (err) {
      console.error('❌ [Admin Page] Failed to remove buyer whitelist:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace Administration</h1>
              <p className="text-gray-600">Manage marketplace fees, whitelisted collections, and listing maintenance</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-yellow-800">Please connect your wallet to access admin functions.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace Administration</h1>
              <p className="text-gray-600">Manage marketplace fees, whitelisted collections, and listing maintenance</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800 font-semibold mb-2">Access Denied</p>
              <p className="text-red-700 text-sm mb-4">
                You do not have permission to access this page. Only authorized admin addresses can manage marketplace settings.
              </p>
              <div className="text-sm text-red-600 space-y-2">
                <p>Your address: <span className="font-mono">{address}</span></p>
                <p className="text-xs mt-2">
                  Allowed addresses: {process.env.NEXT_PUBLIC_INSIGHTS_ALLOWED_ADDRESSES || 'None configured'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Link
              href="/admin"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zurück zum Admin Panel
            </Link>
          </div>

          {/* Admin Mode Indicator */}
          <div className="mb-6">
            <AdminModeIndicator diamondAddress={MARKETPLACE_ADDRESS} />
          </div>

          {/* Migration Banner (Optional - uncomment when migration is planned) */}
          {/* <MigrationBanner 
            migrationDate={new Date('2024-06-01')} 
            showDismiss={true}
          /> */}

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Marketplace Administration</h1>
            <p className="text-gray-600">
              Manage marketplace fees, whitelisted collections, and listing maintenance
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${isOwner ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {isOwner ? '✓ Contract Owner' : '⚠ Admin (Not Owner)'}
              </div>
              <span className="text-xs text-gray-500">
                {isOwner ? 'Full access to all functions' : 'Transactions may fail if owner-only'}
              </span>
            </div>
          </div>

          {/* Owner Warning */}
          {!isOwner && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm text-amber-800 font-medium">You are not the contract owner</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Owner: <span className="font-mono">{contractOwner || 'Loading...'}</span><br />
                    You can test the UI, but blockchain transactions will fail unless you are the owner.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Governance Mode Hint */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-blue-800 font-medium mb-1">💡 Governance Mode Available</p>
                <p className="text-xs text-blue-600">
                  For critical changes requiring <strong>multi-admin approval</strong> (e.g., fee changes, major whitelisting),
                  use <Link href="/admin/multisig" className="underline font-semibold hover:text-blue-800">MultiSig Proposals</Link>.
                  This page executes changes <strong>immediately</strong> as contract owner.
                </p>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {isSuccess && txHash && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                Transaction successful!
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 underline hover:text-green-900"
                >
                  View on Etherscan
                </a>
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Innovation Fee Management */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Innovation Fee
              </h2>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Current Fee: <span className="font-mono font-semibold">
                    {currentFee ? `${Number(currentFee) / 1000}%` : 'Loading...'}
                  </span>
                </p>
              </div>
              <form onSubmit={handleSetFee}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Fee (denominator: 100,000)
                  </label>
                  <input
                    type="number"
                    value={newFee}
                    onChange={(e) => setNewFee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2500 = 2.5%"
                    min="0"
                    max="100000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current: {newFee} = {parseInt(newFee) / 1000}%
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Set Innovation Fee'}
                </button>
              </form>
            </div>

            {/* Add Single Collection */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Collection
              </h2>
              <form onSubmit={handleAddCollection}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collection Address
                  </label>
                  <input
                    type="text"
                    value={singleCollection}
                    onChange={(e) => setSingleCollection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                    placeholder="0x..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !singleCollection}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Add to Whitelist'}
                </button>
              </form>
            </div>

            {/* Batch Operations */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Batch Operations
              </h2>
              <form onSubmit={handleBatchAddCollections}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collection Addresses (one per line)
                  </label>
                  <textarea
                    value={batchCollections}
                    onChange={(e) => setBatchCollections(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    placeholder="0x1234...&#10;0x5678...&#10;0xabcd..."
                    rows={5}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {batchCollections.split('\n').filter(addr => addr.trim() && isAddress(addr.trim())).length} valid addresses
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isLoading || !batchCollections}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Processing...' : 'Batch Add Collections'}
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchRemoveCollections}
                    disabled={isLoading || !batchCollections}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Processing...' : 'Batch Remove Collections'}
                  </button>
                </div>
              </form>
            </div>

            {/* Clean Listing */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clean Listing
              </h2>
              <form onSubmit={handleCleanListing}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Listing ID
                  </label>
                  <input
                    type="text"
                    value={listingIdToClean}
                    onChange={(e) => setListingIdToClean(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter listing ID"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Remove invalid listings (e.g., NFT no longer owned by seller)
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !listingIdToClean}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Processing...' : 'Clean Listing'}
                </button>
              </form>
            </div>

            {/* Buyer Whitelist Management */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Buyer Whitelist
              </h2>
              <form onSubmit={handleAddBuyerWhitelist}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Listing ID
                  </label>
                  <input
                    type="text"
                    value={buyerWhitelistListingId}
                    onChange={(e) => setBuyerWhitelistListingId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter listing ID"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buyer Addresses (one per line)
                  </label>
                  <textarea
                    value={buyerAddresses}
                    onChange={(e) => setBuyerAddresses(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    placeholder="0x1234...&#10;0x5678...&#10;0xabcd..."
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {buyerAddresses.split('\n').filter(addr => addr.trim() && isAddress(addr.trim())).length} valid addresses
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isLoading || !buyerWhitelistListingId || !buyerAddresses}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Processing...' : 'Add Buyers'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveBuyerWhitelist}
                    disabled={isLoading || !buyerWhitelistListingId || !buyerAddresses}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Processing...' : 'Remove Buyers'}
                  </button>
                </div>
              </form>
            </div>

            {/* Whitelisted Collections List */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Whitelisted Collections
              </h2>
              <div className="max-h-96 overflow-y-auto">
                {!whitelistedCollections || (whitelistedCollections as string[]).length === 0 ? (
                  <p className="text-gray-500 text-sm">No whitelisted collections</p>
                ) : (
                  <div className="space-y-2">
                    {(whitelistedCollections as string[]).map((collection, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <span className="font-mono text-sm truncate flex-1">{collection}</span>
                        <button
                          onClick={() => handleRemoveCollection(collection)}
                          disabled={isLoading}
                          className="ml-3 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
