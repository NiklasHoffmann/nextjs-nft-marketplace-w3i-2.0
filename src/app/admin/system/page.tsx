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
    images?: {
        totalNftMetadataDocs: number;
        docsWithImageSource: number;
        enrichedDocs: number;
        missingImageFieldsCount: number;
        enrichmentCoverage: number;
        blurPlaceholderCount: number;
        status: 'healthy' | 'backfill-needed';
        variantCoverage?: {
            docsWithAllVariants: number;
            docsWithAllCorrectVariantWidths: number;
            variants: {
                thumb: { expectedWidth: number; presentCount: number; correctWidthCount: number };
                small: { expectedWidth: number; presentCount: number; correctWidthCount: number };
                card: { expectedWidth: number; presentCount: number; correctWidthCount: number };
                detail: { expectedWidth: number; presentCount: number; correctWidthCount: number };
            };
        };
        diskCacheCoverage?: {
            cacheDirectory: string;
            totalCachedFiles: number;
            expectedVariantFilesTotal: number;
            presentVariantFilesTotal: number;
            coverage: number;
            status: 'warm' | 'partial';
            note?: string;
            variants: {
                thumb: { expectedWidth: number; expectedCount: number; presentOnDiskCount: number; missingOnDiskCount: number; coverage: number };
                small: { expectedWidth: number; expectedCount: number; presentOnDiskCount: number; missingOnDiskCount: number; coverage: number };
                card: { expectedWidth: number; expectedCount: number; presentOnDiskCount: number; missingOnDiskCount: number; coverage: number };
                detail: { expectedWidth: number; expectedCount: number; presentOnDiskCount: number; missingOnDiskCount: number; coverage: number };
            };
        };
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
    imageEnrichment?: {
        isEnabled: boolean;
        isRunning: boolean;
        intervalMs: number;
        nextRunAt: string | number | Date | null;
        runsTotal: number;
        runsWithWork: number;
        totalProcessed: number;
        totalUpdated: number;
        totalFailed: number;
        lastRunStartedAt: string | number | Date | null;
        lastRunCompletedAt: string | number | Date | null;
        lastRunDurationMs: number | null;
        lastRunCandidates: number;
        lastRunProcessed: number;
        lastRunUpdated: number;
        lastRunFailed: number;
        lastRunBatches: number;
        remainingCandidatesEstimate: number;
        lastRunDiskWarmed: number;
        lastErrorAt: string | number | Date | null;
        lastErrorMessage: string | null;
        progress: {
            currentBatchTotal: number;
            currentBatchProcessed: number;
            currentBatchUpdated: number;
            currentBatchFailed: number;
            percentage: number;
        };
    };
}

interface RequestCounterSnapshot {
    key: string;
    total: number;
    windowCount: number;
    windowStartedAt: number;
}

type RefreshMode = 'manual' | '30s' | '60s';

type AlertLevel = 'critical' | 'warning' | 'info';

interface AlertItem {
    level: AlertLevel;
    message: string;
}

type CounterSeverity = 'ok' | 'warning' | 'critical';

export default function AdminSystemDiagnostics() {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [requestCounters, setRequestCounters] = useState<RequestCounterSnapshot[]>([]);
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
            const [healthResponse, metricsResponse, countersResponse] = await Promise.all([
                fetch('/api/admin/system/health', { cache: 'no-store' }),
                fetch('/api/admin/system/metrics', { cache: 'no-store' }),
                fetch('/api/admin/system/request-counters', { cache: 'no-store' })
            ]);

            const [healthData, metricsData, countersData] = await Promise.all([
                healthResponse.json(),
                metricsResponse.json(),
                countersResponse.json()
            ]);

            if (healthResponse.ok) {
                setHealth(healthData.data);
            }
            if (metricsResponse.ok) {
                setMetrics(metricsData.data);
            }
            if (countersResponse.ok) {
                setRequestCounters(Array.isArray(countersData?.data?.counters) ? countersData.data.counters : []);
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

    const getImageStatusBadgeClass = (status?: 'healthy' | 'backfill-needed') => {
        if (status === 'healthy') return 'bg-emerald-100 text-emerald-700';
        return 'bg-amber-100 text-amber-700';
    };

    const getAgeMs = (value?: string | number | Date | null) => {
        if (!value) return null;
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        return Date.now() - date.getTime();
    };

    const getCounterSeverity = (counter: RequestCounterSnapshot): CounterSeverity => {
        const key = counter.key;
        const count = counter.windowCount;

        if (key.includes('.error')) {
            if (count >= 10) return 'critical';
            if (count >= 3) return 'warning';
            return 'ok';
        }

        if (key.includes('alchemy.discovery')) {
            if (count >= 120) return 'critical';
            if (count >= 60) return 'warning';
            return 'ok';
        }

        if (key === 'rpc.getLogs.transfer_query') {
            if (count >= 400) return 'critical';
            if (count >= 200) return 'warning';
            return 'ok';
        }

        if (key === 'rpc.readContract.ownerOf_verification') {
            if (count >= 1000) return 'critical';
            if (count >= 500) return 'warning';
            return 'ok';
        }

        if (count >= 250) return 'critical';
        if (count >= 100) return 'warning';
        return 'ok';
    };

    const getCounterSeverityClass = (severity: CounterSeverity) => {
        if (severity === 'critical') return 'bg-red-100 text-red-700';
        if (severity === 'warning') return 'bg-amber-100 text-amber-700';
        return 'bg-emerald-100 text-emerald-700';
    };

    const getCounterSeverityLabel = (severity: CounterSeverity) => {
        if (severity === 'critical') return 'CRITICAL';
        if (severity === 'warning') return 'WARNING';
        return 'OK';
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

        const imageEnrichment = metrics?.imageEnrichment;
        if (imageEnrichment?.isEnabled && !imageEnrichment.isRunning) {
            const ageMs = getAgeMs(imageEnrichment.lastRunCompletedAt);
            if (ageMs !== null && imageEnrichment.intervalMs > 0 && ageMs > imageEnrichment.intervalMs * 2) {
                items.push({ level: 'warning', message: 'Image enrichment has not run recently.' });
            }
        }
        if ((imageEnrichment?.lastRunFailed ?? 0) > 0) {
            items.push({ level: 'warning', message: `Image enrichment failures in last run: ${imageEnrichment?.lastRunFailed}.` });
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
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Image Enrichment Health</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getImageStatusBadgeClass(health?.images?.status)}`}>
                        {health?.images?.status || 'unknown'}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                        <div className="text-xs text-gray-500">Coverage</div>
                        <div className="text-base font-semibold text-gray-900">
                            {health?.images ? `${health.images.enrichmentCoverage}%` : '—'}
                        </div>
                    </div>
                    <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                        <div className="text-xs text-gray-500">Missing Fields</div>
                        <div className="text-base font-semibold text-gray-900">
                            {health?.images ? health.images.missingImageFieldsCount.toLocaleString() : '—'}
                        </div>
                    </div>
                    <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                        <div className="text-xs text-gray-500">All Variants Present</div>
                        <div className="text-base font-semibold text-gray-900">
                            {health?.images?.variantCoverage?.docsWithAllVariants?.toLocaleString() || '—'}
                        </div>
                    </div>
                    <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                        <div className="text-xs text-gray-500">All Variant Widths Correct</div>
                        <div className="text-base font-semibold text-gray-900">
                            {health?.images?.variantCoverage?.docsWithAllCorrectVariantWidths?.toLocaleString() || '—'}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-100">
                                <th className="py-2 pr-3 font-medium">Variant</th>
                                <th className="py-2 pr-3 font-medium">Expected Width</th>
                                <th className="py-2 pr-3 font-medium">Present</th>
                                <th className="py-2 font-medium">Correct Width</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-800">
                            {(['thumb', 'small', 'card', 'detail'] as const).map((variant) => {
                                const row = health?.images?.variantCoverage?.variants?.[variant];
                                return (
                                    <tr key={variant} className="border-b border-gray-50 last:border-b-0">
                                        <td className="py-2 pr-3 font-medium">{variant}</td>
                                        <td className="py-2 pr-3">{row ? `${row.expectedWidth}px` : '—'}</td>
                                        <td className="py-2 pr-3">{row ? row.presentCount.toLocaleString() : '—'}</td>
                                        <td className="py-2">{row ? row.correctWidthCount.toLocaleString() : '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-gray-900">Physical Disk Cache</h3>
                        <span className="text-xs text-gray-500">
                            {health?.images?.diskCacheCoverage
                                ? `${health.images.diskCacheCoverage.coverage}% warm`
                                : '—'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                            <div className="text-xs text-gray-500">Expected Files</div>
                            <div className="text-base font-semibold text-gray-900">
                                {health?.images?.diskCacheCoverage?.expectedVariantFilesTotal?.toLocaleString() || '—'}
                            </div>
                        </div>
                        <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                            <div className="text-xs text-gray-500">Present on Disk</div>
                            <div className="text-base font-semibold text-gray-900">
                                {health?.images?.diskCacheCoverage?.presentVariantFilesTotal?.toLocaleString() || '—'}
                            </div>
                        </div>
                        <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                            <div className="text-xs text-gray-500">Unique Cached Keys</div>
                            <div className="text-base font-semibold text-gray-900">
                                {health?.images?.diskCacheCoverage?.totalCachedFiles?.toLocaleString() || '—'}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-100">
                                    <th className="py-2 pr-3 font-medium">Variant</th>
                                    <th className="py-2 pr-3 font-medium">Expected</th>
                                    <th className="py-2 pr-3 font-medium">On Disk</th>
                                    <th className="py-2 pr-3 font-medium">Missing</th>
                                    <th className="py-2 font-medium">Coverage</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-800">
                                {(['thumb', 'small', 'card', 'detail'] as const).map((variant) => {
                                    const row = health?.images?.diskCacheCoverage?.variants?.[variant];
                                    return (
                                        <tr key={`disk-${variant}`} className="border-b border-gray-50 last:border-b-0">
                                            <td className="py-2 pr-3 font-medium">{variant}</td>
                                            <td className="py-2 pr-3">{row ? row.expectedCount.toLocaleString() : '—'}</td>
                                            <td className="py-2 pr-3">{row ? row.presentOnDiskCount.toLocaleString() : '—'}</td>
                                            <td className="py-2 pr-3">{row ? row.missingOnDiskCount.toLocaleString() : '—'}</td>
                                            <td className="py-2">{row ? `${row.coverage}%` : '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <p className="mt-3 text-xs text-gray-500">
                        {health?.images?.diskCacheCoverage?.note || 'Disk cache metrics unavailable.'}
                    </p>
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

                        <div className="pt-2 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Image Enrichment</span>
                                <span className="font-medium text-gray-900">
                                    {metrics?.imageEnrichment?.isEnabled
                                        ? (metrics?.imageEnrichment?.isRunning ? 'running' : 'idle')
                                        : 'disabled'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Progress (current batch)</span>
                                <span>
                                    {metrics?.imageEnrichment
                                        ? `${metrics.imageEnrichment.progress.currentBatchProcessed}/${metrics.imageEnrichment.progress.currentBatchTotal} (${metrics.imageEnrichment.progress.percentage}%)`
                                        : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Last Run</span>
                                <span>{formatDateTime(metrics?.imageEnrichment?.lastRunCompletedAt)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Next Run</span>
                                <span>{formatDateTime(metrics?.imageEnrichment?.nextRunAt)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Last Batch Updated</span>
                                <span>{metrics?.imageEnrichment?.lastRunUpdated?.toLocaleString() || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Last Run Batches</span>
                                <span>{metrics?.imageEnrichment?.lastRunBatches?.toLocaleString() || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Remaining (Estimate)</span>
                                <span>{metrics?.imageEnrichment?.remainingCandidatesEstimate?.toLocaleString() || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Disk Warmed (Last Run)</span>
                                <span>{metrics?.imageEnrichment?.lastRunDiskWarmed?.toLocaleString() || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Total Updated</span>
                                <span>{metrics?.imageEnrichment?.totalUpdated?.toLocaleString() || '—'}</span>
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

            <div className="bg-white border border-gray-200 rounded-lg p-6 mt-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">Alchemy/RPC Request Counters</h2>
                    <span className="text-xs text-gray-500">Rolling window: 10 min</span>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">OK</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">WARNING</span>
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">CRITICAL</span>
                    <span className="text-gray-400">Thresholds sind key-basiert (Alchemy, RPC, Errors).</span>
                </div>

                {requestCounters.length === 0 ? (
                    <p className="text-sm text-gray-500">Noch keine Counter-Daten vorhanden.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-100">
                                    <th className="py-2 pr-3 font-medium">Key</th>
                                    <th className="py-2 pr-3 font-medium">Status</th>
                                    <th className="py-2 pr-3 font-medium">Window (10m)</th>
                                    <th className="py-2 pr-3 font-medium">Total</th>
                                    <th className="py-2 font-medium">Window Start</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-800">
                                {requestCounters.map((counter) => {
                                    const severity = getCounterSeverity(counter);
                                    return (
                                    <tr key={counter.key} className="border-b border-gray-50 last:border-b-0">
                                        <td className="py-2 pr-3 font-medium">{counter.key}</td>
                                        <td className="py-2 pr-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getCounterSeverityClass(severity)}`}>
                                                {getCounterSeverityLabel(severity)}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getCounterSeverityClass(severity)}`}>
                                                {counter.windowCount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="py-2 pr-3">{counter.total.toLocaleString()}</td>
                                        <td className="py-2">{formatDateTime(counter.windowStartedAt)}</td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AdminPageShell>
    );
}
