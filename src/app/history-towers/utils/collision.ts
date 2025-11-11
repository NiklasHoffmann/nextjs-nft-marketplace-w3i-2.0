/**
 * Collision Detection Utility
 * 
 * Funktionen zur Kollisionserkennung zwischen Spieler und Plattformen
 */

import type { Player, Platform } from '../types/game.types';

/**
 * Prüft ob der Spieler mit einer Plattform kollidiert
 */
export function checkCollision(player: Player, platform: Platform): boolean {
    return (
        player.x < platform.x + platform.width &&
        player.x + player.width > platform.x &&
        player.y + player.height >= platform.y &&
        player.y + player.height <= platform.y + platform.height + 5 &&
        player.velocityY >= 0
    );
}

/**
 * Prüft alle Plattformen und gibt die erste Kollision zurück
 */
export function findCollisionPlatform(
    player: Player,
    platforms: Platform[]
): Platform | null {
    for (const platform of platforms) {
        if (checkCollision(player, platform)) {
            return platform;
        }
    }
    return null;
}

/**
 * Prüft ob der Spieler aus dem Canvas gefallen ist
 */
export function isPlayerOutOfBounds(
    player: Player,
    cameraY: number,
    canvasHeight: number
): boolean {
    return player.y > cameraY + canvasHeight + 100;
}

/**
 * Begrenzt die Spieler-Position horizontal im Canvas
 */
export function clampPlayerX(player: Player, canvasWidth: number): number {
    if (player.x < 0) return 0;
    if (player.x + player.width > canvasWidth) return canvasWidth - player.width;
    return player.x;
}

/**
 * Berechnet die Distanz zwischen Spieler und Plattform
 */
export function getDistanceToPlatform(player: Player, platform: Platform): number {
    const playerCenterX = player.x + player.width / 2;
    const playerBottomY = player.y + player.height;
    const platformCenterX = platform.x + platform.width / 2;
    const platformTopY = platform.y;
    
    const dx = playerCenterX - platformCenterX;
    const dy = playerBottomY - platformTopY;
    
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Prüft ob der Spieler eine Plattform verfehlt hat
 */
export function hasMissedPlatform(
    player: Player,
    platform: Platform,
    threshold: number = 50
): boolean {
    const playerBottom = player.y + player.height;
    return playerBottom > platform.y + threshold && player.velocityY > 0;
}
