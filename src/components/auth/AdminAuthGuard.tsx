"use client";

import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAdminAddress } from '@/config/admin';
import { Web3ConnectButton } from '@/components/layout/Web3ConnectButton';
import { LoadingState } from '@/components/core/Loading';

/**
 * AdminAuthGuard - Schützt Admin-Bereiche mit Session-basierter Authentifizierung
 * 
 * Features:
 * - Prüft Admin-Wallet-Adresse
 * - Erfordert signierte Session (Cookie)
 * - Leitet zu /admin/login weiter wenn nicht authentifiziert
 * - Zeigt Loading State während Prüfung
 */
export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const pathname = usePathname();

    const [isChecking, setIsChecking] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Skip auth check for login page
    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        if (isLoginPage) {
            setIsChecking(false);
            setIsAuthorized(true);
            return;
        }

        // Only check if we have a connected wallet and address
        if (isConnected && address) {
            checkAuthorization();
        } else if (!isConnected) {
            // No wallet connected - redirect to login
            setIsAuthorized(false);
            setErrorMessage('Bitte verbinde deine Admin-Wallet.');
            redirectToLogin();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [address, isConnected, isLoginPage]); // Remove pathname to prevent redirect loops

    /**
     * Prüft ob User authorisiert ist (Admin-Wallet + gültige Session)
     */
    const checkAuthorization = async () => {
        setIsChecking(true);
        setErrorMessage(null);

        try {
            // 1. Prüfe ob Wallet verbunden
            if (!isConnected || !address) {
                setIsAuthorized(false);
                setErrorMessage('Bitte verbinde deine Admin-Wallet.');
                redirectToLogin();
                return;
            }

            // 2. Prüfe ob Admin-Adresse
            if (!isAdminAddress(address)) {
                setIsAuthorized(false);
                setErrorMessage('Diese Wallet hat keine Admin-Rechte.');
                setIsChecking(false);
                return;
            }

            // 3. Prüfe Session-Cookie via API
            const response = await fetch('/api/auth/session', {
                credentials: 'include'
            });

            console.log('🔍 AdminAuthGuard session check:', {
                ok: response.ok,
                status: response.status,
                currentAddress: address?.toLowerCase()
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📋 Session data:', {
                    success: data.success,
                    isAuthenticated: data.data?.isAuthenticated,
                    sessionAddress: data.data?.address?.toLowerCase(),
                    currentAddress: address.toLowerCase(),
                    match: data.data?.address?.toLowerCase() === address.toLowerCase()
                });

                // apiHandler wrappt Response in { success: true, data: {...} }
                if (data.success && data.data?.isAuthenticated && data.data?.address?.toLowerCase() === address.toLowerCase()) {
                    // Session gültig
                    console.log('✅ Session valid, authorizing...');
                    setIsAuthorized(true);
                    setIsChecking(false);
                    return;
                } else {
                    console.warn('⚠️ Session check failed:', {
                        hasSuccess: data.success,
                        isAuth: data.data?.isAuthenticated,
                        addressMatch: data.data?.address?.toLowerCase() === address.toLowerCase()
                    });
                }
            }

            // 4. Keine gültige Session - Redirect zu Login
            setIsAuthorized(false);
            setErrorMessage('Bitte melde dich an.');
            redirectToLogin();

        } catch (error) {
            console.error('Authorization check error:', error);
            setIsAuthorized(false);
            setErrorMessage('Fehler bei der Authentifizierung.');
            redirectToLogin();
        }
    };

    /**
     * Leitet zu Login-Seite weiter (mit Redirect-URL)
     */
    const redirectToLogin = () => {
        setIsChecking(false);

        // Don't redirect if already on login page
        if (pathname === '/admin/login') {
            return;
        }

        // Encode current path for redirect after login
        const redirectUrl = encodeURIComponent(pathname || '/admin');

        // Immediate redirect (no setTimeout to prevent multiple checks)
        router.push(`/admin/login?redirect=${redirectUrl}` as any);
    };

    // Login-Seite immer durchlassen
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Loading State
    if (isChecking) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <LoadingState size="lg" variant="inline" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Authentifizierung prüfen...
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Bitte warten
                    </p>
                </div>
            </div>
        );
    }

    // Unauthorized State
    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-red-200">
                    <div className="text-center">
                        {/* Error Icon */}
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        {/* Error Message */}
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Zugriff verweigert
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {errorMessage || 'Du hast keinen Zugriff auf diesen Bereich.'}
                        </p>

                        {/* Wallet Info */}
                        {isConnected && address && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 mb-2">Verbundene Wallet:</p>
                                <code className="text-sm font-mono text-gray-900 break-all">
                                    {address}
                                </code>
                                {!isAdminAddress(address) && (
                                    <div className="mt-3 flex items-start gap-2 text-left">
                                        <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-xs text-red-700">
                                            Diese Wallet-Adresse ist nicht als Admin registriert.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-3">
                            {!isConnected ? (
                                <div className="flex justify-center">
                                    <Web3ConnectButton />
                                </div>
                            ) : !isAdminAddress(address) ? (
                                <button
                                    onClick={() => router.push('/')}
                                    className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                                >
                                    Zurück zur Startseite
                                </button>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Du wirst zur Login-Seite weitergeleitet...
                                    </p>
                                    <div className="inline-flex items-center justify-center">
                                        <LoadingState size="sm" variant="inline" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Authorized - Show Content
    return <>{children}</>;
}
