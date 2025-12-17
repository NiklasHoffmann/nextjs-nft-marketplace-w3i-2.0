/**
 * Global Notification Context
 * 
 * Provides app-wide notification system for:
 * - Transaction confirmations
 * - Success/Error messages
 * - Loading states
 * - Contract interactions (listings, purchases, updates)
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    duration?: number; // Auto-dismiss after ms (0 = no auto-dismiss)
    txHash?: string; // For blockchain transactions
    link?: {
        href: string;
        label: string;
    };
}

interface NotificationContextValue {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => string;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    // Convenience methods
    success: (title: string, message: string, options?: Partial<Notification>) => string;
    error: (title: string, message: string, options?: Partial<Notification>) => string;
    warning: (title: string, message: string, options?: Partial<Notification>) => string;
    info: (title: string, message: string, options?: Partial<Notification>) => string;
    loading: (title: string, message: string) => string;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const id = Math.random().toString(36).substring(7);
        const newNotification: Notification = {
            id,
            duration: 5000, // Default 5s
            ...notification
        };

        setNotifications(prev => [...prev, newNotification]);

        // Auto-dismiss if duration is set
        if (newNotification.duration && newNotification.duration > 0) {
            setTimeout(() => {
                removeNotification(id);
            }, newNotification.duration);
        }

        return id;
    }, []); // removeNotification ist stabil (leere deps), muss nicht in dependencies

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    // Convenience methods
    const success = useCallback((title: string, message: string, options?: Partial<Notification>) => {
        return addNotification({ type: 'success', title, message, ...options });
    }, [addNotification]);

    const error = useCallback((title: string, message: string, options?: Partial<Notification>) => {
        return addNotification({ type: 'error', title, message, duration: 8000, ...options });
    }, [addNotification]);

    const warning = useCallback((title: string, message: string, options?: Partial<Notification>) => {
        return addNotification({ type: 'warning', title, message, ...options });
    }, [addNotification]);

    const info = useCallback((title: string, message: string, options?: Partial<Notification>) => {
        return addNotification({ type: 'info', title, message, ...options });
    }, [addNotification]);

    const loading = useCallback((title: string, message: string) => {
        return addNotification({ type: 'loading', title, message, duration: 0 });
    }, [addNotification]);

    const contextValue = useMemo(() => ({
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        success,
        error,
        warning,
        info,
        loading
    }), [notifications, addNotification, removeNotification, clearAll, success, error, warning, info, loading]);

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}
