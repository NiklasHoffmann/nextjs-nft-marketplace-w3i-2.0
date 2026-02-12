"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminPageShell } from '@/app/admin/components/shared/AdminPageShell';
import { devLog } from '@/utils';

interface SystemHealth {
    database: {
        status: string;
        latency: number;
    };
    subgraph: {
        status: 'synced' | 'delayed' | 'stale' | 'no_activity';
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

interface SystemMetrics {
    process: {
        uptimeSeconds: number;
        memoryRssMb: number;
    };
    database: {
        marketplaceItems: number;
        nftMetadata: number;
        nftStats: number;
    };
    syncService: {
        isRunning?: boolean;
        architecture?: string;
        eventListener?: {
            isActive?: boolean;
            isConnected?: boolean;
            eventsProcessed?: number;
            lastEventAt?: string | number | Date | null;
            reconnectAttempts?: number;
            keepaliveFailures?: number;
            activeSubscriptions?: string[];
            message?: string;
        };
        graphSync?: {
            version?: string;
            active?: boolean;
            itemsProcessed?: number;
            lastUpdate?: string | number | Date | null;
            mode?: string;
            currentInterval?: number;
            consecutiveErrors?: number;
            subgraphUrl?: string | null;
        };
        statsSync?: {
            isRunning?: boolean;
            itemsProcessed?: number;
            lastRun?: string | number | Date | null;
            intervalMs?: number;
            batchSize?: number;
            errorCount?: number;
            lastErrorAt?: string | number | Date | null;
        };
        insightsSync?: {
            isRunning?: boolean;
            itemsProcessed?: number;
            lastRun?: string | number | Date | null;
            intervalMs?: number;
            batchSize?: number;
            errorCount?: number;
            lastErrorAt?: string | number | Date | null;
        };
    };
}

type RefreshMode = 'manual' | '30s' | '60s';

type AlertLevel = 'critical' | 'warning' | 'info';

interface AlertItem {
    level: AlertLevel;
    message: string;
}

export default function AdminSystemDiagnostics() {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [refreshMode, setRefreshMode] = useState<RefreshMode>('manual');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

    const refreshIntervalMs = useMemo(() => {
        if (refreshMode === '30s') return 30_000;
        if (refreshMode === '60s') return 60_000;
        return 0;
    }, [refreshMode]);

    const fetchAll = useCallback(async () => {
        try {
            setIsRefreshing(true);
            const [healthResponse, metricsResponse] = await Promise.all([
                fetch('/api/admin/system/health', { cache: 'no-store' }),
                fetch('/api/admin/system/metrics', { cache: 'no-store' })
            ]);

            const [healthData, metricsData] = await Promise.all([
                healthResponse.json(),
                metricsResponse.json()
            ]);

            if (healthResponse.ok) {
                setHealth(healthData.data);
            }
            if (metricsResponse.ok) {
                setMetrics(metricsData.data);
            }

            setLastUpdatedAt(Date.now());
        } catch (err) {
            devLog.error('[Admin System] Failed to fetch diagnostics', err);
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        if (!refreshIntervalMs) return;
        const interval = window.setInterval(fetchAll, refreshIntervalMs);
        return () => window.clearInterval(interval);
    }, [refreshIntervalMs, fetchAll]);

    const formatUptime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours <= 0) return `${minutes} min`;
        if (minutes === 0) return `${hours} h`;
        return `${hours} h ${minutes} min`;
    };

    const formatSyncTime = (minutes: number) => {
        if (minutes < 1) return '<1 min ago';
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    const formatDateTime = (value?: string | number | Date | null) => {
        if (!value) return '—';
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleString('de-DE');
    };

    const formatInterval = (ms?: number) => {
        if (!ms) return '—';
        const minutes = Math.round(ms / 60000);
        if (minutes <= 1) return `${Math.round(ms / 1000)} s`;
        return `${minutes} min`;
    };

    const getAlertBadgeClass = (level: AlertLevel) => {
        switch (level) {
            case 'critical':
                return 'bg-red-100 text-red-700';
            case 'warning':
                return 'bg-yellow-100 text-yellow-700';
            case 'info':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getAgeMs = (value?: string | number | Date | null) => {
        if (!value) return null;
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return Date.now() - date.getTime();
    };

    const alerts = useMemo<AlertItem[]>(() => {
        const items: AlertItem[] = [];

        if (health?.subgraph.status === 'stale') {
            items.push({ level: 'critical', message: 'Subgraph status is stale.' });
        } else if (health?.subgraph.status === 'delayed') {
            items.push({ level: 'warning', message: 'Subgraph status is delayed.' });
        }

        if (health?.database.latency && health.database.latency > 1000) {
            items.push({ level: 'warning', message: `Database latency high (${health.database.latency} ms).` });
        }

        const eventListener = metrics?.syncService?.eventListener;
        if (eventListener?.isActive && eventListener.isConnected === false) {
            items.push({ level: 'critical', message: 'Event listener disconnected.' });
        }
        if ((eventListener?.keepaliveFailures ?? 0) > 0) {
            items.push({ level: 'warning', message: `Event listener keepalive failures: ${eventListener?.keepaliveFailures}.` });
        }

        const graphErrors = metrics?.syncService?.graphSync?.consecutiveErrors ?? 0;
        if (graphErrors >= 5) {
            items.push({ level: 'critical', message: `Graph sync consecutive errors: ${graphErrors}.` });
        } else if (graphErrors > 0) {
            items.push({ level: 'warning', message: `Graph sync consecutive errors: ${graphErrors}.` });
        }

        const statsSync = metrics?.syncService?.statsSync;
        if (statsSync?.errorCount && statsSync.errorCount > 0) {
            items.push({ level: 'warning', message: `Stats sync errors: ${statsSync.errorCount}.` });
        }
        if (statsSync?.isRunning) {
            const ageMs = getAgeMs(statsSync.lastRun);
            if (ageMs !== null && statsSync.intervalMs && ageMs > statsSync.intervalMs * 2) {
                items.push({ level: 'warning', message: 'Stats sync has not run recently.' });
            } else if (ageMs === null) {
                items.push({ level: 'warning', message: 'Stats sync has not reported a last run yet.' });
            }
        }

        const insightsSync = metrics?.syncService?.insightsSync;
        if (insightsSync?.errorCount && insightsSync.errorCount > 0) {
            items.push({ level: 'warning', message: `Insights sync errors: ${insightsSync.errorCount}.` });
        }
        if (insightsSync?.isRunning) {
            const ageMs = getAgeMs(insightsSync.lastRun);
            if (ageMs !== null && insightsSync.intervalMs && ageMs > insightsSync.intervalMs * 2) {
                items.push({ level: 'warning', message: 'Insights sync has not run recently.' });
            } else if (ageMs === null) {
                items.push({ level: 'warning', message: 'Insights sync has not reported a last run yet.' });
            }
        }

        return items;
    }, [health, metrics]);

    return (
        <AdminPageShell>
            <div className="mb-6">
                <Link
                    href="/admin"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Zurueck zum Admin Panel
                </Link>
            </div>

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">System Diagnostics</h1>
                    <p className="text-gray-600">Health Checks, Metrics und detailierte Systemdaten</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs text-gray-500">Refresh</label>
                    <select
                        value={refreshMode}
                        onChange={(event) => setRefreshMode(event.target.value as RefreshMode)}
                        className="border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-700"
                    >
                        <option value="manual">Manual</option>
                        <option value="30s">Alle 30s</option>
                        <option value="60s">Alle 60s</option>
                    </select>
                    <button
                        type="button"
                        onClick={fetchAll}
                        disabled={isRefreshing}
                        className="text-xs font-medium px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300 disabled:opacity-60"
                    >
                        {isRefreshing ? 'Lade...' : 'Refresh'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Health Status</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Database</span>
                            <span className="font-medium text-gray-900">
                                {health ? `${health.database.status} (${health.database.latency}ms)` : '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Subgraph</span>
                            <span className="font-medium text-gray-900">
                                {health ? `${health.subgraph.status} · ${formatSyncTime(health.subgraph.minutesSinceLastSync)}` : '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Sync Service</span>
                            <span className="font-medium text-gray-900">
                                {health ? `${health.syncService.status} (${health.syncService.recentUpdates} recent)` : '—'}
                            </span>
                        </div>
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Pending Listings</span>
                                <span className="font-medium text-gray-900">
                                    {health ? health.marketplace.pending.toLocaleString() : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Cancelled Listings</span>
                                <span className="font-medium text-gray-900">
                                    {health ? health.marketplace.cancelled.toLocaleString() : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Stale Listings</span>
                                <span className="font-medium text-gray-900">
                                    {health ? health.marketplace.stale.toLocaleString() : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">System Metrics</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Uptime</span>
                            <span className="font-medium text-gray-900">
                                {metrics ? formatUptime(metrics.process.uptimeSeconds) : '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Memory (RSS)</span>
                            <span className="font-medium text-gray-900">
                                {metrics ? `${metrics.process.memoryRssMb} MB` : '—'}
                            </span>
                        </div>
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Marketplace Items</span>
                                <span className="font-medium text-gray-900">
                                    {metrics ? metrics.database.marketplaceItems.toLocaleString() : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">NFT Metadata</span>
                                <span className="font-medium text-gray-900">
                                    {metrics ? metrics.database.nftMetadata.toLocaleString() : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">NFT Stats</span>
                                <span className="font-medium text-gray-900">
                                    {metrics ? metrics.database.nftStats.toLocaleString() : '—'}
                                </span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Sync: {metrics?.syncService?.isRunning ? 'running' : 'stopped'}</span>
                                <span>
                                    {lastUpdatedAt
                                        ? new Date(lastUpdatedAt).toLocaleTimeString('de-DE')
                                        : '—'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Alerts</h2>
                {alerts.length === 0 ? (
                    <p className="text-sm text-gray-500">Keine Alerts. Alle Services sehen stabil aus.</p>
                ) : (
                    <div className="space-y-2">
                        {alerts.map((alert, index) => (
                            <div key={`${alert.level}-${index}`} className="flex items-center gap-3 text-sm">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getAlertBadgeClass(alert.level)}`}>
                                    {alert.level.toUpperCase()}
                                </span>
                                <span className="text-gray-700">{alert.message}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Marketplace Sync</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Architecture</span>
                            <span className="font-medium text-gray-900">
                                {metrics?.syncService?.architecture || '—'}
                            </span>
                        </div>
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Graph Sync</span>
                                <span className="font-medium text-gray-900">
                                    {metrics?.syncService?.graphSync?.active ? 'active' : 'idle'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Last Update</span>
                                <span>{formatDateTime(metrics?.syncService?.graphSync?.lastUpdate)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Items Processed</span>
                                <span>{metrics?.syncService?.graphSync?.itemsProcessed?.toLocaleString() || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Consecutive Errors</span>
                                <span>{metrics?.syncService?.graphSync?.consecutiveErrors ?? '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Polling Interval</span>
                                <span>{formatInterval(metrics?.syncService?.graphSync?.currentInterval)}</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Stats Sync</span>
                                <span className="font-medium text-gray-900">
                                    {metrics?.syncService?.statsSync?.isRunning ? 'running' : 'stopped'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Last Run</span>
                                <span>{formatDateTime(metrics?.syncService?.statsSync?.lastRun)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Items Processed</span>
                                <span>{metrics?.syncService?.statsSync?.itemsProcessed?.toLocaleString() || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Error Count</span>
                                <span>{metrics?.syncService?.statsSync?.errorCount ?? '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Last Error</span>
                                <span>{formatDateTime(metrics?.syncService?.statsSync?.lastErrorAt)}</span>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Insights Sync</span>
                                <span className="font-medium text-gray-900">
                                    {metrics?.syncService?.insightsSync?.isRunning ? 'running' : 'stopped'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Last Run</span>
                                <span>{formatDateTime(metrics?.syncService?.insightsSync?.lastRun)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Items Processed</span>
                                <span>{metrics?.syncService?.insightsSync?.itemsProcessed?.toLocaleString() || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Error Count</span>
                                <span>{metrics?.syncService?.insightsSync?.errorCount ?? '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Last Error</span>
                                <span>{formatDateTime(metrics?.syncService?.insightsSync?.lastErrorAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Listener</h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Connection</span>
                            <span className="font-medium text-gray-900">
                                {metrics?.syncService?.eventListener?.isConnected ? 'connected' : 'disconnected'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Active</span>
                            <span className="font-medium text-gray-900">
                                {metrics?.syncService?.eventListener?.isActive ? 'active' : 'inactive'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Events Processed</span>
                            <span>{metrics?.syncService?.eventListener?.eventsProcessed?.toLocaleString() || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Last Event</span>
                            <span>{formatDateTime(metrics?.syncService?.eventListener?.lastEventAt)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Reconnect Attempts</span>
                            <span>{metrics?.syncService?.eventListener?.reconnectAttempts ?? '—'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Keepalive Failures</span>
                            <span>{metrics?.syncService?.eventListener?.keepaliveFailures ?? '—'}</span>
                        </div>
                        <div className="pt-2 border-t border-gray-100 text-xs text-gray-500">
                            <div className="mb-1">Subscriptions</div>
                            <div className="flex flex-wrap gap-2">
                                {(metrics?.syncService?.eventListener?.activeSubscriptions || []).length > 0
                                    ? metrics?.syncService?.eventListener?.activeSubscriptions?.map((eventName) => (
                                        <span
                                            key={eventName}
                                            className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                                        >
                                            {eventName}
                                        </span>
                                    ))
                                    : '—'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Health JSON</h2>
                    <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer select-none">Raw payload</summary>
                        <pre className="mt-3 bg-gray-50 border border-gray-100 rounded-md p-3 overflow-auto">
{JSON.stringify(health, null, 2)}
                        </pre>
                    </details>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Metrics JSON</h2>
                    <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer select-none">Raw payload</summary>
                        <pre className="mt-3 bg-gray-50 border border-gray-100 rounded-md p-3 overflow-auto">
{JSON.stringify(metrics, null, 2)}
                        </pre>
                    </details>
                </div>
            </div>
        </AdminPageShell>
    );
}
