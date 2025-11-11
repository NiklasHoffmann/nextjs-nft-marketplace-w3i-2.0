/**
 * useGamePhysics Hook
 * 
 * Verwaltet Physik-Updates: Gravitation, Bewegung, Kollision
 */

import { useCallback } from 'react';
import type { Player, Platform, Particle } from '../types';
import { GAME_CONFIG } from '../constants';
import { 
    findCollisionPlatform, 
    clampPlayerX, 
    isPlayerOutOfBounds 
} from '../utils/collision';
import { updateParticles as updateParticlePhysics } from '../utils/particles';

export function useGamePhysics() {
    /**
     * Update Player Physics (Gravitation, Bewegung, Friction)
     */
    const updatePlayerPhysics = useCallback((
        player: Player,
        leftPressed: boolean,
        rightPressed: boolean
    ): Player => {
        let { velocityX, velocityY, x, y, onGround } = player;

        // Horizontale Bewegung
        if (leftPressed) {
            velocityX -= GAME_CONFIG.moveSpeed;
        }
        if (rightPressed) {
            velocityX += GAME_CONFIG.moveSpeed;
        }

        // Max Speed begrenzen
        velocityX = Math.max(-GAME_CONFIG.maxSpeedX, Math.min(GAME_CONFIG.maxSpeedX, velocityX));

        // Friction
        velocityX *= GAME_CONFIG.friction;

        // Gravitation
        velocityY += GAME_CONFIG.gravity;

        // Position Update
        x += velocityX;
        y += velocityY;

        // Horizontale Grenzen
        x = clampPlayerX({ ...player, x }, GAME_CONFIG.canvasWidth);

        // Spieler-Richtung
        const direction = velocityX > 0 ? 1 : velocityX < 0 ? -1 : player.direction;

        return {
            ...player,
            x,
            y,
            velocityX,
            velocityY,
            direction,
        };
    }, []);

    /**
     * Handle Player Jump
     */
    const handleJump = useCallback((player: Player): Player => {
        if (player.onGround) {
            return {
                ...player,
                velocityY: GAME_CONFIG.jumpPower,
                onGround: false,
            };
        }
        return player;
    }, []);

    /**
     * Check Collision mit Plattformen
     */
    const checkPlatformCollision = useCallback((
        player: Player,
        platforms: Platform[]
    ): { player: Player; landedPlatform: Platform | null } => {
        const collisionPlatform = findCollisionPlatform(player, platforms);

        if (collisionPlatform) {
            return {
                player: {
                    ...player,
                    y: collisionPlatform.y - player.height,
                    velocityY: 0,
                    onGround: true,
                },
                landedPlatform: collisionPlatform,
            };
        }

        return {
            player: { ...player, onGround: false },
            landedPlatform: null,
        };
    }, []);

    /**
     * Check if Player is out of bounds (Game Over)
     */
    const checkOutOfBounds = useCallback((
        player: Player,
        cameraY: number
    ): boolean => {
        return isPlayerOutOfBounds(player, cameraY, GAME_CONFIG.canvasHeight);
    }, []);

    /**
     * Update Camera to follow Player
     */
    const updateCamera = useCallback((
        currentCameraY: number,
        playerY: number
    ): number => {
        const targetY = playerY - GAME_CONFIG.canvasHeight / 2;
        
        // Smooth camera follow
        if (targetY < currentCameraY) {
            return currentCameraY + (targetY - currentCameraY) * 0.1;
        }
        
        return currentCameraY;
    }, []);

    /**
     * Update alle Partikel
     */
    const updateAllParticles = useCallback((particles: Particle[]): Particle[] => {
        return updateParticlePhysics(particles);
    }, []);

    return {
        updatePlayerPhysics,
        handleJump,
        checkPlatformCollision,
        checkOutOfBounds,
        updateCamera,
        updateAllParticles,
    };
}
