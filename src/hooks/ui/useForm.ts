/**
 * useForm Hook (REFACTORED)
 * 
 * Centralized form state management hook.
 * Eliminates repetitive form code across components.
 * 
 * Features:
 * - Type-safe form state management
 * - Built-in validation (sync & async)
 * - Error handling per field
 * - Touched state tracking
 * - Dirty state detection
 * - Reset functionality
 * - Optional schema validation (Zod support)
 * 
 * Eliminates patterns like:
 * - const [formData, setFormData] = useState({...})
 * - const [errors, setErrors] = useState<Record<string, string>>({})
 * - const handleInputChange = (field, value) => {...}
 * - const validateForm = () => {...}
 * 
 * Used by:
 * - UnifiedListingForm
 * - BatchListingForm
 * - UpdateListingModal
 * - Admin forms
 * 
 * @example
 * ```tsx
 * const form = useForm({
 *   initialValues: {
 *     price: '',
 *     description: ''
 *   },
 *   validate: (values) => {
 *     const errors: any = {};
 *     if (!values.price) errors.price = 'Price is required';
 *     return errors;
 *   },
 *   onSubmit: async (values) => {
 *     await createListing(values);
 *   }
 * });
 * 
 * <input
 *   {...form.getFieldProps('price')}
 *   className={form.errors.price ? 'error' : ''}
 * />
 * ```
 */
'use client'

import { useState, useCallback, useRef, useMemo } from 'react';
import { z } from 'zod';
import { devLog } from '@/utils';

// ===== TYPES =====

export interface UseFormConfig<T extends Record<string, any>> {
    /** Initial form values */
    initialValues: T;

    /** Validation function - return errors object or empty object if valid */
    validate?: (values: T) => Record<keyof T, string> | Partial<Record<keyof T, string>>;

    /** Zod schema for validation (alternative to validate function) */
    schema?: z.ZodSchema<T>;

    /** Submit handler */
    onSubmit?: (values: T) => void | Promise<void>;

    /** Validate on change (default: false) */
    validateOnChange?: boolean;

    /** Validate on blur (default: true) */
    validateOnBlur?: boolean;

    /** Reset form after successful submit (default: false) */
    resetOnSubmit?: boolean;
}

export interface UseFormReturn<T extends Record<string, any>> {
    /** Current form values */
    values: T;

    /** Form errors (field -> error message) */
    errors: Partial<Record<keyof T, string>>;

    /** Touched fields (field -> boolean) */
    touched: Partial<Record<keyof T, boolean>>;

    /** Is form currently submitting */
    isSubmitting: boolean;

    /** Has form been modified from initial values */
    isDirty: boolean;

    /** Is form valid (no errors) */
    isValid: boolean;

    /** Set a field value */
    setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;

    /** Set multiple field values at once */
    setValues: (values: Partial<T>) => void;

    /** Set a field error */
    setFieldError: <K extends keyof T>(field: K, error: string) => void;

    /** Set multiple errors at once */
    setErrors: (errors: Partial<Record<keyof T, string>>) => void;

    /** Mark a field as touched */
    setFieldTouched: <K extends keyof T>(field: K, touched?: boolean) => void;

    /** Validate the entire form */
    validateForm: () => Promise<boolean>;

    /** Validate a single field */
    validateField: <K extends keyof T>(field: K) => Promise<void>;

    /** Reset form to initial values */
    reset: () => void;

    /** Handle form submission */
    handleSubmit: (e?: React.FormEvent) => Promise<void>;

    /** Get props for an input field (value, onChange, onBlur) */
    getFieldProps: <K extends keyof T>(field: K) => {
        name: K;
        value: T[K];
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
        onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    };

    /** Get error message for a field (only if touched) */
    getFieldError: <K extends keyof T>(field: K) => string | undefined;

    /** Check if a field has an error */
    hasError: <K extends keyof T>(field: K) => boolean;
}

// ===== HOOK =====

export function useForm<T extends Record<string, any>>({
    initialValues,
    validate,
    schema,
    onSubmit,
    validateOnChange = false,
    validateOnBlur = true,
    resetOnSubmit = false
}: UseFormConfig<T>): UseFormReturn<T> {

    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track initial values for dirty check
    const initialValuesRef = useRef<T>(initialValues);

    // ===== COMPUTED VALUES =====

    const isDirty = useMemo(() => {
        return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
    }, [values]);

    const isValid = useMemo(() => {
        return Object.keys(errors).length === 0;
    }, [errors]);

    // ===== VALIDATION =====

    const runValidation = useCallback(async (valuesToValidate: T): Promise<Partial<Record<keyof T, string>>> => {
        let validationErrors: Partial<Record<keyof T, string>> = {};

        // Zod schema validation
        if (schema) {
            try {
                await schema.parseAsync(valuesToValidate);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    error.issues.forEach((err: any) => {
                        const path = err.path[0] as keyof T;
                        validationErrors[path] = err.message;
                    });
                }
            }
        }

        // Custom validation function
        if (validate) {
            const customErrors = validate(valuesToValidate);
            validationErrors = { ...validationErrors, ...customErrors };
        }

        return validationErrors;
    }, [schema, validate]);

    const validateForm = useCallback(async (): Promise<boolean> => {
        const validationErrors = await runValidation(values);
        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    }, [values, runValidation]);

    const validateField = useCallback(async <K extends keyof T>(field: K): Promise<void> => {
        const validationErrors = await runValidation(values);

        if (validationErrors[field]) {
            setErrors(prev => ({ ...prev, [field]: validationErrors[field] }));
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [values, runValidation]);

    // ===== FIELD SETTERS =====

    const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
        setValues(prev => ({ ...prev, [field]: value }));

        // Clear error when field changes
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        // Validate on change if enabled
        if (validateOnChange) {
            setTimeout(() => validateField(field), 0);
        }
    }, [errors, validateOnChange, validateField]);

    const setFieldError = useCallback(<K extends keyof T>(field: K, error: string) => {
        setErrors(prev => ({ ...prev, [field]: error }));
    }, []);

    const setFieldTouched = useCallback(<K extends keyof T>(field: K, isTouched: boolean = true) => {
        setTouched(prev => ({ ...prev, [field]: isTouched }));
    }, []);

    // ===== FORM HANDLERS =====

    const reset = useCallback(() => {
        setValues(initialValuesRef.current);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, []);

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }

        // Mark all fields as touched
        const allTouched = Object.keys(values).reduce((acc, key) => {
            acc[key as keyof T] = true;
            return acc;
        }, {} as Record<keyof T, boolean>);
        setTouched(allTouched);

        // Validate
        const isValid = await validateForm();

        if (!isValid) {
            devLog.log('❌ Form validation failed:', errors);
            return;
        }

        // Submit
        if (onSubmit) {
            try {
                setIsSubmitting(true);
                await onSubmit(values);

                if (resetOnSubmit) {
                    reset();
                }
            } catch (error) {
                devLog.error('❌ Form submission failed:', error);
                // Don't reset on error
            } finally {
                setIsSubmitting(false);
            }
        }
    }, [values, validateForm, onSubmit, reset, resetOnSubmit, errors]);

    // ===== FIELD PROPS =====

    const getFieldProps = useCallback(<K extends keyof T>(field: K) => {
        return {
            name: field,
            value: values[field],
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                const value = e.target.type === 'checkbox'
                    ? (e.target as HTMLInputElement).checked
                    : e.target.value;
                setFieldValue(field, value as T[K]);
            },
            onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                setFieldTouched(field, true);

                if (validateOnBlur) {
                    validateField(field);
                }
            }
        };
    }, [values, setFieldValue, setFieldTouched, validateOnBlur, validateField]);

    const getFieldError = useCallback(<K extends keyof T>(field: K): string | undefined => {
        return touched[field] ? errors[field] : undefined;
    }, [touched, errors]);

    const hasError = useCallback(<K extends keyof T>(field: K): boolean => {
        return !!(touched[field] && errors[field]);
    }, [touched, errors]);

    // ===== RETURN =====

    return {
        values,
        errors,
        touched,
        isSubmitting,
        isDirty,
        isValid,
        setFieldValue,
        setValues: useCallback((newValues: Partial<T>) => {
            setValues(prev => ({ ...prev, ...newValues }));
        }, []),
        setFieldError,
        setErrors,
        setFieldTouched,
        validateForm,
        validateField,
        reset,
        handleSubmit,
        getFieldProps,
        getFieldError,
        hasError
    };
}

export default useForm;
