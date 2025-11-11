/**
 * Game Configuration Constants for History Towers
 */

// Canvas dimensions
export const GAME_CONFIG = {
    WIDTH: 360,
    HEIGHT: 640,
} as const;

// Physics constants
export const PHYSICS = {
    GRAVITY: 2400,
    JUMP_VELOCITY: -880,
    MOVE_SPEED_BASE: 260,
    MAX_FALL_SPEED: 1200,
} as const;

// Player dimensions
export const PLAYER = {
    WIDTH: 80,
    HEIGHT: 80,
    FEET_WIDTH: 20,
    FEET_OFFSET: 23, // Offset from left side (player width/2 - feet width/2 - 10px left adjustment)
} as const;

// Platform settings
export const PLATFORM = {
    INITIAL_HEIGHT: 12,
    INITIAL_WIDTH_MIN: 140,
    INITIAL_WIDTH_MAX: 140,
    SAFE_PLATFORM_INTERVAL: 50, // Every 50th platform is a safe platform
    SPAWN_THRESHOLD: 14, // Keep at least 14 platforms on screen
} as const;

// Level progression
export const DIFFICULTY = {
    PLATFORMS_PER_LEVEL: 50,
    VERTICAL_MOVEMENT_START_LEVEL: 2, // Platforms start falling at level 2
    HORIZONTAL_MOVEMENT_START_LEVEL: 3, // Platforms start moving horizontally at level 3
    VERTICAL_SPEED_BASE: 15,
    VERTICAL_SPEED_INCREMENT: 8,
    HORIZONTAL_SPEED_BASE: 20,
    HORIZONTAL_SPEED_INCREMENT: 10,
} as const;

// Visual settings
export const COLORS = {
    BACKGROUND: '#1273EB', // Secondary blue
    PLATFORM: '#FFF9E2', // Primary cream
    SAFE_PLATFORM: '#FFD700', // Gold
    LEVEL_TEXT: '#1273EB', // Blue text on gold platforms
} as const;

// Tower background
export const TOWER = {
    BRICK_WIDTH: 40,
    BRICK_HEIGHT: 20,
    BRICK_COLOR: 'rgba(139, 90, 43, 0.25)',
    BRICK_BORDER: 'rgba(80, 50, 25, 0.3)',
    WINDOW_WIDTH: 70,
    WINDOW_HEIGHT: 100,
    WINDOW_ARCH_HEIGHT: 35,
    WINDOW_SPACING: 800,
    WINDOW_COLOR: '#FFF9E2',
    WINDOW_BORDER: 'rgba(139, 90, 43, 0.8)',
    CHARACTER_SIZE: 85,
} as const;

// Available character SVG paths
export const CHARACTERS = [
    '/media/game/Figur2.svg',
    '/media/game/Figur3.svg',
    '/media/game/Figur4.svg',
    '/media/game/Figur5.svg',
    '/media/game/Figur6.svg',
    '/media/game/Figur7.svg',
] as const;

// Game states
export type GameState = 'idle' | 'running' | 'paused' | 'gameOver';

// Helper type for platform data
export interface Platform {
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number; // horizontal velocity
    vy: number; // vertical velocity (fall speed)
    direction: number; // 1 or -1 for movement direction
    counted: boolean; // Track if this platform was counted
    isSafePlatform: boolean; // Every 50th platform
    number: number; // Platform number (1, 2, 3, ...)
}

// Helper type for difficulty calculation result
export interface DifficultySettings {
    level: number;
    moveSpeed: number;
    spacing: number;
    platformMinW: number;
    platformMaxW: number;
    platformFallSpeed: number;
    horizontalSpeed: number;
}
