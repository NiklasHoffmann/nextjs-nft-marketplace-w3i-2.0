/**
 * FormField Component
 * 
 * Standardized form field wrapper with built-in validation display.
 * Eliminates repetitive field markup across all forms.
 * 
 * Features:
 * - Label + input wrapper
 * - Error message display
 * - Optional helper text
 * - Required indicator
 * - Icon support
 * - Consistent styling
 * 
 * @example
 * ```tsx
 * <FormField
 *   label="Price"
 *   name="price"
 *   required
 *   error={errors.price}
 *   helperText="Enter price in ETH"
 * >
 *   <input {...getFieldProps('price')} />
 * </FormField>
 * ```
 */
'use client'
import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ===== TYPES =====

export interface FormFieldProps {
    /** Field label */
    label: string;
    /** Field name (for htmlFor) */
    name: string;
    /** Required field indicator */
    required?: boolean;
    /** Error message */
    error?: string;
    /** Helper text (shown below input) */
    helperText?: string;
    /** Optional icon */
    icon?: ReactNode;
    /** Custom label classes */
    labelClassName?: string;
    /** Custom wrapper classes */
    className?: string;
    /** Input element */
    children: ReactNode;
}

// ===== COMPONENT =====

export const FormField = memo<FormFieldProps>(({
    label,
    name,
    required = false,
    error,
    helperText,
    icon,
    labelClassName,
    className,
    children
}) => {
    const hasError = Boolean(error);

    return (
        <div className={cn('space-y-1.5', className)}>
            {/* Label */}
            <label
                htmlFor={name}
                className={cn(
                    'flex items-center gap-2 text-sm font-medium',
                    hasError ? 'text-red-600' : 'text-gray-700',
                    labelClassName
                )}
            >
                {icon && (
                    <span className={cn(
                        'flex-shrink-0',
                        hasError ? 'text-red-500' : 'text-gray-400'
                    )}>
                        {icon}
                    </span>
                )}
                <span>{label}</span>
                {required && (
                    <span className="text-red-500" aria-label="required">
                        *
                    </span>
                )}
            </label>

            {/* Input Wrapper */}
            <div className="relative">
                {children}
            </div>

            {/* Error Message */}
            {hasError && (
                <p className="flex items-center gap-1.5 text-xs text-red-600" role="alert">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                </p>
            )}

            {/* Helper Text */}
            {!hasError && helperText && (
                <p className="text-xs text-gray-500">
                    {helperText}
                </p>
            )}
        </div>
    );
});

FormField.displayName = 'FormField';

// ===== INPUT VARIANTS =====

/**
 * Pre-styled text input
 */
export const TextInput = memo<React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(({
    error,
    className,
    ...props
}) => {
    return (
        <input
            {...props}
            className={cn(
                'w-full px-4 py-3 rounded-xl border transition-colors',
                'focus:outline-none focus:ring-2',
                error
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
                'disabled:bg-gray-100 disabled:cursor-not-allowed',
                className
            )}
        />
    );
});

TextInput.displayName = 'TextInput';

/**
 * Pre-styled textarea
 */
export const TextArea = memo<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }>(({
    error,
    className,
    ...props
}) => {
    return (
        <textarea
            {...props}
            className={cn(
                'w-full px-4 py-3 rounded-xl border transition-colors resize-none',
                'focus:outline-none focus:ring-2',
                error
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
                'disabled:bg-gray-100 disabled:cursor-not-allowed',
                className
            )}
        />
    );
});

TextArea.displayName = 'TextArea';

/**
 * Pre-styled select
 */
export const Select = memo<React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }>(({
    error,
    className,
    ...props
}) => {
    return (
        <select
            {...props}
            className={cn(
                'w-full px-4 py-3 rounded-xl border transition-colors',
                'focus:outline-none focus:ring-2',
                'bg-white cursor-pointer',
                error
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200',
                'disabled:bg-gray-100 disabled:cursor-not-allowed',
                className
            )}
        />
    );
});

Select.displayName = 'Select';

export default FormField;
