"use client";

import { useAccount, useSignMessage } from 'wagmi';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAddress, APP_LOCK_ENABLED } from '@/config/admin';
import { Web3ConnectButton } from '@/components/layout/Web3ConnectButton';
import { LoadingState, ButtonSpinner } from '@/components/core/Loading';
import { devLog } from '@/utils';

interface AdminGuardProps {
    children: React.ReactNode;
    requireAdmin?: boolean; // Wenn true, wird immer Admin-Zugriff benötigt
    fallbackRoute?: string; // Wohin soll umgeleitet werden?
}

/**
 * AdminGuard Komponente mit Signatur-Verifikation
 * Schützt Routen und erlaubt nur Zugriff für Admin-Wallets nach erfolgreicher Signatur
 */
export function AdminGuard({
    children,
    requireAdmin = false,
    fallbackRoute = '/'
}: AdminGuardProps) {
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const { signMessageAsync } = useSignMessage();

    // If no admin check is required (APP_LOCK_ENABLED=false and requireAdmin=false),
    // skip the check entirely — no spinner, immediate render.
    const needsAdmin = APP_LOCK_ENABLED || requireAdmin;
    const [isChecking, setIsChecking] = useState(needsAdmin);
    const [isAuthorized, setIsAuthorized] = useState(!needsAdmin);
    const [isSigning, setIsSigning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Prüfe Session beim Mount und bei Adress-Änderung
    useEffect(() => {
        if (needsAdmin) checkSession();
    }, [address, isConnected]);

    /**
     * Prüft ob eine gültige Admin-Session existiert
     */
    const checkSession = async () => {
        setError(null);
        setIsChecking(true);

        try {
            // Wallet muss verbunden sein
            if (!isConnected || !address) {
                setIsAuthorized(false);
                setIsChecking(false);
                return;
            }

            // Prüfe ob Adresse grundsätzlich Admin ist
            const isPotentialAdmin = isAdminAddress(address);
            if (!isPotentialAdmin) {
                setIsAuthorized(false);
                setIsChecking(false);
                return;
            }

            // Prüfe ob Session-Cookie existiert (wird vom Server gesetzt)
            // Dies ist eine zusätzliche Sicherheitsebene - der Cookie ist httpOnly
            const response = await fetch('/api/auth/session', {
                credentials: 'include',
                cache: 'no-store'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data?.isAuthenticated && data.data?.address?.toLowerCase() === address.toLowerCase()) {
                    setIsAuthorized(true);
                    setIsChecking(false);
                    return;
                }
            }

            // Keine gültige Session - Signatur erforderlich
            setIsAuthorized(false);
            setIsChecking(false);

        } catch (error) {
            devLog.error('Session check error:', error);
            setIsAuthorized(false);
            setIsChecking(false);
        }
    };

    /**
     * Führt den Signatur-Authentifizierungs-Flow durch
     */
    const handleAuthenticate = async () => {
        if (!address) return;

        setIsSigning(true);
        setError(null);

        try {
            // 1. Hole Challenge vom Server
            const challengeRes = await fetch('/api/auth/challenge', {
                cache: 'no-store'
            });
            if (!challengeRes.ok) {
                throw new Error('Failed to get challenge');
            }
            const challengeData = await challengeRes.json();
            if (!challengeData.success || !challengeData.data) {
                throw new Error('Invalid challenge response');
            }
            const { message, nonce, timestamp } = challengeData.data;

            // 2. Lasse User die Nachricht signieren
            const signature = await signMessageAsync({ message });

            // 3. Sende Signatur zur Verifikation
            const verifyRes = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    address,
                    signature,
                    message,
                    nonce,
                    timestamp
                })
            });

            if (!verifyRes.ok) {
                const error = await verifyRes.json().catch(() => ({}));
                throw new Error(error.error || error.message || 'Verification failed');
            }

            const verifyData = await verifyRes.json();
            if (!verifyData.success) {
                throw new Error(verifyData.error || 'Verification failed');
            }

            // 4. Erfolg - Session ist jetzt aktiv
            setIsAuthorized(true);
            setError(null);

        } catch (error: any) {
            devLog.error('Authentication error:', error);
            setError(error.message || 'Authentication failed');
            setIsAuthorized(false);
        } finally {
            setIsSigning(false);
        }
    };

    // Loading State
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <LoadingState size="lg" variant="inline" className="mb-4" />
                    <p className="text-gray-600">Checking access permissions...</p>
                </div>
            </div>
        );
    }

    // Nicht autorisiert
    if (!isAuthorized) {
        const isPotentialAdmin = address && isAdminAddress(address);

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                    <div className="text-center">
                        <svg
                            className="mx-auto h-12 w-12 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                        <h2 className="mt-4 text-2xl font-bold text-gray-900">
                            {isPotentialAdmin ? 'Authentication Required' : 'Access Restricted'}
                        </h2>
                        <p className="mt-2 text-gray-600">
                            {!isConnected
                                ? 'Please connect your wallet to continue.'
                                : isPotentialAdmin
                                    ? 'Please sign the message to verify your identity.'
                                    : 'This area is restricted to authorized admin wallets only.'}
                        </p>

                        {/* Wallet Connect Button */}
                        {!isConnected && (
                            <div className="mt-6">
                                <Web3ConnectButton />
                            </div>
                        )}

                        {/* Sign Message Button für erkannte Admin-Wallets */}
                        {isConnected && isPotentialAdmin && (
                            <div className="mt-6">
                                <button
                                    onClick={handleAuthenticate}
                                    disabled={isSigning}
                                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSigning ? (
                                        <span className="flex items-center justify-center">
                                            <ButtonSpinner className="-ml-1 mr-3" />
                                            Signing...
                                        </span>
                                    ) : (
                                        'Sign Message to Authenticate'
                                    )}
                                </button>
                                <p className="mt-3 text-xs text-gray-500">
                                    You will be asked to sign a message with your wallet. This proves you own this address.
                                </p>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Connected Wallet Info */}
                        {isConnected && (
                            <div className="mt-4 p-3 bg-gray-100 rounded-md">
                                <p className="text-xs text-gray-500 font-mono break-all">
                                    Connected: {address}
                                </p>
                                {!isPotentialAdmin && (
                                    <p className="text-xs text-red-600 mt-2">
                                        This wallet is not authorized.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Autorisiert - zeige Content
    return <>{children}</>;
}
