/**
 * NFTStatsContext - EINFACHE VERSION MIT GETEILTEM CACHE
 * 
 * Problem gelöst: Mehrere Komponenten nutzen den Hook für das gleiche NFT.
 * Wenn eine Komponente liked, müssen alle anderen davon erfahren.
 * 
 * Lösung: 
 * 1. Globaler Cache für Stats (außerhalb React)
 * 2. Einfaches Event-System: Bei Update → alle Listener benachrichtigen
 * 3. Listener registrieren sich beim Mount, deregistrieren beim Unmount
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';

// ===== TYPES =====
export interface NFTStats {
    viewCount: number;
    likeCount: number;
    watchlistCount: number;
    ratingCount: number;
    averageRating: number;
}

export interface UserInteractionState {
    isFavorited: boolean;
    isWatchlisted: boolean;
    userRating: number | null;
}

// ===== GLOBALER CACHE (außerhalb React, aber einfach) =====
const statsCache = new Map<string, NFTStats>();
const interactionsCache = new Map<string, UserInteractionState>();
const listeners = new Map<string, Set<() => void>>();

// Cache-Timestamps: Daten sind 60 Sekunden gültig (aligned with TheGraph polling)
const statsCacheTimestamps = new Map<string, number>();
const interactionsCacheTimestamps = new Map<string, number>();
const CACHE_TTL = 60000; // 60 seconds

// Request Queue für Batch Loading (verhindert Rate Limits)
const pendingStatsRequests = new Map<string, Promise<void>>();
const pendingInteractionsRequests = new Map<string, Promise<void>>();

function isCacheValid(key: string, timestampMap: Map<string, number>): boolean {
    const timestamp = timestampMap.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_TTL;
}

function getCacheKey(contractAddress: string, tokenId: string, userAddress?: string) {
    return userAddress
        ? `${contractAddress.toLowerCase()}-${tokenId}-${userAddress.toLowerCase()}`
        : `${contractAddress.toLowerCase()}-${tokenId}`;
}

function getStatsKey(contractAddress: string, tokenId: string) {
    return `${contractAddress.toLowerCase()}-${tokenId}`;
}

function notifyListeners(key: string) {
    const keyListeners = listeners.get(key);
    if (keyListeners) {
        keyListeners.forEach(listener => listener());
    }
}

function subscribe(key: string, listener: () => void) {
    if (!listeners.has(key)) {
        listeners.set(key, new Set());
    }
    listeners.get(key)!.add(listener);
    return () => {
        listeners.get(key)?.delete(listener);
    };
}

// ===== CONTEXT (nur für Provider-Check) =====
const NFTStatsContext = createContext<boolean>(false);

export function NFTStatsProvider({ children }: { children: ReactNode }) {
    return (
        <NFTStatsContext.Provider value={true}>
            {children}
        </NFTStatsContext.Provider>
    );
}

// ===== DER EINZIGE HOOK =====
export function useNFTStats(contractAddress: string, tokenId: string, userAddress?: string) {
    const statsKey = getStatsKey(contractAddress, tokenId);
    const interactionsKey = userAddress ? getCacheKey(contractAddress, tokenId, userAddress) : null;

    // Trigger für Re-Renders wenn Cache sich ändert
    const [, forceUpdate] = useState(0);
    const [loading, setLoading] = useState(true);

    // Subscribe to cache updates
    useEffect(() => {
        if (!contractAddress || !tokenId) return;

        const unsubStats = subscribe(statsKey, () => forceUpdate(v => v + 1));
        const unsubInteractions = interactionsKey
            ? subscribe(interactionsKey, () => forceUpdate(v => v + 1))
            : undefined;

        return () => {
            unsubStats();
            unsubInteractions?.();
        };
    }, [statsKey, interactionsKey, contractAddress, tokenId]);

    // Helper: Load stats with request deduplication
    const loadStats = useCallback(async () => {
        // Check if request is already pending
        if (pendingStatsRequests.has(statsKey)) {
            await pendingStatsRequests.get(statsKey);
            return;
        }

        const requestPromise = (async () => {
            try {
                const res = await fetch(`/api/nft/stats?contractAddress=${contractAddress}&tokenId=${tokenId}`);
                if (res.ok) {
                    const result = await res.json();
                    const data = result.data || result;
                    const newStats: NFTStats = {
                        viewCount: data.viewCount || 0,
                        likeCount: data.likeCount || 0,
                        watchlistCount: data.watchlistCount || 0,
                        ratingCount: data.ratingCount || 0,
                        averageRating: data.averageRating || 0
                    };
                    statsCache.set(statsKey, newStats);
                    statsCacheTimestamps.set(statsKey, Date.now());
                    notifyListeners(statsKey);
                } else {
                    // Bei Error: Setze Default-Werte damit NFT trotzdem angezeigt wird
                    console.warn(`Stats API error ${res.status} for ${contractAddress}:${tokenId}`);
                    const defaultStats: NFTStats = {
                        viewCount: 0,
                        likeCount: 0,
                        watchlistCount: 0,
                        ratingCount: 0,
                        averageRating: 0
                    };
                    statsCache.set(statsKey, defaultStats);
                    statsCacheTimestamps.set(statsKey, Date.now());
                    notifyListeners(statsKey);
                }
            } catch (e) {
                // Bei Netzwerk-Error: Setze Default-Werte damit NFT trotzdem angezeigt wird
                console.error('Error loading stats:', e);
                const defaultStats: NFTStats = {
                    viewCount: 0,
                    likeCount: 0,
                    watchlistCount: 0,
                    ratingCount: 0,
                    averageRating: 0
                };
                statsCache.set(statsKey, defaultStats);
                statsCacheTimestamps.set(statsKey, Date.now());
                notifyListeners(statsKey);
            } finally {
                // WICHTIG: Promise IMMER aus Queue entfernen, auch bei Error
                pendingStatsRequests.delete(statsKey);
            }
        })();

        pendingStatsRequests.set(statsKey, requestPromise);
        await requestPromise;
    }, [contractAddress, tokenId, statsKey]);

    // Helper: Load interactions with request deduplication
    const loadInteractions = useCallback(async () => {
        if (!userAddress || !interactionsKey) return;

        // Check if request is already pending
        if (pendingInteractionsRequests.has(interactionsKey)) {
            await pendingInteractionsRequests.get(interactionsKey);
            return;
        }

        const requestPromise = (async () => {
            try {
                const res = await fetch(`/api/user/interactions?contractAddress=${contractAddress}&tokenId=${tokenId}&userId=${userAddress}`, {
                    headers: {
                        'x-wallet-address': userAddress // Add wallet address to header for auth
                    }
                });
                if (res.ok) {
                    const result = await res.json();
                    const data = result.data || result;
                    const newInteractions: UserInteractionState = {
                        isFavorited: data.isFavorite || false,
                        isWatchlisted: data.isWatchlisted || false,
                        userRating: data.rating ?? null
                    };
                    interactionsCache.set(interactionsKey, newInteractions);
                    interactionsCacheTimestamps.set(interactionsKey, Date.now());
                    notifyListeners(interactionsKey);
                } else {
                    // Bei Error: Setze Default-Werte
                    console.warn(`Interactions API error ${res.status} for ${contractAddress}:${tokenId}`);
                    const defaultInteractions: UserInteractionState = {
                        isFavorited: false,
                        isWatchlisted: false,
                        userRating: null
                    };
                    interactionsCache.set(interactionsKey, defaultInteractions);
                    interactionsCacheTimestamps.set(interactionsKey, Date.now());
                    notifyListeners(interactionsKey);
                }
            } catch (e) {
                // Bei Netzwerk-Error: Setze Default-Werte
                console.error('Error loading user interactions:', e);
                const defaultInteractions: UserInteractionState = {
                    isFavorited: false,
                    isWatchlisted: false,
                    userRating: null
                };
                interactionsCache.set(interactionsKey, defaultInteractions);
                interactionsCacheTimestamps.set(interactionsKey, Date.now());
                notifyListeners(interactionsKey);
            } finally {
                // WICHTIG: Promise IMMER aus Queue entfernen, auch bei Error
                pendingInteractionsRequests.delete(interactionsKey);
            }
        })();

        pendingInteractionsRequests.set(interactionsKey, requestPromise);
        await requestPromise;
    }, [contractAddress, tokenId, userAddress, interactionsKey]);

    // Stats laden beim Mount - mit intelligentem Cache (30s TTL)
    useEffect(() => {
        if (!contractAddress || !tokenId) return;

        let cancelled = false;

        async function loadData() {
            setLoading(true);

            // Stats laden (nur wenn Cache abgelaufen oder nicht vorhanden)
            if (!isCacheValid(statsKey, statsCacheTimestamps)) {
                await loadStats();
            }

            // User Interactions laden (nur wenn Cache abgelaufen oder nicht vorhanden)
            if (userAddress && interactionsKey && !isCacheValid(interactionsKey, interactionsCacheTimestamps)) {
                await loadInteractions();
            }

            if (!cancelled) setLoading(false);
        }

        loadData();

        return () => { cancelled = true; };
    }, [contractAddress, tokenId, userAddress, statsKey, interactionsKey, loadStats, loadInteractions]);

    // ===== ACTIONS - Jede Action updated den GLOBALEN Cache =====

    const updateStatsCache = useCallback((newStats: NFTStats) => {
        console.log('[NFTStatsContext] updateStatsCache:', { statsKey, newStats });
        statsCache.set(statsKey, newStats);
        statsCacheTimestamps.set(statsKey, Date.now()); // Cache-Timestamp aktualisieren
        notifyListeners(statsKey);
    }, [statsKey]);

    const updateInteractionsCache = useCallback((newInteractions: UserInteractionState) => {
        if (interactionsKey) {
            console.log('[NFTStatsContext] updateInteractionsCache:', { interactionsKey, newInteractions });
            interactionsCache.set(interactionsKey, newInteractions);
            interactionsCacheTimestamps.set(interactionsKey, Date.now()); // Cache-Timestamp aktualisieren
            notifyListeners(interactionsKey);
        }
    }, [interactionsKey]);

    const toggleFavorite = useCallback(async () => {
        if (!userAddress) return;
        console.log('[NFTStatsContext] toggleFavorite called for:', { contractAddress, tokenId, userAddress });

        try {
            const res = await fetch('/api/user/interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-wallet-address': userAddress // Add wallet address to header for auth
                },
                body: JSON.stringify({ contractAddress, tokenId, userId: userAddress, isFavorite: true })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                const errorMessage = errorData?.error || `Server error: ${res.status} ${res.statusText}`;
                console.error('❌ toggleFavorite API error:', errorMessage);

                // Show user-friendly error
                if (res.status === 500) {
                    console.error('💡 Mögliche Ursache: MongoDB Verbindungsproblem. Siehe Server-Logs.');
                }
                throw new Error(errorMessage);
            }

            const result = await res.json();
            console.log('[NFTStatsContext] toggleFavorite API response:', result);

            // Stats aktualisieren (API gibt result.data.stats zurück)
            if (result.data?.stats) {
                updateStatsCache({
                    viewCount: result.data.stats.viewCount || 0,
                    likeCount: result.data.stats.likeCount || 0,
                    watchlistCount: result.data.stats.watchlistCount || 0,
                    ratingCount: result.data.stats.ratingCount || 0,
                    averageRating: result.data.stats.averageRating || 0
                });
            }

            // User Interactions aktualisieren (result.data.data enthält die Interactions)
            const interactions = result.data?.data || result.data;
            if (interactions) {
                updateInteractionsCache({
                    isFavorited: interactions.isFavorite || false,
                    isWatchlisted: interactions.isWatchlisted || false,
                    userRating: interactions.rating ?? null
                });
            }
        } catch (e: any) {
            const errorMsg = e?.message || 'Unknown error';
            console.error('❌ toggleFavorite error:', errorMsg);

            // Network error (server not reachable)
            if (e?.message === 'Failed to fetch' || !navigator.onLine) {
                console.error('🌐 Netzwerkfehler: Server nicht erreichbar oder offline');
            }

            // Re-throw to allow UI to handle error
            throw e;
        }
    }, [contractAddress, tokenId, userAddress, updateStatsCache, updateInteractionsCache]);

    const toggleWatchlist = useCallback(async () => {
        if (!userAddress) return;

        try {
            const res = await fetch('/api/user/interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-wallet-address': userAddress // Add wallet address to header for auth
                },
                body: JSON.stringify({ contractAddress, tokenId, userId: userAddress, isWatchlisted: true })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                const errorMessage = errorData?.error || `Server error: ${res.status} ${res.statusText}`;
                console.error('❌ toggleWatchlist API error:', errorMessage);

                // Show user-friendly error
                if (res.status === 500) {
                    console.error('💡 Mögliche Ursache: MongoDB Verbindungsproblem. Siehe Server-Logs.');
                }
                throw new Error(errorMessage);
            }

            const result = await res.json();

            if (res.ok) {

                // Stats aktualisieren (API gibt result.data.stats zurück)
                if (result.data?.stats) {
                    updateStatsCache({
                        viewCount: result.data.stats.viewCount || 0,
                        likeCount: result.data.stats.likeCount || 0,
                        watchlistCount: result.data.stats.watchlistCount || 0,
                        ratingCount: result.data.stats.ratingCount || 0,
                        averageRating: result.data.stats.averageRating || 0
                    });
                }

                // User Interactions aktualisieren (result.data.data enthält die Interactions)
                const interactions = result.data?.data || result.data;
                if (interactions) {
                    updateInteractionsCache({
                        isFavorited: interactions.isFavorite || false,
                        isWatchlisted: interactions.isWatchlisted || false,
                        userRating: interactions.rating ?? null
                    });
                }
            }
        } catch (e: any) {
            const errorMsg = e?.message || 'Unknown error';
            console.error('❌ toggleWatchlist error:', errorMsg);

            // Network error (server not reachable)
            if (e?.message === 'Failed to fetch' || !navigator.onLine) {
                console.error('🌐 Netzwerkfehler: Server nicht erreichbar oder offline');
            }

            // Re-throw to allow UI to handle error
            throw e;
        }
    }, [contractAddress, tokenId, userAddress, updateStatsCache, updateInteractionsCache]);

    const setRating = useCallback(async (rating: number) => {
        if (!userAddress) return;

        try {
            const res = await fetch('/api/user/interactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-wallet-address': userAddress // Add wallet address to header for auth
                },
                body: JSON.stringify({ contractAddress, tokenId, userId: userAddress, rating })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                const errorMessage = errorData?.error || `Server error: ${res.status} ${res.statusText}`;
                console.error('❌ setRating API error:', errorMessage);

                if (res.status === 500) {
                    console.error('💡 Mögliche Ursache: MongoDB Verbindungsproblem. Siehe Server-Logs.');
                }
                throw new Error(errorMessage);
            }

            const result = await res.json();

            // Stats aktualisieren (API gibt result.data.stats zurück)
            if (result.data?.stats) {
                updateStatsCache({
                    viewCount: result.data.stats.viewCount || 0,
                    likeCount: result.data.stats.likeCount || 0,
                    watchlistCount: result.data.stats.watchlistCount || 0,
                    ratingCount: result.data.stats.ratingCount || 0,
                    averageRating: result.data.stats.averageRating || 0
                });
            }

            // User Interactions aktualisieren (result.data.data enthält die Interactions)
            const interactions = result.data?.data || result.data;
            if (interactions) {
                updateInteractionsCache({
                    isFavorited: interactions.isFavorite || false,
                    isWatchlisted: interactions.isWatchlisted || false,
                    userRating: interactions.rating ?? null
                });
            }
        } catch (e: any) {
            const errorMsg = e?.message || 'Unknown error';
            console.error('❌ setRating error:', errorMsg);

            if (e?.message === 'Failed to fetch' || !navigator.onLine) {
                console.error('🌐 Netzwerkfehler: Server nicht erreichbar oder offline');
            }

            throw e;
        }
    }, [contractAddress, tokenId, userAddress, updateStatsCache, updateInteractionsCache]);

    const incrementViews = useCallback(async () => {
        try {
            const res = await fetch('/api/nft/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contractAddress, tokenId })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => null);
                const errorMessage = errorData?.error || `Server error: ${res.status} ${res.statusText}`;
                console.error('❌ incrementViews API error:', errorMessage);

                if (res.status === 500) {
                    console.error('💡 Mögliche Ursache: MongoDB Verbindungsproblem. Siehe Server-Logs.');
                }
                // Don't throw for view increments - not critical
                return;
            }

            const result = await res.json();
            if (result.data?.stats || result.stats) {
                const stats = result.data?.stats || result.stats;
                updateStatsCache({
                    viewCount: stats.viewCount || 0,
                    likeCount: stats.likeCount || 0,
                    watchlistCount: stats.watchlistCount || 0,
                    ratingCount: stats.ratingCount || 0,
                    averageRating: stats.averageRating || 0
                });
            }
        } catch (e: any) {
            const errorMsg = e?.message || 'Unknown error';
            console.error('❌ incrementViews error:', errorMsg);

            if (e?.message === 'Failed to fetch' || !navigator.onLine) {
                console.error('🌐 Netzwerkfehler: Server nicht erreichbar oder offline');
            }
            // Don't throw for view increments - not critical
        }
    }, [contractAddress, tokenId, updateStatsCache]);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch(`/api/nft/stats?contractAddress=${contractAddress}&tokenId=${tokenId}`);
            if (res.ok) {
                const result = await res.json();
                const data = result.data || result;
                updateStatsCache({
                    viewCount: data.viewCount || 0,
                    likeCount: data.likeCount || 0,
                    watchlistCount: data.watchlistCount || 0,
                    ratingCount: data.ratingCount || 0,
                    averageRating: data.averageRating || 0
                });
            }
        } catch (e) {
            console.error('refresh error:', e);
        }
    }, [contractAddress, tokenId, updateStatsCache]);

    // Lese Stats und Interactions aus dem globalen Cache
    const stats = statsCache.get(statsKey) || null;
    const userInteractions = interactionsKey ? interactionsCache.get(interactionsKey) || null : null;

    return {
        stats,
        userInteractions,
        loading,
        hasUserAddress: Boolean(userAddress),
        toggleFavorite,
        toggleWatchlist,
        setRating,
        incrementViews,
        refresh
    };
}

// Backwards compatibility
export { useNFTStats as useNFTUserStats };
export function useNFTStatsContext() {
    return useContext(NFTStatsContext);
}
export default NFTStatsProvider;
