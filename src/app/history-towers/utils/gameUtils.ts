/**
 * Utility functions for History Towers game
 */

import type { DifficultySettings } from '../config/gameConfig';
import { DIFFICULTY, PHYSICS } from '../config/gameConfig';

/**
 * Generate random number between min and max
 */
export const randomRange = (min: number, max: number): number => {
    return Math.random() * (max - min) + min;
};

/**
 * Draw rounded rectangle on canvas
 */
export const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r = 6
): void => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
};

/**
 * Calculate difficulty settings based on platform number
 */
export const getDifficulty = (platformsClimbed: number): DifficultySettings => {
    // Level alle 50 Plattformen (Level 1 = 0-49, Level 2 = 50-99, etc.)
    const level = Math.floor(platformsClimbed / DIFFICULTY.PLATFORMS_PER_LEVEL) + 1;

    // Vertikale Bewegung startet ab Level 2
    let platformFallSpeed = 0;
    if (level >= DIFFICULTY.VERTICAL_MOVEMENT_START_LEVEL) {
        const speedIncreases = Math.max(0, Math.floor((level - 2) / 2));
        platformFallSpeed = DIFFICULTY.VERTICAL_SPEED_BASE + speedIncreases * DIFFICULTY.VERTICAL_SPEED_INCREMENT;
    }

    // Horizontale Bewegung startet ab Level 3
    let horizontalSpeed = 0;
    if (level >= DIFFICULTY.HORIZONTAL_MOVEMENT_START_LEVEL) {
        const speedIncreases = Math.max(0, Math.floor((level - 3) / 2));
        horizontalSpeed = DIFFICULTY.HORIZONTAL_SPEED_BASE + speedIncreases * DIFFICULTY.HORIZONTAL_SPEED_INCREMENT;
    }

    const moveSpeed = PHYSICS.MOVE_SPEED_BASE + (level - 1) * 6;
    const spacing = 80 - Math.min((level - 1) * 2, 30);
    const minSpacing = 48;
    const platformMinW = 140 - Math.min((level - 1) * 4, 60);
    const platformMaxW = 180 - Math.min((level - 1) * 3, 60);

    return {
        level,
        moveSpeed,
        spacing: Math.max(minSpacing, spacing),
        platformMinW: Math.max(70, platformMinW),
        platformMaxW: Math.max(100, platformMaxW),
        platformFallSpeed,
        horizontalSpeed,
    };
};

/**
 * Format number with thousands separator
 */
export const formatScore = (score: number): string => {
    return score.toLocaleString();
};

/**
 * Shorten wallet address for display (0x1234...5678)
 */
export const shortenAddress = (address: string): string => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
