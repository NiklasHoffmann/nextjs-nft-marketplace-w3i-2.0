/**
 * useGameLoop Hook
 * 
 * Verwaltet den Game Loop mit requestAnimationFrame
 */

import { useEffect, useCallback, useRef } from 'react';
import type { GameState } from '../types';
import { 
    createLandingParticles, 
    createComboParticles,
    createJumpParticles 
} from '../utils/particles';
import { calculatePlatformScore } from '../utils/scoring';

interface GameLoopOptions {
    gameState: GameState;
    isRunning: boolean;
    isPaused: boolean;
    onUpdate: (updates: Partial<GameState>) => void;
    onGameOver: () => void;
    updatePlayer: (player: any) => void;
    addParticles: (particles: any[]) => void;
    updateParticles: (particles: any[]) => void;
    updateScore: (points: number) => void;
    updateCombo: (combo: number) => void;
    resetCombo: () => void;
    updateHighestPlatform: (num: number) => void;
    updateCameraY: (y: number) => void;
    updatePlatforms: (y: number) => void;
    checkPlatformCollision: (player: any, platforms: any[]) => any;
    updatePlayerPhysics: (player: any, left: boolean, right: boolean) => any;
    handleJump: (player: any) => any;
    checkOutOfBounds: (player: any, cameraY: number) => boolean;
    updateCamera: (cameraY: number, playerY: number) => number;
    updateAllParticles: (particles: any[]) => any[];
    isMovingLeft: () => boolean;
    isMovingRight: () => boolean;
    isJumping: () => boolean;
}

export function useGameLoop({
    gameState,
    isRunning,
    isPaused,
    onUpdate,
    onGameOver,
    updatePlayer,
    addParticles,
    updateParticles,
    updateScore,
    updateCombo,
    resetCombo,
    updateHighestPlatform,
    updateCameraY,
    updatePlatforms,
    checkPlatformCollision,
    updatePlayerPhysics,
    handleJump,
    checkOutOfBounds,
    updateCamera,
    updateAllParticles,
    isMovingLeft,
    isMovingRight,
    isJumping,
}: GameLoopOptions) {
    const animationFrameRef = useRef<number>();
    const lastPlatformRef = useRef<number>(0);
    const jumpPressedRef = useRef<boolean>(false);

    /**
     * Game Update Loop
     */
    const gameLoop = useCallback(() => {
        if (!isRunning || isPaused) return;

        // Input
        const left = isMovingLeft();
        const right = isMovingRight();
        const jump = isJumping();

        // Physics Update
        let updatedPlayer = updatePlayerPhysics(gameState.player, left, right);

        // Jump (nur einmal pro Tastendruck)
        if (jump && !jumpPressedRef.current && updatedPlayer.onGround) {
            updatedPlayer = handleJump(updatedPlayer);
            
            // Jump particles
            addParticles(createJumpParticles(
                updatedPlayer.x + updatedPlayer.width / 2,
                updatedPlayer.y + updatedPlayer.height,
                updatedPlayer.direction
            ));
            
            jumpPressedRef.current = true;
        } else if (!jump) {
            jumpPressedRef.current = false;
        }

        // Collision Check
        const { player: collidedPlayer, landedPlatform } = checkPlatformCollision(
            updatedPlayer,
            gameState.platforms
        );
        updatedPlayer = collidedPlayer;

        // Landing Logic
        if (landedPlatform && landedPlatform.number !== lastPlatformRef.current) {
            lastPlatformRef.current = landedPlatform.number;

            // Update Score & Combo
            if (landedPlatform.number > gameState.highestPlatformNumber) {
                updateHighestPlatform(landedPlatform.number);
                
                const newCombo = gameState.combo + 1;
                updateCombo(newCombo);
                
                const points = calculatePlatformScore(landedPlatform.number, newCombo);
                updateScore(points);

                // Landing particles
                addParticles(createLandingParticles(
                    updatedPlayer.x + updatedPlayer.width / 2,
                    landedPlatform.y,
                    landedPlatform.color
                ));

                // Combo particles bei hoher Combo
                if (newCombo >= 5) {
                    addParticles(createComboParticles(
                        updatedPlayer.x + updatedPlayer.width / 2,
                        updatedPlayer.y,
                        newCombo
                    ));
                }
            }
        }

        // Reset Combo wenn gefallen
        if (!updatedPlayer.onGround && updatedPlayer.velocityY > 0) {
            const lastPlatform = gameState.platforms
                .find(p => p.number === lastPlatformRef.current);
            const fellBelowLastPlatform = updatedPlayer.y > (lastPlatform?.y || 0) + 100;
            
            if (fellBelowLastPlatform && gameState.combo > 0) {
                resetCombo();
            }
        }

        // Camera Update
        const newCameraY = updateCamera(gameState.cameraY, updatedPlayer.y);
        updateCameraY(newCameraY);

        // Platforms Update
        updatePlatforms(newCameraY);

        // Particles Update
        const updatedParticlesList = updateAllParticles(gameState.particles);
        updateParticles(updatedParticlesList);

        // Update Player
        updatePlayer(updatedPlayer);

        // Game Over Check
        if (checkOutOfBounds(updatedPlayer, newCameraY)) {
            onGameOver();
            return;
        }

        // Next Frame
        animationFrameRef.current = requestAnimationFrame(gameLoop);
    }, [
        isRunning,
        isPaused,
        gameState,
        isMovingLeft,
        isMovingRight,
        isJumping,
        updatePlayerPhysics,
        handleJump,
        checkPlatformCollision,
        checkOutOfBounds,
        updateCamera,
        updateAllParticles,
        updatePlayer,
        addParticles,
        updateParticles,
        updateScore,
        updateCombo,
        resetCombo,
        updateHighestPlatform,
        updateCameraY,
        updatePlatforms,
        onGameOver,
    ]);

    /**
     * Start/Stop Loop
     */
    useEffect(() => {
        if (isRunning && !isPaused) {
            animationFrameRef.current = requestAnimationFrame(gameLoop);
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isRunning, isPaused, gameLoop]);

    return {
        // Refs for external access if needed
        animationFrameRef,
        lastPlatformRef,
    };
}
