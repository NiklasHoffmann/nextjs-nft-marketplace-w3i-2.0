/**
 * useGameInput Hook
 * 
 * Verwaltet Keyboard und Touch Input für Game Controls
 */

import { useEffect, useCallback, useState } from 'react';
import type { KeyboardState, TouchButtonState } from '../types';

export function useGameInput() {
    const [keys, setKeys] = useState<KeyboardState>({
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        Space: false,
        KeyA: false,
        KeyD: false,
        KeyW: false,
    });

    const [touchButtons, setTouchButtons] = useState<TouchButtonState>({
        left: false,
        right: false,
        jump: false,
    });

    /**
     * Keyboard Event Handlers
     */
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const key = e.code as keyof KeyboardState;
        if (key in keys) {
            e.preventDefault();
            setKeys(prev => ({ ...prev, [key]: true }));
        }
    }, [keys]);

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        const key = e.code as keyof KeyboardState;
        if (key in keys) {
            e.preventDefault();
            setKeys(prev => ({ ...prev, [key]: false }));
        }
    }, [keys]);

    /**
     * Touch Button Handlers
     */
    const handleTouchButton = useCallback((
        button: keyof TouchButtonState,
        pressed: boolean
    ) => {
        setTouchButtons(prev => ({ ...prev, [button]: pressed }));
    }, []);

    /**
     * Check if moving left
     */
    const isMovingLeft = useCallback(() => {
        return keys.ArrowLeft || keys.KeyA || touchButtons.left;
    }, [keys, touchButtons]);

    /**
     * Check if moving right
     */
    const isMovingRight = useCallback(() => {
        return keys.ArrowRight || keys.KeyD || touchButtons.right;
    }, [keys, touchButtons]);

    /**
     * Check if jumping
     */
    const isJumping = useCallback(() => {
        return keys.ArrowUp || keys.Space || keys.KeyW || touchButtons.jump;
    }, [keys, touchButtons]);

    /**
     * Reset all inputs
     */
    const resetInput = useCallback(() => {
        setKeys({
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            Space: false,
            KeyA: false,
            KeyD: false,
            KeyW: false,
        });
        setTouchButtons({
            left: false,
            right: false,
            jump: false,
        });
    }, []);

    /**
     * Setup keyboard listeners
     */
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    return {
        keys,
        touchButtons,
        isMovingLeft,
        isMovingRight,
        isJumping,
        handleTouchButton,
        resetInput,
    };
}
