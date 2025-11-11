/**
 * Game Constants for History Towers
 * 
 * Zentrale Konfiguration für Physik, Gameplay und UI
 */

import type { GameConfig } from '../types/game.types';

/**
 * Physik und Gameplay Konfiguration
 */
export const GAME_CONFIG: GameConfig = {
    // Physik
    gravity: 0.8,
    jumpPower: -16,
    moveSpeed: 0.8,
    maxSpeedX: 8,
    friction: 0.85,
    
    // Plattformen
    minPlatformWidth: 80,
    maxPlatformWidth: 200,
    platformGap: 80,
    
    // Canvas
    canvasWidth: 600,
    canvasHeight: 800,
};

/**
 * Spieler-Dimensionen
 */
export const PLAYER = {
    width: 30,
    height: 30,
    startX: 285,
    startY: 700,
} as const;

/**
 * Farben für UI und Game-Elemente
 */
export const COLORS = {
    // Hintergrund
    background: '#f8f9fa',
    
    // Spieler
    player: '#3b82f6',
    playerShadow: 'rgba(59, 130, 246, 0.3)',
    
    // Plattformen
    platformBase: '#6366f1',
    platformHighlight: '#8b5cf6',
    platformShadow: 'rgba(99, 102, 241, 0.2)',
    
    // Combo
    comboGold: '#fbbf24',
    comboText: '#f59e0b',
    
    // UI
    scoreText: '#1f2937',
    levelText: '#6b7280',
    pauseOverlay: 'rgba(0, 0, 0, 0.7)',
    pauseText: '#ffffff',
    
    // Buttons
    buttonPrimary: '#3b82f6',
    buttonSuccess: '#10b981',
    buttonDanger: '#ef4444',
    buttonSecondary: '#6b7280',
} as const;

/**
 * Level-System Konfiguration
 */
export const LEVEL_CONFIG = {
    /** Plattformen pro Level */
    platformsPerLevel: 50,
    
    /** Schwierigkeits-Skalierung pro Level */
    difficultyMultiplier: 1.15,
    
    /** Maximale Schwierigkeit */
    maxDifficulty: 3.0,
} as const;

/**
 * Partikel-Effekt Konfiguration
 */
export const PARTICLE_CONFIG = {
    /** Anzahl Partikel beim Landen */
    landingParticles: 8,
    
    /** Lebensdauer in Frames */
    lifetime: 20,
    
    /** Größe der Partikel */
    size: 3,
    
    /** Geschwindigkeit */
    velocityRange: 3,
} as const;

/**
 * Score-System
 */
export const SCORING = {
    /** Punkte pro Plattform */
    platformPoints: 10,
    
    /** Bonus pro Combo-Level */
    comboBonus: 5,
    
    /** Multiplier für lange Combos */
    comboMultiplier: (combo: number) => 1 + Math.floor(combo / 5) * 0.5,
} as const;

/**
 * Touch Control Konfiguration
 */
export const TOUCH_CONTROLS = {
    /** Höhe der Control-Leiste */
    height: 100,
    
    /** Button-Größe */
    buttonSize: 60,
    
    /** Gap zwischen Buttons */
    gap: 10,
} as const;

/**
 * Animation Timings
 */
export const ANIMATION = {
    /** Frame-Rate Target */
    targetFPS: 60,
    
    /** Frame-Zeit in ms */
    frameTime: 1000 / 60,
    
    /** Smooth Scroll Speed */
    scrollSpeed: 0.1,
} as const;

/**
 * Camera Konfiguration
 */
export const CAMERA = {
    /** Folge-Geschwindigkeit */
    followSpeed: 0.1,
    
    /** Offset vom Spieler */
    offsetY: 300,
    
    /** Maximaler Vorsprung */
    maxLeadY: 200,
} as const;

/**
 * API Endpoints
 */
export const API = {
    /** Score Submit */
    submitScore: '/api/game/scores',
    
    /** Get Scores */
    getScores: '/api/game/scores',
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
    bestScore: 'history-towers-best-score',
    sessionId: 'history-towers-session',
} as const;
