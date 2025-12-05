/**
 * NFTStatsContext - MINIMAL, RELIABLE Real-time NFT Statistics
 * 
 * Uses simple useState with a Map-like structure.
 * Key insight: The context value object is stable, only the data inside changes.
 */

'use client';

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
    ReactNode
} from 'react';

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

// ===== SIMPLE GLOBAL STORE =====
// This lives outside React to avoid re-render issues

interface StoreEntry {
    stats: NFTStats | null;
    userInteractions: Map<string, UserInteractionState>;
    loading: boolean;
}

const store = new Map<string, StoreEntry>();
const listeners = new Set<() => void>();

function getKey(contractAddress: string, tokenId: string): string {
    return `${contractAddress.toLowerCase()}-${tokenId}`;
}

function getEntry(key: string): StoreEntry {
    if (!store.has(key)) {
        store.set(key, { stats: null, userInteractions: new Map(), loading: false });
    }
    return store.get(key)!;
}

function notifyListeners() {
    listeners.forEach(listener => listener());
}

// ===== API FUNCTIONS =====

async function fetchStats(contractAddress: string, tokenId: string): Promise<NFTStats | null> {
    try {
        const res = await fetch(`/api/nft/stats?contractAddress=${contractAddress}&tokenId=${tokenId}`);
        if (!res.ok) {
            return null;
        }
        const result = await res.json();
        const data = result.data || result;
        return {
            viewCount: data.viewCount || 0,
            likeCount: data.likeCount || 0,
            watchlistCount: data.watchlistCount || 0,
            ratingCount: data.ratingCount || 0,
            averageRating: data.averageRating || 0
        };
    } catch (e) {
        console.error('[NFTStatsContext] Error fetching stats:', e);
        return null;
    }
}

async function fetchUserInteractions(contractAddress: string, tokenId: string, userAddress: string): Promise<UserInteractionState | null> {
    try {
        const res = await fetch(`/api/user/interactions?contractAddress=${contractAddress}&tokenId=${tokenId}&userId=${userAddress}`);
        if (!res.ok) {
            return null;
        }
        const result = await res.json();
        const data = result.data || result;
        return {
            isFavorited: data.isFavorite || false,
            isWatchlisted: data.isWatchlisted || false,
            userRating: data.rating ?? null
        };
    } catch (e) {
        console.error('[NFTStatsContext] Error fetching user interactions:', e);
        return null;
    }
}

// ===== STORE ACTIONS =====

async function loadStats(contractAddress: string, tokenId: string): Promise<void> {
    const key = getKey(contractAddress, tokenId);
    const entry = getEntry(key);

    if (entry.loading || entry.stats) {
        return;
    }

    entry.loading = true;
    const stats = await fetchStats(contractAddress, tokenId);
    entry.stats = stats;
    entry.loading = false;
    notifyListeners();
}

async function loadUserInteractions(contractAddress: string, tokenId: string, userAddress: string): Promise<void> {
    const key = getKey(contractAddress, tokenId);
    const entry = getEntry(key);
    const userKey = userAddress.toLowerCase();

    if (entry.userInteractions.has(userKey)) {
        return;
    }

    const interactions = await fetchUserInteractions(contractAddress, tokenId, userAddress);
    if (interactions) {
        entry.userInteractions.set(userKey, interactions);
        notifyListeners();
    }
}

async function toggleFavorite(contractAddress: string, tokenId: string, userAddress: string): Promise<void> {
    const key = getKey(contractAddress, tokenId);
    const entry = getEntry(key);
    const userKey = userAddress.toLowerCase();

    try {
        const res = await fetch('/api/user/interactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contractAddress,
                tokenId,
                userId: userAddress,
                isFavorite: true
            })
        });

        if (res.ok) {
            const result = await res.json();
            const responseData = result.data || result;
            const data = responseData.data || responseData;
            const stats = responseData.stats;

            if (stats) {
                entry.stats = {
                    viewCount: stats.viewCount || 0,
                    likeCount: stats.likeCount || 0,
                    watchlistCount: stats.watchlistCount || 0,
                    ratingCount: stats.ratingCount || 0,
                    averageRating: stats.averageRating || 0
                };
            }
            if (data) {
                entry.userInteractions.set(userKey, {
                    isFavorited: data.isFavorite || false,
                    isWatchlisted: data.isWatchlisted || false,
                    userRating: data.rating ?? null
                });
            }
            notifyListeners();
        }
    } catch (e) {
        console.error('[NFTStatsContext] toggleFavorite error:', e);
    }
}

async function toggleWatchlist(contractAddress: string, tokenId: string, userAddress: string): Promise<void> {
    const key = getKey(contractAddress, tokenId);
    const entry = getEntry(key);
    const userKey = userAddress.toLowerCase();

    try {
        const res = await fetch('/api/user/interactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contractAddress,
                tokenId,
                userId: userAddress,
                isWatchlisted: true
            })
        });

        if (res.ok) {
            const result = await res.json();
            const responseData = result.data || result;
            const data = responseData.data || responseData;
            const stats = responseData.stats;

            if (stats) {
                entry.stats = {
                    viewCount: stats.viewCount || 0,
                    likeCount: stats.likeCount || 0,
                    watchlistCount: stats.watchlistCount || 0,
                    ratingCount: stats.ratingCount || 0,
                    averageRating: stats.averageRating || 0
                };
            }
            if (data) {
                entry.userInteractions.set(userKey, {
                    isFavorited: data.isFavorite || false,
                    isWatchlisted: data.isWatchlisted || false,
                    userRating: data.rating ?? null
                });
            }
            notifyListeners();
        }
    } catch (e) {
        console.error('[NFTStatsContext] toggleWatchlist error:', e);
    }
}

async function setUserRating(contractAddress: string, tokenId: string, userAddress: string, rating: number): Promise<void> {
    const key = getKey(contractAddress, tokenId);
    const entry = getEntry(key);
    const userKey = userAddress.toLowerCase();

    try {
        const res = await fetch('/api/user/interactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contractAddress,
                tokenId,
                userId: userAddress,
                rating
            })
        });

        if (res.ok) {
            const result = await res.json();
            const responseData = result.data || result;
            const data = responseData.data || responseData;
            const stats = responseData.stats;

            if (stats) {
                entry.stats = {
                    viewCount: stats.viewCount || 0,
                    likeCount: stats.likeCount || 0,
                    watchlistCount: stats.watchlistCount || 0,
                    ratingCount: stats.ratingCount || 0,
                    averageRating: stats.averageRating || 0
                };
            }
            if (data) {
                entry.userInteractions.set(userKey, {
                    isFavorited: data.isFavorite || false,
                    isWatchlisted: data.isWatchlisted || false,
                    userRating: data.rating ?? null
                });
            }
            notifyListeners();
        }
    } catch (e) {
        console.error('[NFTStatsContext] setUserRating error:', e);
    }
}

async function recordView(contractAddress: string, tokenId: string): Promise<void> {
    const key = getKey(contractAddress, tokenId);
    const entry = getEntry(key);

    try {
        const res = await fetch('/api/nft/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractAddress, tokenId })
        });

        if (res.ok) {
            const data = await res.json();
            if (data.stats) {
                entry.stats = {
                    viewCount: data.stats.viewCount || 0,
                    likeCount: data.stats.likeCount || 0,
                    watchlistCount: data.stats.watchlistCount || 0,
                    ratingCount: data.stats.ratingCount || 0,
                    averageRating: data.stats.averageRating || 0
                };
                notifyListeners();
            }
        }
    } catch (e) {
        console.error('recordView error:', e);
    }
}

// ===== CONTEXT =====

interface NFTStatsContextType {
    version: number;
}

const NFTStatsContext = createContext<NFTStatsContextType>({ version: 0 });

export function NFTStatsProvider({ children }: { children: ReactNode }) {
    const [version, setVersion] = useState(0);

    useEffect(() => {
        const listener = () => setVersion(v => v + 1);
        listeners.add(listener);
        return () => { listeners.delete(listener); };
    }, []);

    return (
        <NFTStatsContext.Provider value={{ version }}>
            {children}
        </NFTStatsContext.Provider>
    );
}

// ===== HOOKS =====

/**
 * Main hook for NFT stats - automatically reactive
 */
export function useNFTUserStats(contractAddress: string, tokenId: string, userAddress?: string) {
    const { version } = useContext(NFTStatsContext);
    const loadedRef = useRef(false);
    const userLoadedRef = useRef<string | null>(null);

    const key = getKey(contractAddress, tokenId);
    const entry = getEntry(key);

    // Auto-load stats once
    useEffect(() => {
        if (contractAddress && tokenId && !loadedRef.current) {
            loadedRef.current = true;
            loadStats(contractAddress, tokenId);
        }
    }, [contractAddress, tokenId]);

    // Auto-load user interactions when user changes
    useEffect(() => {
        if (contractAddress && tokenId && userAddress && userLoadedRef.current !== userAddress) {
            userLoadedRef.current = userAddress;
            loadUserInteractions(contractAddress, tokenId, userAddress);
        }
    }, [contractAddress, tokenId, userAddress]);

    // Get current data (reactive via version)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _v = version; // Reference for reactivity

    const stats = entry.stats;
    const userInteractions = userAddress
        ? entry.userInteractions.get(userAddress.toLowerCase()) ?? null
        : null;
    const loading = entry.loading;

    // STABLE action functions - these never change reference
    const actions = useRef({
        toggleFavorite: async () => {
            if (userAddress) await toggleFavorite(contractAddress, tokenId, userAddress);
        },
        toggleWatchlist: async () => {
            if (userAddress) await toggleWatchlist(contractAddress, tokenId, userAddress);
        },
        setRating: async (rating: number) => {
            if (userAddress) await setUserRating(contractAddress, tokenId, userAddress, rating);
        },
        incrementViews: async () => {
            await recordView(contractAddress, tokenId);
        },
        refresh: async () => {
            loadedRef.current = false;
            const e = getEntry(key);
            e.stats = null;
            e.loading = false;
            await loadStats(contractAddress, tokenId);
        }
    });

    // Update refs when params change
    useEffect(() => {
        actions.current = {
            toggleFavorite: async () => {
                if (userAddress) await toggleFavorite(contractAddress, tokenId, userAddress);
            },
            toggleWatchlist: async () => {
                if (userAddress) await toggleWatchlist(contractAddress, tokenId, userAddress);
            },
            setRating: async (rating: number) => {
                if (userAddress) await setUserRating(contractAddress, tokenId, userAddress, rating);
            },
            incrementViews: async () => {
                await recordView(contractAddress, tokenId);
            },
            refresh: async () => {
                loadedRef.current = false;
                const e = getEntry(key);
                e.stats = null;
                e.loading = false;
                await loadStats(contractAddress, tokenId);
            }
        };
    }, [contractAddress, tokenId, userAddress, key]);

    return {
        stats,
        userInteractions,
        loading,
        hasUserAddress: Boolean(userAddress),
        toggleFavorite: actions.current.toggleFavorite,
        toggleWatchlist: actions.current.toggleWatchlist,
        setRating: actions.current.setRating,
        incrementViews: actions.current.incrementViews,
        refresh: actions.current.refresh
    };
}

// Legacy compatibility
export function useNFTStatsContext() {
    return useContext(NFTStatsContext);
}

export function useNFTStatsVersion() {
    return useContext(NFTStatsContext).version;
}

export function useNFTStats(contractAddress: string, tokenId: string) {
    return useNFTUserStats(contractAddress, tokenId);
}

export default NFTStatsProvider;
