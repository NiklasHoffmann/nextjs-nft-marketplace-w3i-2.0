/**
 * Platform Generator Utility
 * 
 * Funktionen zur Generierung und Verwaltung von Plattformen
 */

import type { Platform } from '../types/game.types';
import { GAME_CONFIG, LEVEL_CONFIG, COLORS } from '../constants/game.constants';

/**
 * Generiert eine neue Plattform
 */
export function generatePlatform(platformNumber: number): Platform {
    const level = Math.floor(platformNumber / LEVEL_CONFIG.platformsPerLevel) + 1;
    const difficulty = Math.min(
        1 + (level - 1) * 0.1,
        LEVEL_CONFIG.maxDifficulty
    );
    
    // Plattform-Breite nimmt mit Level ab
    const widthRange = GAME_CONFIG.maxPlatformWidth - GAME_CONFIG.minPlatformWidth;
    const width = Math.max(
        GAME_CONFIG.minPlatformWidth,
        GAME_CONFIG.maxPlatformWidth - (difficulty - 1) * widthRange * 0.5
    );
    
    // Random X-Position (mit Padding)
    const padding = 50;
    const maxX = GAME_CONFIG.canvasWidth - width - padding;
    const x = padding + Math.random() * (maxX - padding);
    
    // Y-Position basierend auf Nummer
    const y = GAME_CONFIG.canvasHeight - platformNumber * GAME_CONFIG.platformGap;
    
    return {
        x,
        y,
        width,
        height: 20,
        number: platformNumber,
        color: getPlatformColor(platformNumber),
        offset: 0,
    };
}

/**
 * Gibt die Farbe für eine Plattform basierend auf der Nummer zurück
 */
export function getPlatformColor(platformNumber: number): string {
    const level = Math.floor(platformNumber / LEVEL_CONFIG.platformsPerLevel);
    
    // Farbverlauf durch Level
    const hue = (platformNumber * 2) % 360;
    const saturation = 60 + (level * 5) % 20;
    const lightness = 50 + (level * 3) % 10;
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Initialisiert die Start-Plattformen
 */
export function initializePlatforms(): Platform[] {
    const platforms: Platform[] = [];
    
    // Start-Plattform (breiter und stabiler)
    platforms.push({
        x: 200,
        y: 750,
        width: 200,
        height: 20,
        number: 0,
        color: COLORS.platformBase,
        offset: 0,
    });
    
    // Generiere weitere Plattformen
    for (let i = 1; i <= 15; i++) {
        platforms.push(generatePlatform(i));
    }
    
    return platforms;
}

/**
 * Prüft ob neue Plattformen generiert werden müssen
 */
export function shouldGenerateMorePlatforms(
    platforms: Platform[],
    cameraY: number
): boolean {
    if (platforms.length === 0) return true;
    
    const highestPlatform = platforms[platforms.length - 1];
    if (!highestPlatform) return true;
    
    const viewportTop = cameraY;
    
    // Generiere neue Plattformen wenn die höchste Plattform nahe dem Viewport ist
    return highestPlatform.y > viewportTop - GAME_CONFIG.canvasHeight * 2;
}

/**
 * Entfernt Plattformen die zu weit unter dem Viewport sind
 */
export function cleanupOldPlatforms(
    platforms: Platform[],
    cameraY: number
): Platform[] {
    const viewportBottom = cameraY + GAME_CONFIG.canvasHeight;
    
    return platforms.filter(platform => 
        platform.y < viewportBottom + 200
    );
}

/**
 * Berechnet die Schwierigkeit basierend auf dem Level
 */
export function getDifficulty(platformNumber: number): number {
    const level = Math.floor(platformNumber / LEVEL_CONFIG.platformsPerLevel) + 1;
    return Math.min(
        1 + (level - 1) * 0.1,
        LEVEL_CONFIG.maxDifficulty
    );
}

/**
 * Gibt das aktuelle Level basierend auf der Plattform-Nummer zurück
 */
export function getCurrentLevel(platformNumber: number): number {
    return Math.floor(platformNumber / LEVEL_CONFIG.platformsPerLevel) + 1;
}
