/**
 * Game Input Hook
 * 
 * Manages all input handling for the History Towers game in a centralized manner.
 * Consolidates ~100 lines of input code from the main component.
 * 
 * Supported input methods:
 * - Keyboard controls (Arrow keys, WASD, Space for jump)
 * - Touch controls (on-screen buttons for mobile)
 * - Motion controls (device orientation using DeviceOrientation API)
 * 
 * @returns Input state and control functions
 * 
 * @example
 * ```typescript
 * const { inputState, motionControl, setTouchInput, toggleMotionControl } = useGameInput();
 * 
 * // Check keyboard input
 * if (inputState.left) { // Move left }
 * 
 * // Handle touch button
 * <button onPointerDown={() => setTouchInput('left', true)} />
 * 
 * // Enable motion controls
 * await toggleMotionControl(); // Requests permission and enables
 * ```
 */

import { useEffect, useState, useCallback } from 'react'

export interface GameInputState {
    left: boolean
    right: boolean
    jump: boolean
    motionTilt: number // -1 to 1, for motion control intensity
}

export interface MotionControlState {
    enabled: boolean
    permission: 'granted' | 'denied' | 'prompt'
}

export interface UseGameInputReturn {
    inputState: GameInputState
    motionControl: MotionControlState
    setTouchInput: (action: 'left' | 'right' | 'jump', pressed: boolean) => void
    toggleMotionControl: () => Promise<void>
    resetInput: () => void
}

export function useGameInput(): UseGameInputReturn {
    const [inputState, setInputState] = useState<GameInputState>({
        left: false,
        right: false,
        jump: false,
        motionTilt: 0,
    })

    const [motionControl, setMotionControl] = useState<MotionControlState>({
        enabled: false,
        permission: 'prompt',
    })

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            setInputState(prev => {
                const next = { ...prev }
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') next.left = true
                if (e.code === 'ArrowRight' || e.code === 'KeyD') next.right = true
                if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') next.jump = true
                return next
            })
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            setInputState(prev => {
                const next = { ...prev }
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') next.left = false
                if (e.code === 'ArrowRight' || e.code === 'KeyD') next.right = false
                if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') next.jump = false
                return next
            })
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

    // Motion Control effect
    useEffect(() => {
        if (!motionControl.enabled) return

        const handleMotion = (event: DeviceOrientationEvent) => {
            if (event.gamma === null) return

            // Gamma: -90 (links gekippt) bis +90 (rechts gekippt)
            let tilt = event.gamma

            // Schwellenwerte für Motion Control
            const deadzone = 3  // Deadzone um neutralen Bereich zu ignorieren
            const maxTilt = 30  // Maximum tilt für volle Geschwindigkeit

            // Apply deadzone
            if (Math.abs(tilt) < deadzone) {
                tilt = 0
            } else {
                // Remove deadzone from calculation
                tilt = tilt > 0 ? tilt - deadzone : tilt + deadzone
            }

            // Normalize tilt to -1 to 1 range mit stärkerem Multiplikator
            // Verwende kleineren maxTilt für stärkere Reaktion
            const normalizedTilt = Math.max(-1, Math.min(1, tilt / maxTilt)) * 2.5 // 2.5x multiplier für stärkere Bewegung

            setInputState(prev => {
                const shouldMoveLeft = normalizedTilt < -0.1
                const shouldMoveRight = normalizedTilt > 0.1

                // Update nur wenn sich etwas geändert hat
                if (
                    prev.left === shouldMoveLeft &&
                    prev.right === shouldMoveRight &&
                    Math.abs(prev.motionTilt - normalizedTilt) < 0.05
                ) {
                    return prev // Keine Änderung
                }

                return {
                    ...prev,
                    left: shouldMoveLeft,
                    right: shouldMoveRight,
                    motionTilt: normalizedTilt,
                }
            })
        }

        window.addEventListener('deviceorientation', handleMotion)

        return () => {
            window.removeEventListener('deviceorientation', handleMotion)
        }
    }, [motionControl.enabled])

    const setTouchInput = useCallback((action: 'left' | 'right' | 'jump', pressed: boolean) => {
        setInputState(prev => ({
            ...prev,
            [action]: pressed,
        }))
    }, [])

    const requestMotionPermission = useCallback(async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission()
                if (permission === 'granted') {
                    setMotionControl({
                        enabled: true,
                        permission: 'granted',
                    })
                } else {
                    setMotionControl(prev => ({
                        ...prev,
                        permission: 'denied',
                    }))
                }
            } catch (error) {
                console.error('Error requesting motion permission:', error)
                setMotionControl(prev => ({
                    ...prev,
                    permission: 'denied',
                }))
            }
        } else {
            setMotionControl({
                enabled: true,
                permission: 'granted',
            })
        }
    }, [])

    const toggleMotionControl = useCallback(async () => {
        if (motionControl.enabled) {
            setMotionControl(prev => ({
                ...prev,
                enabled: false,
            }))
            setInputState(prev => ({
                ...prev,
                left: false,
                right: false,
                motionTilt: 0,
            }))
        } else {
            if (motionControl.permission === 'granted') {
                setMotionControl(prev => ({
                    ...prev,
                    enabled: true,
                }))
            } else {
                await requestMotionPermission()
            }
        }
    }, [motionControl.enabled, motionControl.permission, requestMotionPermission])

    const resetInput = useCallback(() => {
        setInputState({
            left: false,
            right: false,
            jump: false,
            motionTilt: 0,
        })
    }, [])

    return {
        inputState,
        motionControl,
        setTouchInput,
        toggleMotionControl,
        resetInput,
    }
}
