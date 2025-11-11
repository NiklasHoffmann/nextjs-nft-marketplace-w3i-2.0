/**
 * Particle System Utility
 * 
 * Funktionen zur Erstellung und Verwaltung von Partikel-Effekten
 */

import type { Particle } from '../types/game.types';
import { PARTICLE_CONFIG } from '../constants/game.constants';

/**
 * Erstellt Partikel-Effekte für eine Landing-Animation
 */
export function createLandingParticles(
    x: number,
    y: number,
    color: string = '#fbbf24'
): Particle[] {
    const particles: Particle[] = [];
    
    for (let i = 0; i < PARTICLE_CONFIG.landingParticles; i++) {
        const angle = (Math.PI * 2 * i) / PARTICLE_CONFIG.landingParticles;
        const speed = 2 + Math.random() * PARTICLE_CONFIG.velocityRange;
        
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: PARTICLE_CONFIG.lifetime,
            color,
            size: PARTICLE_CONFIG.size,
        });
    }
    
    return particles;
}

/**
 * Aktualisiert alle Partikel (Physik und Lebensdauer)
 */
export function updateParticles(particles: Particle[]): Particle[] {
    return particles
        .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.3, // Gravitation
            life: particle.life - 1,
            size: particle.size * 0.95, // Schrumpfen
        }))
        .filter(particle => particle.life > 0);
}

/**
 * Zeichnet alle Partikel auf den Canvas
 */
export function drawParticles(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    cameraY: number
): void {
    particles.forEach(particle => {
        const alpha = particle.life / PARTICLE_CONFIG.lifetime;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(
            particle.x,
            particle.y - cameraY,
            particle.size,
            0,
            Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
    });
}

/**
 * Erstellt Combo-Partikel mit speziellem Effekt
 */
export function createComboParticles(
    x: number,
    y: number,
    combo: number
): Particle[] {
    const particleCount = Math.min(combo * 2, 20);
    const particles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 3 + Math.random() * 2;
        
        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            life: PARTICLE_CONFIG.lifetime + 10,
            color: i % 2 === 0 ? '#fbbf24' : '#f59e0b',
            size: 4,
        });
    }
    
    return particles;
}

/**
 * Erstellt Jump-Partikel beim Absprung
 */
export function createJumpParticles(
    x: number,
    y: number,
    direction: number
): Particle[] {
    const particles: Particle[] = [];
    
    for (let i = 0; i < 4; i++) {
        particles.push({
            x: x + Math.random() * 10 - 5,
            y: y + 5,
            vx: (Math.random() - 0.5) * 2 - direction,
            vy: Math.random() * 2 + 1,
            life: 15,
            color: '#94a3b8',
            size: 2,
        });
    }
    
    return particles;
}
