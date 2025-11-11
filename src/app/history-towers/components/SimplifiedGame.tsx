/**
 * SimplifiedGame Component
 * 
 * Demo-Komponente die zeigt wie die neuen Hooks verwendet werden.
 * Vereinfachte Version ohne Tower-Design und Motion Controls.
 * 
 * Kann als Basis für zukünftige Migration der Haupt-Komponente dienen.
 */

'use client';

import { useRef, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
    useGameState,
    useGameInput,
    useGamePhysics,
    useGameRenderer,
    useScoreManager,
    useGameLoop,
} from '../hooks';
import { GAME_CONFIG } from '../constants';
import HighscoreDialog from './HighscoreDialog';

interface SimplifiedGameProps {
    onGameStateChange?: (isActive: boolean) => void;
    onLeaderboardRefresh?: (trigger: number) => void;
}

export default function SimplifiedGame({
    onGameStateChange,
    onLeaderboardRefresh,
}: SimplifiedGameProps) {
    const { address } = useAccount();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // UI States
    const [running, setRunning] = useState(false);
    const [paused, setPaused] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [showHighscoreDialog, setShowHighscoreDialog] = useState(false);

    // Custom Hooks
    const gameState = useGameState();
    const input = useGameInput();
    const physics = useGamePhysics();
    const renderer = useGameRenderer(canvasRef);
    const scoreManager = useScoreManager({ walletAddress: address });

    // Game Loop
    useGameLoop({
        gameState: gameState.gameState,
        isRunning: running && !gameOver,
        isPaused: paused,
        onUpdate: gameState.batchUpdate,
        onGameOver: handleGameOver,
        updatePlayer: gameState.updatePlayer,
        addParticles: gameState.addParticles,
        updateParticles: gameState.updateParticles,
        updateScore: gameState.updateScore,
        updateCombo: gameState.updateCombo,
        resetCombo: gameState.resetCombo,
        updateHighestPlatform: gameState.updateHighestPlatform,
        updateCameraY: gameState.updateCameraY,
        updatePlatforms: gameState.updatePlatforms,
        checkPlatformCollision: physics.checkPlatformCollision,
        updatePlayerPhysics: physics.updatePlayerPhysics,
        handleJump: physics.handleJump,
        checkOutOfBounds: physics.checkOutOfBounds,
        updateCamera: physics.updateCamera,
        updateAllParticles: physics.updateAllParticles,
        isMovingLeft: input.isMovingLeft,
        isMovingRight: input.isMovingRight,
        isJumping: input.isJumping,
    });

    // Rendering Loop
    useEffect(() => {
        if (!running) return;

        const animate = () => {
            renderer.render(gameState.gameState, paused);
            requestAnimationFrame(animate);
        };

        const frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [running, paused, gameState.gameState, renderer]);

    // Notify parent of game state changes
    useEffect(() => {
        onGameStateChange?.(running && !paused);
    }, [running, paused, onGameStateChange]);

    /**
     * Start Game
     */
    function handleStart() {
        gameState.resetGame();
        input.resetInput();
        setGameOver(false);
        setPaused(false);
        setRunning(true);
    }

    /**
     * Pause/Resume Game
     */
    function handlePauseToggle() {
        setPaused(prev => !prev);
    }

    /**
     * Game Over Handler
     */
    function handleGameOver() {
        setRunning(false);
        setGameOver(true);
        
        // Show highscore dialog if score is significant
        if (gameState.gameState.score > 100) {
            setShowHighscoreDialog(true);
        }
    }

    /**
     * Restart Game
     */
    function handleRestart() {
        handleStart();
    }

    /**
     * Close Highscore Dialog
     */
    function handleCloseDialog() {
        setShowHighscoreDialog(false);
    }

    /**
     * Score Submit Success
     */
    function handleScoreSubmit(response: { isTopScore?: boolean; rank?: number }) {
        if (response.isTopScore) {
            onLeaderboardRefresh?.(Date.now());
        }
    }

    // Touch Button Handlers
    const handleTouchButton = (button: 'left' | 'right' | 'jump', pressed: boolean) => {
        input.handleTouchButton(button, pressed);
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto">
            {/* Canvas */}
            <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
                <canvas
                    ref={canvasRef}
                    width={GAME_CONFIG.canvasWidth}
                    height={GAME_CONFIG.canvasHeight}
                    className="w-full h-auto"
                />

                {/* Start Overlay */}
                {!running && !gameOver && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center">
                            <h2 className="text-4xl font-bold text-white mb-6">
                                History Towers
                            </h2>
                            <p className="text-gray-300 mb-8">
                                Simplified Demo with Custom Hooks
                            </p>
                            <button
                                onClick={handleStart}
                                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition"
                            >
                                Start Game
                            </button>
                        </div>
                    </div>
                )}

                {/* Game Over Overlay */}
                {gameOver && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="text-center text-white">
                            <h2 className="text-4xl font-bold mb-4">Game Over!</h2>
                            <p className="text-2xl mb-2">
                                Score: {gameState.gameState.score.toLocaleString()}
                            </p>
                            <p className="text-lg text-gray-300 mb-6">
                                Level {Math.floor(gameState.gameState.highestPlatformNumber / 50) + 1}
                            </p>
                            {scoreManager.isNewPersonalBest(gameState.gameState.score) && (
                                <p className="text-yellow-400 font-bold mb-4">
                                    🎉 New Personal Best!
                                </p>
                            )}
                            <button
                                onClick={handleRestart}
                                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition"
                            >
                                Play Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Pause Controls */}
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
            </div>

            {/* Touch Controls (Mobile) */}
            <div className="md:hidden mt-4 flex gap-2">
                <div className="flex-1 flex gap-2">
                    <button
                        onTouchStart={() => handleTouchButton('left', true)}
                        onTouchEnd={() => handleTouchButton('left', false)}
                        onMouseDown={() => handleTouchButton('left', true)}
                        onMouseUp={() => handleTouchButton('left', false)}
                        className="flex-1 h-16 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition active:scale-95"
                    >
                        ←
                    </button>
                    <button
                        onTouchStart={() => handleTouchButton('right', true)}
                        onTouchEnd={() => handleTouchButton('right', false)}
                        onMouseDown={() => handleTouchButton('right', true)}
                        onMouseUp={() => handleTouchButton('right', false)}
                        className="flex-1 h-16 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition active:scale-95"
                    >
                        →
                    </button>
                </div>
                <button
                    onTouchStart={() => handleTouchButton('jump', true)}
                    onTouchEnd={() => handleTouchButton('jump', false)}
                    onMouseDown={() => handleTouchButton('jump', true)}
                    onMouseUp={() => handleTouchButton('jump', false)}
                    className="w-24 h-16 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition active:scale-95"
                >
                    ↑
                </button>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-100 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Best Score</div>
                    <div className="text-xl font-bold">
                        {scoreManager.bestScore.toLocaleString()}
                    </div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Current</div>
                    <div className="text-xl font-bold">
                        {gameState.gameState.score.toLocaleString()}
                    </div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Combo</div>
                    <div className="text-xl font-bold">
                        x{gameState.gameState.combo}
                    </div>
                </div>
            </div>

            {/* Keyboard Instructions */}
            <div className="hidden md:block mt-4 text-center text-sm text-gray-600">
                Use ← → to move, ↑ or Space to jump
            </div>

            {/* Highscore Dialog */}
            {showHighscoreDialog && (
                <HighscoreDialog
                    score={gameState.gameState.score}
                    level={Math.floor(gameState.gameState.highestPlatformNumber / 50) + 1}
                    platformsClimbed={gameState.gameState.platformsClimbed}
                    walletAddress={address}
                    onClose={handleCloseDialog}
                    onSubmitSuccess={handleScoreSubmit}
                />
            )}
        </div>
    );
}
