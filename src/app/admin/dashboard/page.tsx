"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useChainId } from 'wagmi';
import { formatEther } from 'viem';

interface DashboardStats {
    totalNFTs: number;
    activeListings: number;
    totalVolume: number;
    totalUsers: number;
    totalSales: number;
    pendingListings: number;
    cancelledListings: number;
    recentSales: Array<{
        nftAddress: string;
        tokenId: string;
        price: string;
        seller: string;
        buyer: string;
        soldAt: string;
    }>;
}

interface SystemHealth {
    database: {
        status: string;
        latency: number;
    };
    subgraph: {
        status: 'synced' | 'delayed' | 'stale';
        minutesSinceLastSync: number;
        lastSyncAt: string | null;
    };
    contract: {
        isOwner: boolean;
        currentOwner: string;
        network: string;
    } | null;
    syncService: {
        status: string;
        recentUpdates: number;
    };
    marketplace: {
        pending: number;
        cancelled: number;
        stale: number;
    };
}

export default function AdminDashboard() {
    const [mounted, setMounted] = useState(false);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [healthLoading, setHealthLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { address, isConnected } = useAccount();
    const chainId = useChainId();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch dashboard stats
    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch('/api/admin/dashboard/stats');
                const data = await response.json();

                if (!response.ok) {
                    console.error('[Dashboard] API Error:', data);
                    throw new Error(data.error?.message || data.message || 'Failed to fetch stats');
                }

                setStats(data.data);
            } catch (err) {
                console.error('[Dashboard] Failed to fetch stats:', err);
                setError(err instanceof Error ? err.message : 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        }

        if (mounted) {
            fetchStats();
        }
    }, [mounted]);

    // Fetch system health
    useEffect(() => {
        async function fetchHealth() {
            try {
                setHealthLoading(true);
                const response = await fetch('/api/admin/system/health');
                const data = await response.json();

                if (response.ok) {
                    setHealth(data.data);
                }
            } catch (err) {
                console.error('[Dashboard] Failed to fetch health:', err);
            } finally {
                setHealthLoading(false);
            }
        }

        if (!mounted) return;

        fetchHealth();
        // Refresh health every 30 seconds
        const interval = setInterval(fetchHealth, 30000);
        return () => clearInterval(interval);
    }, [mounted]);

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const formatVolume = (volume: number) => {
        return volume.toFixed(4);
    };

    const getNetworkName = () => {
        if (!chainId) return 'Unknown';
        switch (chainId) {
            case 1: return 'Mainnet';
            case 11155111: return 'Sepolia';
            default: return `Chain ${chainId}`;
        }
    };

    const getStatusColor = (status: 'synced' | 'delayed' | 'stale' | 'no_activity' | 'active' | 'idle' | 'online' | string) => {
        switch (status) {
            case 'synced':
            case 'active':
            case 'online':
                return 'bg-green-100 text-green-700';
            case 'delayed':
            case 'idle':
            case 'no_activity':
                return 'bg-yellow-100 text-yellow-700';
            case 'stale':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const formatSyncTime = (minutes: number) => {
        if (minutes < 1) return '<1 min ago';
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

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

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                        <p className="text-gray-600">System-Übersicht, Aktivitäts-Logs und Performance-Metriken</p>
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm text-red-700">{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total NFTs */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Total NFTs</span>
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            {loading ? (
                                <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-gray-900">{stats?.totalNFTs.toLocaleString() || 0}</div>
                                    <div className="text-xs text-gray-500 mt-1">Alle bezogenen NFTs</div>
                                </>
                            )}
                        </div>

                        {/* Active Listings */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Active Listings</span>
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            {loading ? (
                                <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-gray-900">{stats?.activeListings.toLocaleString() || 0}</div>
                                    <div className="text-xs text-gray-500 mt-1">Aktuell gelistet</div>
                                </>
                            )}
                        </div>

                        {/* Total Volume */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Total Volume</span>
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            {loading ? (
                                <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-gray-900">{formatVolume(stats?.totalVolume || 0)} ETH</div>
                                    <div className="text-xs text-gray-500 mt-1">{stats?.totalSales || 0} Verkäufe</div>
                                </>
                            )}
                        </div>

                        {/* Total Users */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-600">Total Users</span>
                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            {loading ? (
                                <div className="h-8 bg-gray-200 animate-pulse rounded"></div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold text-gray-900">{stats?.totalUsers.toLocaleString() || 0}</div>
                                    <div className="text-xs text-gray-500 mt-1">Unique Wallets</div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* System Status */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
                            <div className="space-y-3">
                                {/* Core Services */}
                                <div className="pb-2 border-b border-gray-100">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Core Services</div>

                                    <div className="flex items-center justify-between py-1.5">
                                        <span className="text-sm text-gray-600">Blockchain Connection</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">{getNetworkName()}</span>
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${mounted && isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {mounted && isConnected ? 'Connected' : 'Disconnected'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between py-1.5">
                                        <span className="text-sm text-gray-600">Database</span>
                                        <div className="flex items-center gap-2">
                                            {health && (
                                                <span className="text-xs text-gray-400">{health.database.latency}ms</span>
                                            )}
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${healthLoading ? 'bg-gray-100 text-gray-700' : health ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {healthLoading ? 'Checking...' : health ? 'Online' : 'Error'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between py-1.5">
                                        <span className="text-sm text-gray-600">Subgraph Sync</span>
                                        <div className="flex items-center gap-2">
                                            {health?.subgraph && (
                                                <span className="text-xs text-gray-400">
                                                    {formatSyncTime(health.subgraph.minutesSinceLastSync)}
                                                </span>
                                            )}
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${healthLoading ? 'bg-gray-100 text-gray-700' : health ? getStatusColor(health.subgraph.status) : 'bg-gray-100 text-gray-700'}`}>
                                                {healthLoading ? 'Checking...' : health ? health.subgraph.status : 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Status */}
                                {health?.contract && (
                                    <div className="pb-2 border-b border-gray-100">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Admin Status</div>

                                        <div className="flex items-center justify-between py-1.5">
                                            <span className="text-sm text-gray-600">Contract Ownership</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">{formatAddress(health.contract.currentOwner)}</span>
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${address?.toLowerCase() === health.contract.currentOwner.toLowerCase() ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {address?.toLowerCase() === health.contract.currentOwner.toLowerCase() ? 'Owner' : 'Transferred'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Marketplace Health */}
                                <div className="pb-2 border-b border-gray-100">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Marketplace</div>

                                    <div className="flex items-center justify-between py-1.5">
                                        <span className="text-sm text-gray-600">Pending Listings</span>
                                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
                                            {health?.marketplace.pending ?? (loading ? '...' : stats?.pendingListings || 0)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between py-1.5">
                                        <span className="text-sm text-gray-600">Cancelled Listings</span>
                                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                            {health?.marketplace.cancelled ?? (loading ? '...' : stats?.cancelledListings || 0)}
                                        </span>
                                    </div>

                                    {health && health.marketplace.stale > 0 && (
                                        <div className="flex items-center justify-between py-1.5">
                                            <span className="text-sm text-gray-600">Stale Listings</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-400">&gt;30 days</span>
                                                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded">
                                                    {health.marketplace.stale}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Services */}
                                <div>
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Services</div>

                                    <div className="flex items-center justify-between py-1.5">
                                        <span className="text-sm text-gray-600">NFT Sync</span>
                                        <div className="flex items-center gap-2">
                                            {health?.syncService && (
                                                <span className="text-xs text-gray-400">{health.syncService.recentUpdates} recent</span>
                                            )}
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${healthLoading ? 'bg-gray-100 text-gray-700' : health ? getStatusColor(health.syncService.status) : 'bg-gray-100 text-gray-700'}`}>
                                                {healthLoading ? 'Checking...' : health ? health.syncService.status : 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Sales */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h2>
                            {loading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="h-12 bg-gray-200 animate-pulse rounded"></div>
                                    ))}
                                </div>
                            ) : stats && stats.recentSales.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.recentSales.map((sale, index) => (
                                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                    Token #{sale.tokenId}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {formatAddress(sale.buyer)}
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {formatVolume(parseFloat(sale.price))} ETH
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(sale.soldAt).toLocaleDateString('de-DE')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="text-sm text-gray-500">Keine Verkäufe bisher</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
