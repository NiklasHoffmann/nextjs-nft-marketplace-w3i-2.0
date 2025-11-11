/**
 * useGameRenderer Hook
 * 
 * Verwaltet Canvas Rendering - zeichnet alle Game-Elemente
 */

import { useCallback, RefObject } from 'react';
import type { GameState } from '../types';
import { COLORS, GAME_CONFIG } from '../constants';
import { drawParticles } from '../utils/particles';
import { getCurrentLevel } from '../utils/platformGenerator';

export function useGameRenderer(canvasRef: RefObject<HTMLCanvasElement>) {
    /**
     * Clear Canvas
     */
    const clearCanvas = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);
    }, []);

    /**
     * Draw Background Grid
     */
    const drawBackground = useCallback((
        ctx: CanvasRenderingContext2D,
        cameraY: number
    ) => {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1;

        // Vertikale Linien
        for (let x = 0; x < GAME_CONFIG.canvasWidth; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, GAME_CONFIG.canvasHeight);
            ctx.stroke();
        }

        // Horizontale Linien
        const startY = Math.floor(cameraY / 50) * 50;
        for (let y = startY; y < cameraY + GAME_CONFIG.canvasHeight; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y - cameraY);
            ctx.lineTo(GAME_CONFIG.canvasWidth, y - cameraY);
            ctx.stroke();
        }
    }, []);

    /**
     * Draw Player
     */
    const drawPlayer = useCallback((
        ctx: CanvasRenderingContext2D,
        gameState: GameState
    ) => {
        const { player, cameraY } = gameState;
        const screenY = player.y - cameraY;

        // Shadow
        ctx.fillStyle = COLORS.playerShadow;
        ctx.fillRect(
            player.x + 2,
            screenY + 2,
            player.width,
            player.height
        );

        // Player
        ctx.fillStyle = COLORS.player;
        ctx.fillRect(player.x, screenY, player.width, player.height);

        // Eyes (direction indicator)
        ctx.fillStyle = '#ffffff';
        const eyeSize = 4;
        const eyeOffsetX = player.direction > 0 ? 18 : 8;
        ctx.fillRect(player.x + eyeOffsetX, screenY + 8, eyeSize, eyeSize);
    }, []);

    /**
     * Draw Platform
     */
    const drawPlatform = useCallback((
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        color: string
    ) => {
        // Shadow
        ctx.fillStyle = COLORS.platformShadow;
        ctx.fillRect(x + 2, y + 2, width, height);

        // Platform
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(x, y, width, 4);
    }, []);

    /**
     * Draw All Platforms
     */
    const drawPlatforms = useCallback((
        ctx: CanvasRenderingContext2D,
        gameState: GameState
    ) => {
        const { platforms, cameraY } = gameState;

        platforms.forEach(platform => {
            const screenY = platform.y - cameraY;
            
            // Nur sichtbare Plattformen zeichnen
            if (screenY > -50 && screenY < GAME_CONFIG.canvasHeight + 50) {
                drawPlatform(
                    ctx,
                    platform.x,
                    screenY,
                    platform.width,
                    platform.height,
                    platform.color
                );

                // Platform Number (Debug)
                if (platform.number % 10 === 0) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '10px monospace';
                    ctx.fillText(
                        platform.number.toString(),
                        platform.x + 5,
                        screenY + 15
                    );
                }
            }
        });
    }, [drawPlatform]);

    /**
     * Draw HUD (Score, Level, Combo)
     */
    const drawHUD = useCallback((
        ctx: CanvasRenderingContext2D,
        gameState: GameState
    ) => {
        const { score, combo, highestPlatformNumber } = gameState;
        const level = getCurrentLevel(highestPlatformNumber);

        // Score
        ctx.fillStyle = COLORS.scoreText;
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`Score: ${score.toLocaleString()}`, 20, 40);

        // Level
        ctx.fillStyle = COLORS.levelText;
        ctx.font = '16px sans-serif';
        ctx.fillText(`Level ${level}`, 20, 65);

        // Combo
        if (combo > 2) {
            ctx.fillStyle = COLORS.comboText;
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText(`Combo x${combo}!`, 20, 95);
            
            // Combo Bar
            const barWidth = Math.min(combo * 20, 200);
            ctx.fillStyle = COLORS.comboGold;
            ctx.fillRect(20, 100, barWidth, 6);
        }
    }, []);

    /**
     * Draw Pause Overlay
     */
    const drawPauseOverlay = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = COLORS.pauseOverlay;
        ctx.fillRect(0, 0, GAME_CONFIG.canvasWidth, GAME_CONFIG.canvasHeight);

        ctx.fillStyle = COLORS.pauseText;
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', GAME_CONFIG.canvasWidth / 2, GAME_CONFIG.canvasHeight / 2);
        ctx.textAlign = 'left';
    }, []);

    /**
     * Main Render Function
     */
    const render = useCallback((gameState: GameState, paused: boolean = false) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        clearCanvas(ctx);

        // Background
        drawBackground(ctx, gameState.cameraY);

        // Platforms
        drawPlatforms(ctx, gameState);

        // Particles
        drawParticles(ctx, gameState.particles, gameState.cameraY);

        // Player
        drawPlayer(ctx, gameState);

        // HUD
        drawHUD(ctx, gameState);

        // Pause Overlay
        if (paused) {
            drawPauseOverlay(ctx);
        }
    }, [
        canvasRef,
        clearCanvas,
        drawBackground,
        drawPlatforms,
        drawPlayer,
        drawHUD,
        drawPauseOverlay,
    ]);

    return {
        render,
        clearCanvas,
        drawPlayer,
        drawPlatform,
        drawPlatforms,
        drawHUD,
        drawPauseOverlay,
    };
}
