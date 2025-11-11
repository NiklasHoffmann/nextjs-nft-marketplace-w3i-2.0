/**
 * Scoring Utility Functions
 * 
 * Funktionen zur Score-Berechnung und Combo-System
 */

import { SCORING, LEVEL_CONFIG } from '../constants/game.constants';

/**
 * Berechnet den Score für eine gelandete Plattform
 */
export function calculatePlatformScore(
    platformNumber: number,
    combo: number
): number {
    const baseScore = SCORING.platformPoints;
    const comboBonus = combo * SCORING.comboBonus;
    const multiplier = SCORING.comboMultiplier(combo);
    
    return Math.floor((baseScore + comboBonus) * multiplier);
}

/**
 * Berechnet den Gesamt-Score basierend auf Statistiken
 */
export function calculateTotalScore(
    platformsClimbed: number,
    maxCombo: number,
    highestPlatform: number
): number {
    let total = 0;
    
    // Score für jede Plattform
    for (let i = 0; i < platformsClimbed; i++) {
        // Vereinfachte Berechnung ohne Combo-History
        const avgComboScore = Math.floor(maxCombo / 2);
        total += calculatePlatformScore(i, avgComboScore);
    }
    
    // Bonus für hohe Combos
    if (maxCombo >= 10) {
        total += maxCombo * 50;
    }
    
    // Höhen-Bonus
    const heightBonus = highestPlatform * 5;
    total += heightBonus;
    
    return total;
}

/**
 * Berechnet das Level basierend auf der Plattform-Nummer
 */
export function calculateLevel(platformNumber: number): number {
    return Math.floor(platformNumber / LEVEL_CONFIG.platformsPerLevel) + 1;
}

/**
 * Berechnet die Punkte für eine Combo
 */
export function getComboPoints(combo: number): number {
    if (combo < 3) return 0;
    
    return Math.floor(
        combo * SCORING.comboBonus * SCORING.comboMultiplier(combo)
    );
}

/**
 * Formatiert den Score für die Anzeige
 */
export function formatScore(score: number): string {
    return score.toLocaleString('de-DE');
}

/**
 * Berechnet ob ein neuer Highscore erreicht wurde
 */
export function isNewHighscore(currentScore: number, previousBest: number): boolean {
    return currentScore > previousBest;
}

/**
 * Gibt einen Rang-String basierend auf dem Score zurück
 */
export function getScoreRank(score: number): string {
    if (score >= 100000) return 'Legendary';
    if (score >= 50000) return 'Master';
    if (score >= 25000) return 'Expert';
    if (score >= 10000) return 'Advanced';
    if (score >= 5000) return 'Intermediate';
    if (score >= 1000) return 'Beginner';
    return 'Novice';
}

/**
 * Berechnet den Fortschritt zum nächsten Level in Prozent
 */
export function getLevelProgress(platformNumber: number): number {
    const currentLevelPlatforms = platformNumber % LEVEL_CONFIG.platformsPerLevel;
    return (currentLevelPlatforms / LEVEL_CONFIG.platformsPerLevel) * 100;
}

/**
 * Gibt die Anzahl der Plattformen zurück, die für das nächste Level fehlen
 */
export function getPlatformsToNextLevel(platformNumber: number): number {
    const currentLevelPlatforms = platformNumber % LEVEL_CONFIG.platformsPerLevel;
    return LEVEL_CONFIG.platformsPerLevel - currentLevelPlatforms;
}
