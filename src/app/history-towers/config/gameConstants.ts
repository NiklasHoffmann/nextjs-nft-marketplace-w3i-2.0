/**
 * History Towers Game Constants
 * 
 * Zentrale Konfiguration für alle Spiel-Parameter
 */

// ===== CANVAS DIMENSIONS =====
export const CANVAS_WIDTH = 360;
export const CANVAS_HEIGHT = 640;

// ===== PHYSICS =====
export const GRAVITY = 2400;
export const JUMP_VELOCITY = -880;
export const MOVE_SPEED_BASE = 260;
export const MAX_FALL_SPEED = 1200;

// ===== PLAYER =====
export const PLAYER_WIDTH = 80;
export const PLAYER_HEIGHT = 80;
export const PLAYER_START_X = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
export const PLAYER_START_Y = CANVAS_HEIGHT - PLAYER_HEIGHT;

// ===== PLATFORMS =====
export const PLATFORM_HEIGHT = 12;
export const INITIAL_PLATFORM_COUNT = 9;
export const MAX_VISIBLE_PLATFORMS = 14;
export const INITIAL_PLATFORM_WIDTH = 140;
export const INITIAL_PLATFORM_SPACING = 70;

// Level System: Jede 50. Plattform ist eine sichere Level-Plattform
export const PLATFORMS_PER_LEVEL = 50;

// ===== DIFFICULTY PROGRESSION =====
export const PLAYER_SPEED_INCREASE_PER_LEVEL = 6;
export const SPACING_DECREASE_PER_LEVEL = 2;
export const MAX_SPACING_DECREASE = 30;
export const MIN_PLATFORM_SPACING = 48;

export const PLATFORM_MIN_WIDTH_DECREASE = 4;
export const PLATFORM_MAX_WIDTH_DECREASE = 3;
export const MAX_PLATFORM_WIDTH_DECREASE = 60;
export const MIN_PLATFORM_WIDTH = 70;
export const MAX_PLATFORM_WIDTH_MIN = 100;

// Vertikale Bewegung (starts at Level 2 / Platform 50)
export const VERTICAL_MOVEMENT_START_LEVEL = 2;
export const VERTICAL_SPEED_BASE = 15;
export const VERTICAL_SPEED_INCREASE = 8;

// Horizontale Bewegung (starts at Level 3 / Platform 100)
export const HORIZONTAL_MOVEMENT_START_LEVEL = 3;
export const HORIZONTAL_SPEED_BASE = 20;
export const HORIZONTAL_SPEED_INCREASE = 10;

// ===== BACKGROUND EFFECTS =====
export const BRICK_WIDTH = 40;
export const BRICK_HEIGHT = 20;
export const BACKGROUND_SCROLL_SPEED = 0.3;

export const WINDOW_WIDTH = 70;
export const WINDOW_HEIGHT = 100;
export const WINDOW_ARCH_HEIGHT = 35;
export const WINDOW_SPACING = 800;

// ===== SCORING =====
export const SCORE_MULTIPLIER_LEVEL_1 = 1;     // 1x multiplier for Level 1
export const SCORE_MULTIPLIER_LEVEL_2 = 1.5;   // 1.5x multiplier for Level 2
export const SCORE_MULTIPLIER_LEVEL_3 = 2;     // 2x multiplier for Level 3+

// ===== TOWER WINDOW & BACKGROUND =====
export const CHARACTER_SIZE_IN_WINDOW = 85; // Größe der Figur im Fenster

// ===== COLORS =====
export const COLORS = {
    background: '#f9fafb',
    brick: 'rgba(139, 90, 43, 0.25)',
    brickBorder: 'rgba(80, 50, 25, 0.3)',
    window: {
        inner: '#FFF9E2',
        outer: 'rgba(41, 50, 65, 0.95)',
        border: 'rgba(139, 90, 43, 0.8)'
    },
    platform: {
        normal: '#3b82f6',
        safe: '#eab308', // Goldene Farbe für Level-Plattformen
        shadow: 'rgba(0,0,0,0.15)'
    },
    player: {
        shadow: 'rgba(0,0,0,0.2)'
    },
    ui: {
        text: '#1f2937',
        textLight: '#6b7280',
        overlay: 'rgba(0,0,0,0.5)',
        button: '#3b82f6',
        buttonHover: '#2563eb',
        pause: '#ef4444'
    }
} as const;

// ===== CHARACTER ASSETS =====
export const AVAILABLE_CHARACTERS = [
    '/media/game/Figur2.svg',
    '/media/game/Figur3.svg',
    '/media/game/Figur4.svg',
    '/media/game/Figur5.svg',
    '/media/game/Figur6.svg',
    '/media/game/Figur7.svg',
] as const;

// ===== MOTION CONTROLS =====
export const MOTION_SENSITIVITY = 0.5; // Sensitivity for device motion controls
export const MOTION_DEAD_ZONE = 2; // Ignore small movements below this threshold

// ===== VISUAL EFFECTS =====
export const PLATFORM_BORDER_RADIUS = 6;
export const SHADOW_OFFSET_X = 0;
export const SHADOW_OFFSET_Y = 4;
export const SHADOW_BLUR = 8;

export const SPACING_VARIANCE = 0.2; // ±20% variance for platform spacing
export const SAFE_PLATFORM_SPACING_VARIANCE = 0.05; // Smaller variance for safe platforms
export const TRANSITION_PLATFORMS = 4; // Number of platforms using old spacing after level change
