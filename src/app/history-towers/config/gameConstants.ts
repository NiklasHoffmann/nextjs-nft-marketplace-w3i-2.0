/**
 * History Towers Game Constants
 * 
 * Zentrale Konfiguration fÃ¼r alle Spiel-Parameter
 */

// ===== CANVAS DIMENSIONS =====
export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 960;

// ===== PHYSICS =====
export const GRAVITY = 2400;
export const JUMP_VELOCITY = -880;
export const MOVE_SPEED_BASE = 260;
export const MAX_FALL_SPEED = 1200;

// ===== PLAYER =====
export const PLAYER_WIDTH = 133;
export const PLAYER_HEIGHT = 133;
export const PLAYER_START_X = CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2;
export const PLAYER_START_Y = CANVAS_HEIGHT - PLAYER_HEIGHT;

// ===== PLATFORMS =====
export const PLATFORM_HEIGHT = 16;
export const INITIAL_PLATFORM_COUNT = 9;
export const MAX_VISIBLE_PLATFORMS = 14;
export const INITIAL_PLATFORM_WIDTH = 180;
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
export const WINDOW_SPACING = 800; // Zurück auf 800 für weniger Fenster

// ===== SCORING =====
export const SCORE_MULTIPLIER_LEVEL_1 = 1;     // 1x multiplier for Level 1
export const SCORE_MULTIPLIER_LEVEL_2 = 1.5;   // 1.5x multiplier for Level 2
export const SCORE_MULTIPLIER_LEVEL_3 = 2;     // 2x multiplier for Level 3+

// ===== TOWER WINDOW & BACKGROUND =====
export const CHARACTER_SIZE_IN_WINDOW = 85; // GrÃ¶ÃŸe der Figur im Fenster

// ===== COLORS =====
export const COLORS = {
    background: '#f9fafb',
    brick: '#8B5A2B',
    brickBorder: '#6B4423',
    window: {
        inner: '#FFF9E2',
        outer: 'rgba(41, 50, 65, 0.95)',
        border: 'rgba(139, 90, 43, 0.8)'
    },
    platform: {
        normal: '#3b82f6',
        safe: '#eab308', // Goldene Farbe fÃ¼r Level-Plattformen
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

// ===== GAMEPLAY MECHANICS =====
export const CAMERA_LINE_RATIO = 0.4; // Camera follows player at 40% of screen height
export const PLAYER_TILT_MAX = 0.3; // Maximum tilt angle for player character
export const PLAYER_TILT_DIVIDER = 600; // Divider for velocity-to-tilt conversion
export const PLATFORM_CLEANUP_OFFSET = 40; // Pixels below screen to keep platforms
export const SPAWN_THRESHOLD_Y = -60; // Y position to trigger new platform spawning
export const MAX_FRAME_TIME = 0.033; // Maximum frame time (33ms = ~30 FPS minimum)
export const MOBILE_BREAKPOINT = 768; // Pixel width for mobile detection
export const DISTANCE_THRESHOLD_GAME_OVER = 5; // Minimum distance climbed before ground becomes fatal

// ===== UI DIMENSIONS =====
export const UI_ELEMENT_HEIGHT = 56; // Standard height for in-game UI elements
export const UI_PADDING = 16; // Standard padding for UI elements
export const UI_GAP = 8; // Gap between UI elements
export const UI_BORDER_RADIUS = 12; // Border radius for UI elements

// ===== MOBILE TOUCH CONTROLS =====
// Touch Button Heights (responsive)
export const TOUCH_BUTTON_HEIGHT_MOBILE = 56; // h-14 (3.5rem) - optimiert für Daumen
export const TOUCH_BUTTON_HEIGHT_TABLET = 64; // h-16 (4rem) - größer für Tablets
export const TOUCH_BUTTON_HEIGHT_DESKTOP = 56; // h-14 (3.5rem) - Standard für Desktop-Touch

// Motion Control Settings
export const MOTION_TILT_THRESHOLD = 6; // Degrees of tilt required to activate movement (kleiner = stärker/sensitiver)
export const MOTION_TILT_DEADZONE = 2; // Degrees of deadzone to ignore small movements
// Hinweis: Gamma range ist -90° (links) bis +90° (rechts)
// - Threshold 6° + Deadzone 2° = Bewegung ab 8° Neigung
// - Kleinere Werte = stärkere Reaktion, größere Werte = stabilere Kontrolle

// ===== PERFORMANCE =====
export const COLLISION_CHECK_DISTANCE = 200; // Only check platforms within this distance (px)
export const BACKGROUND_LAYER_UPDATE_THRESHOLD = 10; // Update background layer every N pixels scrolled
