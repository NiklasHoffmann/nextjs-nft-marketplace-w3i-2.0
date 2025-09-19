'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useNFTUserStats } from '@/contexts/NFTStatsContext';
import { CombinedUserInteractionData } from '@/types';

interface PersonalTabProps {
    contractAddress: string;
    tokenId: string;
    // Legacy props - kept for backward compatibility but will be overridden by context
    userInteractions?: CombinedUserInteractionData | null;
    userWalletAddress?: string;
    loading?: boolean;
    onUpdateInteraction?: (data: Partial<CombinedUserInteractionData>) => Promise<void>;
    onToggleFavorite?: () => Promise<void>;
    onToggleWatchlist?: () => Promise<void>;
    onSetRating?: (rating: number) => Promise<void>;
}

export default function PersonalTab({
    contractAddress,
    tokenId,
    // Legacy props - context will override these
    userInteractions: legacyUserInteractions,
    userWalletAddress: legacyUserWalletAddress,
    loading: legacyLoading,
    onUpdateInteraction,
    onToggleFavorite: legacyOnToggleFavorite,
    onToggleWatchlist: legacyOnToggleWatchlist,
    onSetRating: legacyOnSetRating
}: PersonalTabProps) {
    // Get wallet connection state
    const { address: userAddress, isConnected } = useAccount();

    // Use the new unified stats context - this ensures real-time sync with header
    const {
        stats,
        userInteractions,
        loading: statsLoading,
        toggleFavorite,
        toggleWatchlist,
        setRating,
        hasUserAddress
    } = useNFTUserStats(contractAddress, tokenId, userAddress);

    // Use context data with fallbacks to legacy props
    const effectiveUserAddress = userAddress || legacyUserWalletAddress;
    const effectiveUserInteractions = userInteractions || legacyUserInteractions;

    const [localRating, setLocalRating] = useState(() => {
        // Context userInteractions uses 'userRating', legacy uses 'rating'
        if (userInteractions) return userInteractions.userRating || 0;
        if (legacyUserInteractions) return (legacyUserInteractions as any).rating || 0;
        return 0;
    });

    const [personalNotes, setPersonalNotes] = useState(() => {
        // Personal notes only exist in legacy interactions (not in context yet)
        return legacyUserInteractions?.personalNotes || '';
    });

    const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
    const [lastSavedNotes, setLastSavedNotes] = useState(() => {
        return legacyUserInteractions?.personalNotes || '';
    });

    // Sync local state with userInteractions when they change
    useEffect(() => {
        // Handle rating from context (userRating) or legacy (rating)
        let rating = 0;
        if (userInteractions) {
            rating = userInteractions.userRating || 0;
        } else if (legacyUserInteractions) {
            rating = (legacyUserInteractions as any).rating || 0;
        }

        // Handle notes (only from legacy for now)
        const notes = legacyUserInteractions?.personalNotes || '';

        setLocalRating(rating);
        setPersonalNotes(notes);
        setLastSavedNotes(notes);
    }, [userInteractions?.userRating, legacyUserInteractions?.personalNotes]);

    // Create effective values that handle both context and legacy data
    const effectiveIsFavorited = userInteractions?.isFavorited ?? (legacyUserInteractions as any)?.isFavorite ?? false;
    const effectiveIsWatchlisted = userInteractions?.isWatchlisted ?? legacyUserInteractions?.isWatchlisted ?? false;

    // Memoize button state to prevent flickering
    const notesButtonState = useMemo(() => {
        const hasChanges = personalNotes.trim() !== lastSavedNotes.trim();
        const isEmpty = personalNotes.trim() === '';

        if (isUpdatingNotes) {
            return {
                disabled: true,
                text: 'Saving...',
                className: 'bg-blue-600 text-white opacity-75 cursor-not-allowed'
            };
        }

        if (!hasChanges || isEmpty) {
            return {
                disabled: true,
                text: 'Saved',
                className: 'bg-gray-100 text-gray-400 cursor-not-allowed'
            };
        }

        return {
            disabled: false,
            text: 'Save',
            className: 'bg-blue-600 text-white hover:bg-blue-700'
        };
    }, [personalNotes, lastSavedNotes, isUpdatingNotes]);    // Debounced notes change handler
    const handleNotesChange = useCallback(async () => {
        const trimmedNotes = personalNotes.trim();

        if (!onUpdateInteraction || trimmedNotes === lastSavedNotes.trim()) {
            return;
        }

        setIsUpdatingNotes(true);
        try {
            await onUpdateInteraction({
                personalNotes: trimmedNotes
            });
            setLastSavedNotes(trimmedNotes);
        } catch (error) {
            console.error('Error updating notes:', error);
            setPersonalNotes(lastSavedNotes);
        } finally {
            setIsUpdatingNotes(false);
        }
    }, [personalNotes, lastSavedNotes, onUpdateInteraction]);    // If user is not connected, show connection prompt
    if (!effectiveUserAddress || !isConnected) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
                <p className="text-gray-600">Connect your wallet to rate this NFT and add it to your personal collection.</p>
            </div>
        );
    }

    const handleToggleFavorite = async () => {
        try {
            // Prefer context action over legacy
            if (toggleFavorite) {
                await toggleFavorite();
            } else if (legacyOnToggleFavorite) {
                await legacyOnToggleFavorite();
            } else if (onUpdateInteraction) {
                // Use context data for current state
                const currentState = userInteractions?.isFavorited ?? (legacyUserInteractions as any)?.isFavorite ?? false;
                await onUpdateInteraction({
                    isFavorite: !currentState
                });
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const handleToggleWatchlist = async () => {
        try {
            // Prefer context action over legacy
            if (toggleWatchlist) {
                await toggleWatchlist();
            } else if (legacyOnToggleWatchlist) {
                await legacyOnToggleWatchlist();
            } else if (onUpdateInteraction) {
                // Use context data for current state
                const currentState = userInteractions?.isWatchlisted ?? legacyUserInteractions?.isWatchlisted ?? false;
                await onUpdateInteraction({
                    isWatchlisted: !currentState
                });
            }
        } catch (error) {
            console.error('Error toggling watchlist:', error);
        }
    };

    const handleRatingChange = async (rating: number) => {
        // Update local state immediately for instant feedback
        setLocalRating(rating);

        try {
            // Prefer context action over legacy
            if (setRating) {
                await setRating(rating);
            } else if (legacyOnSetRating) {
                await legacyOnSetRating(rating);
            } else if (onUpdateInteraction) {
                await onUpdateInteraction({
                    rating: rating
                });
            }
        } catch (error) {
            console.error('Error setting rating:', error);
            // Revert local state on error
            const currentRating = userInteractions?.userRating ?? (legacyUserInteractions as any)?.rating ?? 0;
            setLocalRating(currentRating);
        }
    };

    return (
        <div className="space-y-6 min-h-[600px]">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Personal Collection
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                    Rate, favorite, and add personal notes to this NFT
                </p>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Favorite Button */}
                    <button
                        onClick={handleToggleFavorite}
                        className={`flex items-center justify-center p-4 rounded-lg border-2 transition-colors duration-200 min-h-[80px] w-full ${effectiveIsFavorited
                            ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                            }`}
                    >
                        <svg className={`w-6 h-6 mr-2 flex-shrink-0 ${effectiveIsFavorited ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="text-center leading-tight w-[140px] flex-shrink-0">
                            {effectiveIsFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                        </span>
                    </button>

                    {/* Watchlist Button */}
                    <button
                        onClick={handleToggleWatchlist}
                        className={`flex items-center justify-center p-4 rounded-lg border-2 transition-colors duration-200 min-h-[80px] w-full ${effectiveIsWatchlisted
                            ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600'
                            }`}
                    >
                        <svg className={`w-6 h-6 mr-2 flex-shrink-0 ${effectiveIsWatchlisted ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="text-center leading-tight w-[140px] flex-shrink-0">
                            {effectiveIsWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Rating */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Your Rating
                </h3>

                <div className="flex items-center space-x-1 min-h-[48px]">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => handleRatingChange(star)}
                            className="text-3xl transition-all duration-200 transform cursor-pointer hover:scale-110"
                        >
                            <svg
                                className={`w-8 h-8 transition-colors duration-200 ${star <= localRating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill={star <= localRating ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                strokeWidth={star <= localRating ? 0 : 2}
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                />
                            </svg>
                        </button>
                    ))}
                    <span className="ml-4 text-gray-600 min-w-[120px] flex-shrink-0">
                        {localRating > 0 ? `${localRating}/5 stars` : 'No rating yet'}
                    </span>
                    {localRating > 0 && (
                        <button
                            onClick={() => handleRatingChange(0)}
                            className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-lg text-sm transition-colors"
                            title="Remove your rating"
                        >
                            Remove
                        </button>
                    )}
                </div>
            </div>

            {/* Personal Notes */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Personal Notes
                </h3>

                <div className="space-y-3">
                    <textarea
                        value={personalNotes}
                        onChange={(e) => setPersonalNotes(e.target.value)}
                        placeholder="Add your personal notes about this NFT..."
                        rows={4}
                        disabled={isUpdatingNotes}
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 ${isUpdatingNotes ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    />

                    {/* Save Button for Notes */}
                    <div className="flex justify-between items-center min-h-[40px]">
                        <p className="text-sm text-gray-500 flex-shrink-0">
                            These notes are private and only visible to you.
                        </p>
                        <button
                            onClick={handleNotesChange}
                            disabled={notesButtonState.disabled}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 w-[120px] flex-shrink-0 ${notesButtonState.className}`}
                        >
                            <span className="block text-center">
                                {notesButtonState.text}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
