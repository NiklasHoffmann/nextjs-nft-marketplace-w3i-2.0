/**
 * useGameState Hook
 * 
 * Verwaltet den kompletten Game State (Player, Platforms, Particles, Score, etc.)
 */

import { useState, useCallback, useRef } from 'react';
import type { GameState, Platform, Particle, Player } from '../types';
import { GAME_CONFIG, PLAYER } from '../constants';
import { 
    initializePlatforms, 
    generatePlatform,
    shouldGenerateMorePlatforms,
    cleanupOldPlatforms 
} from '../utils';

/**
 * Initialer Player State
 */
const createInitialPlayer = (): Player => ({
    x: PLAYER.startX,
    y: PLAYER.startY,
    width: PLAYER.width,
    height: PLAYER.height,
    velocityX: 0,
    velocityY: 0,
    onGround: false,
    direction: 1,
});

/**
 * Initialer Game State
 */
const createInitialState = (): GameState => ({
    player: createInitialPlayer(),
    platforms: initializePlatforms(),
    particles: [],
    score: 0,
    highestPlatformNumber: 0,
    platformsClimbed: 0,
    combo: 0,
    maxCombo: 0,
    cameraY: 0,
    nextPlatformNumber: 16,
    direction: {
        left: false,
        right: false,
        up: false,
    },
});

export function useGameState() {
    const [gameState, setGameState] = useState<GameState>(createInitialState());
    const stateRef = useRef<GameState>(gameState);
    
    // Sync state mit ref für Performance
    stateRef.current = gameState;

    /**
     * Reset Game State
     */
    const resetGame = useCallback(() => {
        setGameState(createInitialState());
    }, []);

    /**
     * Update Player Position
     */
    const updatePlayer = useCallback((updates: Partial<Player>) => {
        setGameState(prev => ({
            ...prev,
            player: { ...prev.player, ...updates },
        }));
    }, []);

    /**
     * Update Player Velocity
     */
    const updatePlayerVelocity = useCallback((vx: number, vy: number) => {
        setGameState(prev => ({
            ...prev,
            player: {
                ...prev.player,
                velocityX: vx,
                velocityY: vy,
            },
        }));
    }, []);

    /**
     * Set Player Ground State
     */
    const setPlayerOnGround = useCallback((onGround: boolean) => {
        setGameState(prev => ({
            ...prev,
            player: { ...prev.player, onGround },
        }));
    }, []);

    /**
     * Add Platforms (bei Generierung)
     */
    const addPlatforms = useCallback((newPlatforms: Platform[]) => {
        setGameState(prev => ({
            ...prev,
            platforms: [...prev.platforms, ...newPlatforms],
        }));
    }, []);

    /**
     * Update Platforms (Cleanup)
     */
    const updatePlatforms = useCallback((cameraY: number) => {
        setGameState(prev => {
            const cleaned = cleanupOldPlatforms(prev.platforms, cameraY);
            
            // Generiere neue Plattformen wenn nötig
            if (shouldGenerateMorePlatforms(cleaned, cameraY)) {
                const newPlatforms: Platform[] = [];
                for (let i = 0; i < 5; i++) {
                    newPlatforms.push(generatePlatform(prev.nextPlatformNumber + i));
                }
                
                return {
                    ...prev,
                    platforms: [...cleaned, ...newPlatforms],
                    nextPlatformNumber: prev.nextPlatformNumber + 5,
                };
            }
            
            return { ...prev, platforms: cleaned };
        });
    }, []);

    /**
     * Add Particles
     */
    const addParticles = useCallback((newParticles: Particle[]) => {
        setGameState(prev => ({
            ...prev,
            particles: [...prev.particles, ...newParticles],
        }));
    }, []);

    /**
     * Update Particles (Physics & Cleanup)
     */
    const updateParticles = useCallback((updatedParticles: Particle[]) => {
        setGameState(prev => ({
            ...prev,
            particles: updatedParticles,
        }));
    }, []);

    /**
     * Update Score
     */
    const updateScore = useCallback((points: number) => {
        setGameState(prev => ({
            ...prev,
            score: prev.score + points,
        }));
    }, []);

    /**
     * Update Combo
     */
    const updateCombo = useCallback((combo: number) => {
        setGameState(prev => ({
            ...prev,
            combo,
            maxCombo: Math.max(prev.maxCombo, combo),
        }));
    }, []);

    /**
     * Reset Combo
     */
    const resetCombo = useCallback(() => {
        setGameState(prev => ({
            ...prev,
            combo: 0,
        }));
    }, []);

    /**
     * Update Highest Platform
     */
    const updateHighestPlatform = useCallback((platformNumber: number) => {
        setGameState(prev => {
            if (platformNumber > prev.highestPlatformNumber) {
                return {
                    ...prev,
                    highestPlatformNumber: platformNumber,
                    platformsClimbed: prev.platformsClimbed + 1,
                };
            }
            return prev;
        });
    }, []);

    /**
     * Update Camera Y
     */
    const updateCameraY = useCallback((y: number) => {
        setGameState(prev => ({
            ...prev,
            cameraY: y,
        }));
    }, []);

    /**
     * Update Direction Input
     */
    const updateDirection = useCallback((direction: Partial<GameState['direction']>) => {
        setGameState(prev => ({
            ...prev,
            direction: { ...prev.direction, ...direction },
        }));
    }, []);

    /**
     * Batch Update für Performance
     */
    const batchUpdate = useCallback((updates: Partial<GameState>) => {
        setGameState(prev => ({ ...prev, ...updates }));
    }, []);

    return {
        // State
        gameState,
        stateRef,
        
        // Actions
        resetGame,
        updatePlayer,
        updatePlayerVelocity,
        setPlayerOnGround,
        addPlatforms,
        updatePlatforms,
        addParticles,
        updateParticles,
        updateScore,
        updateCombo,
        resetCombo,
        updateHighestPlatform,
        updateCameraY,
        updateDirection,
        batchUpdate,
    };
}
