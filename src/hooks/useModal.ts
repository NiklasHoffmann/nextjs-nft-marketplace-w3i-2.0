/**
 * Custom Hook for Modal State Management
 * 
 * Eliminates repetitive modal state code across components.
 * 
 * @example
 * ```tsx
 * const buyModal = useModal();
 * const updateModal = useModal();
 * 
 * <button onClick={buyModal.open}>Buy Now</button>
 * <BaseModal isOpen={buyModal.isOpen} onClose={buyModal.close}>
 *   Content
 * </BaseModal>
 * ```
 */

import { useState, useCallback } from 'react';

export interface UseModalReturn {
    /** Whether modal is open */
    isOpen: boolean;

    /** Open the modal */
    open: () => void;

    /** Close the modal */
    close: () => void;

    /** Toggle modal state */
    toggle: () => void;

    /** Set modal state directly */
    setIsOpen: (isOpen: boolean) => void;
}

/**
 * Hook for managing modal state
 */
export function useModal(initialState = false): UseModalReturn {
    const [isOpen, setIsOpen] = useState(initialState);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    return {
        isOpen,
        open,
        close,
        toggle,
        setIsOpen,
    };
}
