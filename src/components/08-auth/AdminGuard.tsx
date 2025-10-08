"use client";

import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAddress, APP_LOCK_ENABLED } from '@/config/admin';
import { Web3ConnectButton } from '@/components/01-layout/04-features-Web3ConnectButton';

interface AdminGuardProps {
    children: React.ReactNode;
    requireAdmin?: boolean; // Wenn true, wird immer Admin-Zugriff benötigt
    fallbackRoute?: string; // Wohin soll umgeleitet werden?
}

/**
 * AdminGuard Komponente
 * Schützt Routen und erlaubt nur Zugriff für Admin-Wallets
 */
export function AdminGuard({
    children,
    requireAdmin = false,
    fallbackRoute = '/'
}: AdminGuardProps) {
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            // Wenn App-Sperre aktiv ODER spezifisch Admin erforderlich
            const needsAdmin = APP_LOCK_ENABLED || requireAdmin;

            if (!needsAdmin) {
                // Kein Admin erforderlich
                setIsAuthorized(true);
                setIsChecking(false);
                return;
            }

            // Wallet muss verbunden sein
            if (!isConnected || !address) {
                setIsAuthorized(false);
                setIsChecking(false);
                return;
            }

            // Prüfen ob Admin
            const hasAdminAccess = isAdminAddress(address);
            setIsAuthorized(hasAdminAccess);
            setIsChecking(false);
        };

        checkAuth();
    }, [address, isConnected, requireAdmin, router, fallbackRoute]);

    // Loading State
    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Checking access permissions...</p>
                </div>
            </div>
        );
    }

    // Nicht autorisiert
    if (!isAuthorized) {
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
                            Access Restricted
                        </h2>
                        <p className="mt-2 text-gray-600">
                            {!isConnected
                                ? 'Please connect your wallet to continue.'
                                : 'This area is restricted to authorized admin wallets only.'}
                        </p>

                        {/* Wallet Connect Button */}
                        {!isConnected && (
                            <div className="mt-6">
                                <Web3ConnectButton />
                            </div>
                        )}

                        {isConnected && (
                            <div className="mt-4 p-3 bg-gray-100 rounded-md">
                                <p className="text-xs text-gray-500 font-mono break-all">
                                    Connected: {address}
                                </p>
                                <p className="text-xs text-red-600 mt-2">
                                    This wallet is not authorized.
                                </p>
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
