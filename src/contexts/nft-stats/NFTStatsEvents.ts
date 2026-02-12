'use client';

/**
 * NFT Stats Events Service
 *
 * Manages event handling and notifications for NFT statistics changes.
 * Separated from context for better testability and reusability.
 */

import { devLog } from '@/utils';
import type { NFTStats, UserInteractionState } from './NFTStatsService';

export interface NFTStatsEventData {
    contractAddress: string;
    tokenId: string;
    userAddress?: string;
    stats?: NFTStats;
    userInteractions?: UserInteractionState;
    action?: 'view' | 'like' | 'watchlist' | 'rate' | 'load';
}

export type NFTStatsEventHandler = (data: NFTStatsEventData) => void;

export class NFTStatsEvents {
    private eventHandlers: NFTStatsEventHandler[] = [];

    /**
     * Subscribe to NFT stats events
     */
    subscribe(handler: NFTStatsEventHandler): () => void {
        this.eventHandlers.push(handler);

        // Return unsubscribe function
        return () => {
            const index = this.eventHandlers.indexOf(handler);
            if (index > -1) {
                this.eventHandlers.splice(index, 1);
            }
        };
    }

    /**
     * Emit stats updated event
     */
    emitStatsUpdated(contractAddress: string, tokenId: string, stats: NFTStats): void {
        this.emit({
            contractAddress,
            tokenId,
            stats,
            action: 'load'
        });
    }

    /**
     * Emit user interactions updated event
     */
    emitUserInteractionsUpdated(
        contractAddress: string,
        tokenId: string,
        userAddress: string,
        userInteractions: UserInteractionState
    ): void {
        this.emit({
            contractAddress,
            tokenId,
            userAddress,
            userInteractions
        });
    }

    /**
     * Emit view recorded event
     */
    emitViewRecorded(contractAddress: string, tokenId: string): void {
        this.emit({
            contractAddress,
            tokenId,
            action: 'view'
        });
    }

    /**
     * Emit like toggled event
     */
    emitLikeToggled(contractAddress: string, tokenId: string, userAddress: string): void {
        this.emit({
            contractAddress,
            tokenId,
            userAddress,
            action: 'like'
        });
    }

    /**
     * Emit watchlist toggled event
     */
    emitWatchlistToggled(contractAddress: string, tokenId: string, userAddress: string): void {
        this.emit({
            contractAddress,
            tokenId,
            userAddress,
            action: 'watchlist'
        });
    }

    /**
     * Emit rating set event
     */
    emitRatingSet(contractAddress: string, tokenId: string, userAddress: string): void {
        this.emit({
            contractAddress,
            tokenId,
            userAddress,
            action: 'rate'
        });
    }

    /**
     * Emit event to all handlers
     */
    private emit(data: NFTStatsEventData): void {
        this.eventHandlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                devLog.error('nft-stats', 'NFTStatsEvents: Error in event handler:', error);
            }
        });
    }

    /**
     * Clear all event handlers
     */
    clear(): void {
        this.eventHandlers = [];
    }

    /**
     * Get number of active handlers
     */
    getHandlerCount(): number {
        return this.eventHandlers.length;
    }
}