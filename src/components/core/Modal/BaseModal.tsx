/**
 * Base Modal Component
 * 
 * Reusable modal wrapper with:
 * - Consistent styling
 * - Accessibility (ARIA, keyboard navigation)
 * - Animation support
 * - Flexible content slots
 * - Size variants
 * 
 * Eliminates duplication across BuyNowModal, CancelListingModal, UpdateListingModal
 * 
 * @example
 * ```tsx
 * <BaseModal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Buy NFT"
 *   size="md"
 * >
 *   <BuyNowContent {...props} />
 * </BaseModal>
 * ```
 */

import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface BaseModalProps {
    /** Whether the modal is open */
    isOpen: boolean;

    /** Callback when modal should close */
    onClose: () => void;

    /** Modal title */
    title: React.ReactNode;

    /** Modal content */
    children: React.ReactNode;

    /** Optional footer content (buttons, etc.) */
    footer?: React.ReactNode;

    /** Size variant */
    size?: 'sm' | 'md' | 'lg' | 'xl';

    /** Additional className for modal content */
    className?: string;

    /** Disable close on backdrop click */
    disableBackdropClick?: boolean;

    /** Disable close on escape key */
    disableEscapeKey?: boolean;

    /** Show close button in header */
    showCloseButton?: boolean;
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

export const BaseModal = React.memo<BaseModalProps>(({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    className,
    disableBackdropClick = false,
    disableEscapeKey = false,
    showCloseButton = true,
}) => {
    // Handle escape key
    const handleEscapeKey = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape' && !disableEscapeKey) {
            onClose();
        }
    }, [onClose, disableEscapeKey]);

    // Handle backdrop click
    const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && !disableBackdropClick) {
            onClose();
        }
    }, [onClose, disableBackdropClick]);

    // Add/remove event listeners
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleEscapeKey]);

    // Don't render if not open
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className={cn(
                    'relative w-full bg-white rounded-2xl shadow-2xl',
                    'transform transition-all duration-300 ease-out',
                    'animate-in fade-in zoom-in-95',
                    sizeClasses[size],
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2
                        id="modal-title"
                        className="text-xl font-semibold text-gray-900"
                    >
                        {title}
                    </h2>
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Close modal"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
});

BaseModal.displayName = 'BaseModal';

export default BaseModal;
