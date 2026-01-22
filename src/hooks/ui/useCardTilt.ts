/**
 * useCardTilt Hook - 3D Card Tilt Effect
 * 
 * Provides smooth 3D tilt effect for card components based on mouse movement.
 * Optimized with RAF (RequestAnimationFrame) for 60fps performance.
 * 
 * Features:
 * - Smooth 3D perspective transformation
 * - Edge damping to prevent harsh rotations
 * - Touch support for mobile devices
 * - Automatic cleanup and memory management
 */

import { useCallback, useRef, useState } from 'react';

interface TiltStyle {
    transform: string;
    transformOrigin: string;
    transition: string;
}

interface TiltHandlers {
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseEnter: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
}

interface UseCardTiltReturn {
    /** Ref to attach to the card element */
    cardRef: React.RefObject<HTMLDivElement>;
    /** Style object to apply tilt transform */
    tiltStyle: TiltStyle;
    /** Event handlers for mouse/touch interactions */
    handlers: TiltHandlers;
}

interface UseCardTiltOptions {
    /** Maximum tilt angle in degrees (default: 15) */
    maxTilt?: number;
    /** Animation scale on hover (default: 1.02) */
    scale?: number;
    /** Perspective distance in pixels (default: 1000) */
    perspective?: number;
    /** Damping factor for edge smoothing (0-1, default: 0.8) */
    dampingFactor?: number;
    /** Edge threshold for damping (0-1, default: 0.85) */
    edgeThreshold?: number;
    /** Disable tilt effect */
    disabled?: boolean;
}

export function useCardTilt(options: UseCardTiltOptions = {}): UseCardTiltReturn {
    const {
        maxTilt = 15,
        scale = 1.02,
        perspective = 1000,
        dampingFactor = 0.8,
        edgeThreshold = 0.85,
        disabled = false
    } = options;

    // Refs
    const cardRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number>();
    const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isHoveringRef = useRef(false);
    const isFirstHoverRef = useRef(true);

    // State
    const [currentRotation, setCurrentRotation] = useState({ rotateX: 0, rotateY: 0 });
    const [tiltStyle, setTiltStyle] = useState<TiltStyle>({
        transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg)`,
        transformOrigin: 'center center',
        transition: 'none',
    });

    // Calculate tilt based on mouse position with RAF optimization
    const calculateTilt = useCallback((clientX: number, clientY: number) => {
        if (disabled || !cardRef.current) return;

        // Cancel any pending animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
            if (!cardRef.current) return;

            const rect = cardRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Calculate raw rotation values
            let rotateY = ((clientX - centerX) / (rect.width / 2)) * maxTilt;
            let rotateX = ((centerY - clientY) / (rect.height / 2)) * maxTilt;

            // Calculate distance from center (0 = center, 1 = edge)
            const distanceFromCenterX = Math.abs((clientX - centerX) / (rect.width / 2));
            const distanceFromCenterY = Math.abs((clientY - centerY) / (rect.height / 2));

            // Apply smooth damping near edges
            if (distanceFromCenterX > edgeThreshold) {
                const dampingX = 1 - ((distanceFromCenterX - edgeThreshold) / (1 - edgeThreshold)) * (1 - dampingFactor);
                rotateY *= dampingX;
            }

            if (distanceFromCenterY > edgeThreshold) {
                const dampingY = 1 - ((distanceFromCenterY - edgeThreshold) / (1 - edgeThreshold)) * (1 - dampingFactor);
                rotateX *= dampingY;
            }

            // Smooth clamp to prevent extreme values
            rotateY = Math.max(-maxTilt, Math.min(maxTilt, rotateY));
            rotateX = Math.max(-maxTilt, Math.min(maxTilt, rotateX));

            // Apply smooth tilt transformation with fixed transform-origin
            setCurrentRotation({ rotateX, rotateY });
            setTiltStyle({
                transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`,
                transformOrigin: 'center center',
                transition: isFirstHoverRef.current ? 'transform 0.4s ease-out' : 'none',
            });

            // After first hover, disable the smooth entry transition
            if (isFirstHoverRef.current) {
                setTimeout(() => {
                    isFirstHoverRef.current = false;
                }, 400); // Match the transition duration
            }
        });
    }, [disabled, maxTilt, scale, perspective, dampingFactor, edgeThreshold]);

    // Reset tilt to neutral position
    const resetTilt = useCallback(() => {
        if (disabled) return;

        // Cancel any pending animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        setCurrentRotation({ rotateX: 0, rotateY: 0 });
        setTiltStyle({
            transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease-out',
        });
    }, [disabled, perspective]);

    // Mouse event handlers
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (disabled || !isHoveringRef.current) return;
        calculateTilt(e.clientX, e.clientY);
    }, [disabled, calculateTilt]);

    const handleMouseEnter = useCallback((e: React.MouseEvent) => {
        if (disabled) return;

        // Clear any pending leave timeout
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
            leaveTimeoutRef.current = null;
        }

        isHoveringRef.current = true;
        calculateTilt(e.clientX, e.clientY);
    }, [disabled, calculateTilt]);

    const handleMouseLeave = useCallback(() => {
        if (disabled) return;

        // Set flag immediately but delay the actual reset
        isHoveringRef.current = false;

        // Clear any existing timeout
        if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
        }

        // Add a small delay to prevent flickering at edges
        leaveTimeoutRef.current = setTimeout(() => {
            if (!isHoveringRef.current) {
                // Reset first hover flag for next time
                isFirstHoverRef.current = true;
                resetTilt();
            }
        }, 100); // 100ms delay
    }, [disabled, resetTilt]);

    // Touch event handlers for mobile
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (disabled || e.touches.length === 0) return;
        e.preventDefault();
        const touch = e.touches[0];
        if (touch) {
            calculateTilt(touch.clientX, touch.clientY);
        }
    }, [disabled, calculateTilt]);

    const handleTouchEnd = useCallback(() => {
        if (disabled) return;
        resetTilt();
    }, [disabled, resetTilt]);

    return {
        cardRef,
        tiltStyle,
        handlers: {
            onMouseMove: handleMouseMove,
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
        },
    };
}
