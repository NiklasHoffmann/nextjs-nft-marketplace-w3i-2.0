/**
 * HistoryJumper V2
 * 
 * Completely rewritten version using custom hooks architecture.
 * Features:
 * - Tower design with brick pattern and windows
 * - Character images in windows
 * - Motion control support (gyroscope)
 * - All game logic in custom hooks
 * - Clean, maintainable code (~500 lines vs 1000+)
 */

'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import {
    useGameState,
    useGameInput,
    useGamePhysics,
    useScoreManager,
} from '../hooks';
import { GAME_CONFIG, COLORS } from '../constants';
import HighscoreDialog from './HighscoreDialog';

// Tower-specific constants
const CANVAS_WIDTH = GAME_CONFIG.canvasWidth;
const CANVAS_HEIGHT = GAME_CONFIG.canvasHeight;
const BRICK_WIDTH = 40;
const BRICK_HEIGHT = 20;
const BACKGROUND_SCROLL_SPEED = 0.5;
const WINDOW_WIDTH = 60;
const WINDOW_HEIGHT = 80;
const WINDOW_ARCH_HEIGHT = 20;
const WINDOW_SPACING = 100;
const CHARACTER_SIZE_IN_WINDOW = 50;

// Tower colors
const TOWER_COLORS = {
    brick: '#8B4513',
    brickBorder: '#654321',
    window: {
        inner: '#87CEEB',
        border: '#DAA520',
    },
};

// Available character images for tower windows
const AVAILABLE_CHARACTERS = [
    '/media/game/character1.png',
    '/media/game/character2.png',
    '/media/game/character3.png',
    '/media/game/character4.png',
    '/media/game/character5.png',
    '/media/game/character6.png',
    '/media/game/character7.png',
    '/media/game/character8.png',
];

interface HistoryJumperV2Props {
    onGameStateChange?: (isActive: boolean) => void;
    onLeaderboardRefresh?: (trigger: number) => void;
}

export default function HistoryJumperV2({
    onGameStateChange,
    onLeaderboardRefresh,
}: HistoryJumperV2Props) {
    const { address } = useAccount();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>();
    const lastTimeRef = useRef<number>();
    
    // Tower-specific refs
    const backgroundScrollRef = useRef(0);
    const playerImageRef = useRef<HTMLImageElement | null>(null);
    const playerCharacterPath = useRef<string>('');
    const windowCharactersRef = useRef<HTMLImageElement[]>([]);

    // UI State
    const [running, setRunning] = useState(false);
    const [paused, setPaused] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [showHighscoreDialog, setShowHighscoreDialog] = useState(false);
    const [motionEnabled, setMotionEnabled] = useState(false);
    const [motionPermission, setMotionPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
    const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
    
    // Custom score state (Tower uses distance-based scoring)
    const [distanceScore, setDistanceScore] = useState(0);
    
    // Track counted platforms (for scoring)
    const countedPlatformsRef = useRef<Set<number>>(new Set());

    // Custom Hooks
    const gameState = useGameState();
    const input = useGameInput();
    const physics = useGamePhysics();
    const scoreManager = useScoreManager({ walletAddress: address });

    // Notify parent component
    useEffect(() => {
        onGameStateChange?.(running && !paused);
    }, [running, paused, onGameStateChange]);

    useEffect(() => {
        onLeaderboardRefresh?.(leaderboardRefresh);
    }, [leaderboardRefresh, onLeaderboardRefresh]);

    // Load personal best
    useEffect(() => {
        scoreManager.fetchPersonalBest();
    }, [address, leaderboardRefresh]);

    // Load player and window character images
    useEffect(() => {
        // Random player character
        const randomPlayerIndex = Math.floor(Math.random() * AVAILABLE_CHARACTERS.length);
        const playerSrc: string = AVAILABLE_CHARACTERS[randomPlayerIndex] || AVAILABLE_CHARACTERS[0] || '';
        if (!playerSrc) return;
        
        playerCharacterPath.current = playerSrc;

        const img = new Image();
        img.src = playerSrc;
        img.onload = () => {
            playerImageRef.current = img;
        };

        // Load window characters (excluding player)
        const loadWindowCharacters = () => {
            AVAILABLE_CHARACTERS.forEach((src) => {
                if (src === playerSrc) return;
                const charImg = new Image();
                charImg.src = src;
                charImg.onload = () => {
                    if (src !== playerCharacterPath.current) {
                        windowCharactersRef.current.push(charImg);
                    }
                };
            });
        };
        loadWindowCharacters();
    }, []);

    /**
     * Draw Rounded Rectangle
     */
    const drawRoundedRect = useCallback((
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        r = 6
    ) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
    }, []);

    /**
     * Draw Tower Background with Bricks and Windows
     */
    const drawTowerBackground = useCallback((
        ctx: CanvasRenderingContext2D,
        cameraY: number
    ) => {
        const scrollOffset = backgroundScrollRef.current * BACKGROUND_SCROLL_SPEED;

        // Draw brick pattern
        for (let y = -BRICK_HEIGHT; y < CANVAS_HEIGHT + BRICK_HEIGHT; y += BRICK_HEIGHT) {
            const rowOffset = Math.floor((y + scrollOffset) / BRICK_HEIGHT) % 2 === 0 ? 0 : BRICK_WIDTH / 2;
            const brickY = y + (scrollOffset % BRICK_HEIGHT);

            for (let x = -BRICK_WIDTH; x < CANVAS_WIDTH + BRICK_WIDTH; x += BRICK_WIDTH) {
                const brickX = x + rowOffset;

                // Brick
                ctx.fillStyle = TOWER_COLORS.brick;
                ctx.fillRect(brickX, brickY, BRICK_WIDTH - 2, BRICK_HEIGHT - 2);

                // Mortar (darker)
                ctx.strokeStyle = TOWER_COLORS.brickBorder;
                ctx.lineWidth = 2;
                ctx.strokeRect(brickX, brickY, BRICK_WIDTH - 2, BRICK_HEIGHT - 2);
            }
        }

        // Draw arched window
        const totalWindowHeight = WINDOW_HEIGHT + WINDOW_ARCH_HEIGHT;
        const scrollPosition = backgroundScrollRef.current * BACKGROUND_SCROLL_SPEED;
        const cyclePosition = scrollPosition % WINDOW_SPACING;
        const currentWindowIndex = Math.floor(scrollPosition / WINDOW_SPACING);

        // Random X position for each window (consistent for same index)
        const randomSeed = (currentWindowIndex * 12345) % 100;
        const minX = 80;
        const maxX = CANVAS_WIDTH - WINDOW_WIDTH - 80;
        const windowX = minX + ((randomSeed / 100) * (maxX - minX));

        // Calculate Y position
        const windowY = -totalWindowHeight + cyclePosition;

        if (windowY < CANVAS_HEIGHT) {
            ctx.save();

            // Window frame
            ctx.fillStyle = TOWER_COLORS.brickBorder;
            drawRoundedRect(ctx, windowX - 4, windowY - 4, WINDOW_WIDTH + 8, totalWindowHeight + 4, 4);

            // Arch path
            ctx.beginPath();
            ctx.moveTo(windowX, windowY + WINDOW_ARCH_HEIGHT + WINDOW_HEIGHT);
            ctx.lineTo(windowX, windowY + WINDOW_ARCH_HEIGHT);
            ctx.quadraticCurveTo(
                windowX + WINDOW_WIDTH / 2,
                windowY - WINDOW_ARCH_HEIGHT,
                windowX + WINDOW_WIDTH,
                windowY + WINDOW_ARCH_HEIGHT
            );
            ctx.lineTo(windowX + WINDOW_WIDTH, windowY + WINDOW_ARCH_HEIGHT + WINDOW_HEIGHT);
            ctx.closePath();

            // Sky in window
            ctx.fillStyle = TOWER_COLORS.window.inner;
            ctx.fill();

            // Stone frame
            ctx.strokeStyle = TOWER_COLORS.window.border;
            ctx.lineWidth = 5;
            ctx.stroke();

            ctx.restore();

            // Draw character in window
            if (windowCharactersRef.current.length > 0) {
                const characterIndex = currentWindowIndex % windowCharactersRef.current.length;
                const character = windowCharactersRef.current[characterIndex];

                if (character && character.complete) {
                    const charSize = CHARACTER_SIZE_IN_WINDOW;
                    const charX = windowX + (WINDOW_WIDTH - charSize) / 2;
                    const charY = windowY + WINDOW_ARCH_HEIGHT + (WINDOW_HEIGHT - charSize) / 2;

                    ctx.drawImage(character, charX, charY, charSize, charSize);
                }
            }
        }
    }, [drawRoundedRect]);

    /**
     * Draw Player with Character Image
     */
    const drawPlayer = useCallback((
        ctx: CanvasRenderingContext2D,
        player: typeof gameState.gameState.player,
        cameraY: number
    ) => {
        const screenY = player.y - cameraY;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(
            player.x + player.width / 2,
            screenY + player.height + 5,
            player.width / 2,
            5,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Player
        if (playerImageRef.current && playerImageRef.current.complete) {
            ctx.drawImage(
                playerImageRef.current,
                player.x,
                screenY,
                player.width,
                player.height
            );
        } else {
            // Fallback rectangle
            ctx.fillStyle = COLORS.player;
            ctx.fillRect(player.x, screenY, player.width, player.height);
        }
    }, []);

    /**
     * Draw Platforms
     */
    const drawPlatforms = useCallback((
        ctx: CanvasRenderingContext2D,
        platforms: typeof gameState.gameState.platforms,
        cameraY: number
    ) => {
        platforms.forEach((platform) => {
            const screenY = platform.y - cameraY;

            // Skip if off-screen
            if (screenY < -50 || screenY > CANVAS_HEIGHT + 50) return;

            // Platform color based on number
            const hue = (platform.number * 15) % 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
            
            // Platform
            ctx.fillRect(platform.x, screenY, platform.width, platform.height);

            // Highlight
            ctx.fillStyle = `hsl(${hue}, 70%, 75%)`;
            ctx.fillRect(platform.x, screenY, platform.width, 3);

            // Platform number
            if (platform.number % 10 === 0) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(
                    platform.number.toString(),
                    platform.x + platform.width / 2,
                    screenY + platform.height / 2 + 4
                );
            }
        });
    }, []);

    /**
     * Draw HUD
     */
    const drawHUD = useCallback((
        ctx: CanvasRenderingContext2D,
        score: number,
        level: number,
        combo: number
    ) => {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 200, 80);

        // Score
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${Math.floor(score)}`, 20, 35);
        ctx.fillText(`Level: ${level}`, 20, 60);
        
        // Combo
        if (combo > 1) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`Combo: x${combo}`, 20, 85);
        }
    }, []);

    /**
     * Main Render Function
     */
    const render = useCallback((ctx: CanvasRenderingContext2D) => {
        const { player, platforms, cameraY, combo, highestPlatformNumber } = gameState.gameState;

        // Clear
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Tower background
        drawTowerBackground(ctx, cameraY);

        // Platforms
        drawPlatforms(ctx, platforms, cameraY);

        // Player
        drawPlayer(ctx, player, cameraY);

        // HUD
        const level = Math.floor(highestPlatformNumber / 50) + 1;
        drawHUD(ctx, distanceScore, level, combo);

        // Pause overlay
        if (paused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 48px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        }
    }, [gameState.gameState, distanceScore, paused, drawTowerBackground, drawPlatforms, drawPlayer, drawHUD]);

    /**
     * Game Step Logic
     */
    const step = useCallback((dt: number) => {
        if (paused || gameOver) return;

        const { player, platforms, cameraY } = gameState.gameState;

        // Update physics
        let updatedPlayer = physics.updatePlayerPhysics(
            player,
            input.isMovingLeft(),
            input.isMovingRight()
        );

        // Handle jump
        if (input.isJumping() && updatedPlayer.onGround) {
            updatedPlayer = physics.handleJump(updatedPlayer);
        }

        // Check collision
        const { player: collidedPlayer, landedPlatform } = physics.checkPlatformCollision(
            updatedPlayer,
            platforms
        );
        updatedPlayer = collidedPlayer;

        // Landing logic
        if (landedPlatform && !countedPlatformsRef.current.has(landedPlatform.number)) {
            countedPlatformsRef.current.add(landedPlatform.number);
            gameState.updateScore(landedPlatform.number * 10);
            gameState.updateCombo(gameState.gameState.combo + 1);
            gameState.updateHighestPlatform(landedPlatform.number);
        }

        // Update camera
        const newCameraY = physics.updateCamera(cameraY, updatedPlayer.y);
        
        // Update background scroll
        if (updatedPlayer.y < player.y) {
            backgroundScrollRef.current += (player.y - updatedPlayer.y);
        }

        // Update distance score
        setDistanceScore(Math.floor(backgroundScrollRef.current / 10));

        // Platform management
        gameState.updatePlatforms(newCameraY);

        // Update player and camera
        gameState.updatePlayer(updatedPlayer);
        gameState.updateCameraY(newCameraY);

        // Game over check
        if (physics.checkOutOfBounds(updatedPlayer, newCameraY)) {
            handleGameOver();
        }
    }, [paused, gameOver, gameState, physics, input]);

    /**
     * Game Loop
     */
    useEffect(() => {
        if (!running || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const loop = (timestamp: number) => {
            if (!lastTimeRef.current) lastTimeRef.current = timestamp;
            const dt = Math.min(0.033, (timestamp - lastTimeRef.current) / 1000);
            lastTimeRef.current = timestamp;

            step(dt);
            render(ctx);

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            lastTimeRef.current = undefined;
        };
    }, [running, step, render]);

    /**
     * Canvas Setup
     */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateSize = () => {
            const container = canvas.parentElement;
            if (!container) return;

            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const targetRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
            const containerRatio = containerWidth / containerHeight;

            let displayWidth, displayHeight;

            if (containerRatio > targetRatio) {
                displayHeight = containerHeight;
                displayWidth = displayHeight * targetRatio;
            } else {
                displayWidth = containerWidth;
                displayHeight = displayWidth / targetRatio;
            }

            canvas.style.width = displayWidth + 'px';
            canvas.style.height = displayHeight + 'px';
        };

        const dpr = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = CANVAS_WIDTH * dpr;
        canvas.height = CANVAS_HEIGHT * dpr;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr);
        }

        updateSize();
        window.addEventListener('resize', updateSize);

        return () => {
            window.removeEventListener('resize', updateSize);
        };
    }, []);

    /**
     * Motion Control (Gyroscope)
     */
    useEffect(() => {
        if (!motionEnabled) return;

        const handleMotion = (event: DeviceOrientationEvent) => {
            if (event.gamma === null) return;

            const tilt = event.gamma;
            const threshold = 8;

            if (tilt < -threshold) {
                input.handleTouchButton('left', true);
                input.handleTouchButton('right', false);
            } else if (tilt > threshold) {
                input.handleTouchButton('right', true);
                input.handleTouchButton('left', false);
            } else {
                input.handleTouchButton('left', false);
                input.handleTouchButton('right', false);
            }
        };

        window.addEventListener('deviceorientation', handleMotion);
        return () => {
            window.removeEventListener('deviceorientation', handleMotion);
        };
    }, [motionEnabled, input]);

    /**
     * Request Motion Permission (iOS)
     */
    const requestMotionPermission = async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission();
                if (permission === 'granted') {
                    setMotionEnabled(true);
                    setMotionPermission('granted');
                } else {
                    setMotionPermission('denied');
                }
            } catch (error) {
                console.error('Error requesting motion permission:', error);
                setMotionPermission('denied');
            }
        } else {
            setMotionEnabled(true);
            setMotionPermission('granted');
        }
    };

    /**
     * Toggle Motion Control
     */
    const toggleMotionControl = () => {
        if (motionEnabled) {
            setMotionEnabled(false);
        } else {
            requestMotionPermission();
        }
    };

    /**
     * Start Game
     */
    const handleStart = () => {
        gameState.resetGame();
        input.resetInput();
        backgroundScrollRef.current = 0;
        countedPlatformsRef.current.clear();
        setDistanceScore(0);
        setGameOver(false);
        setPaused(false);
        setRunning(true);
    };

    /**
     * Game Over
     */
    const handleGameOver = () => {
        setRunning(false);
        setGameOver(true);
        
        if (distanceScore > 100) {
            setShowHighscoreDialog(true);
        }
    };

    /**
     * Pause/Resume
     */
    const handlePauseToggle = () => {
        setPaused(!paused);
    };

    // Touch button handler
    const handleTouchButton = (button: 'left' | 'right' | 'jump', pressed: boolean) => {
        input.handleTouchButton(button, pressed);
    };

    return (
        <div className="relative w-full h-full">
            {/* Canvas */}
            <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full h-full"
            />

            {/* Start Overlay */}
            {!running && !gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900/90 via-purple-900/90 to-pink-900/90 backdrop-blur-sm">
                    <div className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 max-w-sm mx-4">
                        <h2 className="text-4xl font-bold text-white mb-6">History Towers</h2>
                        <div className="space-y-4 text-white/90 text-sm mb-8">
                            <p className="hidden md:block">← → bewegen • ↑ springen</p>
                            <p className="md:hidden">Nutze die Buttons zum Spielen</p>
                            <p className="text-white/70">Klettere den Turm hinauf!</p>
                        </div>
                        {scoreManager.bestScore > 0 && (
                            <div className="bg-white/20 rounded-xl p-4 mb-6">
                                <p className="text-sm text-white/80 mb-1">Highscore</p>
                                <p className="text-3xl font-bold text-yellow-400">{scoreManager.bestScore}</p>
                            </div>
                        )}
                        <button
                            onClick={handleStart}
                            className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
                        >
                            Spiel starten
                        </button>
                    </div>
                </div>
            )}

            {/* Game Over Overlay */}
            {gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-white/20 max-w-sm mx-4">
                        <h2 className="text-3xl font-bold text-white mb-4">Game Over!</h2>
                        <div className="space-y-4">
                            <div className="bg-white/20 rounded-xl p-4">
                                <p className="text-sm text-white/80 mb-1">Dein Score</p>
                                <p className="text-4xl font-bold text-yellow-400">{Math.floor(distanceScore)}</p>
                            </div>
                            {scoreManager.bestScore > 0 && (
                                <div className="bg-white/20 rounded-xl p-4">
                                    <p className="text-sm text-white/80 mb-1">Highscore</p>
                                    <p className="text-2xl font-bold text-emerald-400">{scoreManager.bestScore}</p>
                                </div>
                            )}
                            <button
                                onClick={handleStart}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:scale-105"
                            >
                                Nochmal spielen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pause Button */}
            {running && !gameOver && (
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={handlePauseToggle}
                        className="px-4 py-2 bg-white/90 hover:bg-white rounded-lg font-semibold transition"
                    >
                        {paused ? '▶ Resume' : '⏸ Pause'}
                    </button>
                </div>
            )}

            {/* Motion Control Toggle */}
            <div className="absolute top-4 left-4 z-10 md:hidden">
                <button
                    onClick={toggleMotionControl}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                        motionEnabled
                            ? 'bg-green-500 text-white'
                            : 'bg-white/90 text-gray-900'
                    }`}
                >
                    {motionEnabled ? '📱 Gyro ON' : '📱 Gyro OFF'}
                </button>
            </div>

            {/* Touch Controls (Mobile) */}
            <div className="md:hidden absolute bottom-4 left-0 right-0 px-4 z-10">
                <div className="flex gap-2">
                    <div className="flex-1 flex gap-2">
                        <button
                            onTouchStart={() => handleTouchButton('left', true)}
                            onTouchEnd={() => handleTouchButton('left', false)}
                            onMouseDown={() => handleTouchButton('left', true)}
                            onMouseUp={() => handleTouchButton('left', false)}
                            className="flex-1 h-16 bg-blue-500/90 hover:bg-blue-600/90 text-white text-2xl font-bold rounded-lg transition active:scale-95"
                        >
                            ←
                        </button>
                        <button
                            onTouchStart={() => handleTouchButton('right', true)}
                            onTouchEnd={() => handleTouchButton('right', false)}
                            onMouseDown={() => handleTouchButton('right', true)}
                            onMouseUp={() => handleTouchButton('right', false)}
                            className="flex-1 h-16 bg-blue-500/90 hover:bg-blue-600/90 text-white text-2xl font-bold rounded-lg transition active:scale-95"
                        >
                            →
                        </button>
                    </div>
                    <button
                        onTouchStart={() => handleTouchButton('jump', true)}
                        onTouchEnd={() => handleTouchButton('jump', false)}
                        onMouseDown={() => handleTouchButton('jump', true)}
                        onMouseUp={() => handleTouchButton('jump', false)}
                        className="w-24 h-16 bg-green-500/90 hover:bg-green-600/90 text-white text-2xl font-bold rounded-lg transition active:scale-95"
                    >
                        ↑
                    </button>
                </div>
            </div>

            {/* Highscore Dialog */}
            {showHighscoreDialog && (
                <HighscoreDialog
                    score={distanceScore}
                    level={Math.floor(gameState.gameState.highestPlatformNumber / 50) + 1}
                    platformsClimbed={gameState.gameState.platformsClimbed}
                    walletAddress={address}
                    onClose={() => setShowHighscoreDialog(false)}
                    onSubmitSuccess={(response: { isTopScore?: boolean }) => {
                        if (response.isTopScore) {
                            setLeaderboardRefresh(prev => prev + 1);
                        }
                    }}
                />
            )}
        </div>
    );
}
