"use client";

import { useAccount, useSignMessage, useConnectorClient, useDisconnect } from 'wagmi';
import { useEffect, useState, useCallback } from 'react';
import { devLog } from '@/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAdminAddress } from '@/config/admin';
import { Web3ConnectButton } from '@/components/layout/Web3ConnectButton';
import { LoadingState, ButtonSpinner } from '@/components/core/Loading';
import { useNotifications } from '@/contexts/notifications';

export default function AdminLoginPage() {
    const { address, isConnected, connector } = useAccount();
    const { data: connectorClient } = useConnectorClient();
    const { disconnect } = useDisconnect();
    const notifications = useNotifications();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signMessageAsync } = useSignMessage();

    const [isChecking, setIsChecking] = useState(true);
    const [isSigning, setIsSigning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSwitchingWallet, setIsSwitchingWallet] = useState(false);

    const rawRedirect = searchParams?.get('redirect');
    const redirectTo = rawRedirect?.startsWith('/admin') ? rawRedirect : '/admin';

    const clearSession = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                cache: 'no-store'
            });
        } catch (error) {
            devLog.warn('Failed to clear session:', error);
        }
    }, []);

    const checkExistingSession = useCallback(async () => {
        setIsChecking(true);

        try {
            if (!isConnected || !address) {
                setIsChecking(false);
                return;
            }

            if (!isAdminAddress(address)) {
                setError('Diese Wallet-Adresse hat keine Admin-Rechte.');
                setIsChecking(false);
                return;
            }

            const response = await fetch('/api/auth/session', {
                credentials: 'include',
                cache: 'no-store'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data?.isAuthenticated) {
                    const sessionAddress = data.data?.address?.toLowerCase();
                    if (sessionAddress === address.toLowerCase()) {
                        setShowSuccess(true);
                        setTimeout(() => {
                            router.push(redirectTo as any);
                        }, 1000);
                        return;
                    }

                    await clearSession();
                    setError('Session gehört zu einer anderen Wallet. Bitte neu anmelden.');
                    notifications.warning('Session-Wechsel erkannt', 'Bitte melde dich mit der aktuellen Wallet neu an.');
                }
            }

            setIsChecking(false);
        } catch (error) {
            devLog.error('Session check error:', error);
            setIsChecking(false);
        }
    }, [address, clearSession, isConnected, redirectTo, router]);

    const handleSwitchWallet = async () => {
        setIsSwitchingWallet(true);
        setError(null);
        try {
            await clearSession();
            disconnect();
            notifications.info('Session zurueckgesetzt', 'Bitte verbinde eine andere Wallet.');
        } catch (error) {
            devLog.error('Switch wallet error:', error);
        } finally {
            setIsSwitchingWallet(false);
        }
    };

    useEffect(() => {
        checkExistingSession();
    }, [checkExistingSession]);

    const handleLogin = async () => {
        if (!address) {
            setError('Bitte verbinde zuerst deine Wallet.');
            return;
        }

        if (!isAdminAddress(address)) {
            setError('Diese Wallet-Adresse hat keine Admin-Rechte.');
            return;
        }

        setIsSigning(true);
        setError(null);

        try {
            if (!signMessageAsync) {
                throw new Error('Wallet-Signatur nicht verfügbar. Bitte Seite neu laden.');
            }

            if (!connector) {
                throw new Error('Wallet-Connector nicht verfügbar. Bitte Wallet neu verbinden.');
            }

            if (!connectorClient) {
                throw new Error('Wallet-Client nicht bereit. Bitte warten oder Seite neu laden.');
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            const challengeRes = await fetch('/api/auth/challenge', {
                cache: 'no-store',
                credentials: 'include'
            });
            if (!challengeRes.ok) {
                const challengeError = await challengeRes.json().catch(() => null);
                const retryAfterHeader = challengeRes.headers.get('Retry-After');
                const retryAfter = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : undefined;

                if (challengeRes.status === 429) {
                    throw new Error(
                        retryAfter && Number.isFinite(retryAfter)
                            ? `Zu viele Login-Anfragen. Bitte in ${retryAfter}s erneut versuchen.`
                            : 'Zu viele Login-Anfragen. Bitte kurz warten und erneut versuchen.'
                    );
                }

                throw new Error(challengeError?.error || challengeError?.message || 'Challenge-Generierung fehlgeschlagen');
            }
            const challengeData = await challengeRes.json();

            if (!challengeData.success || !challengeData.data) {
                throw new Error('Ungültige Challenge-Antwort');
            }

            const { message, nonce, timestamp } = challengeData.data;

            let signature: string;
            try {
                signature = await signMessageAsync({
                    message,
                    account: address as `0x${string}`,
                });
            } catch (signErr: any) {
                if (signErr?.message?.includes('User rejected') ||
                    signErr?.message?.includes('User denied') ||
                    signErr?.name === 'UserRejectedRequestError') {
                    throw new Error('User rejected');
                }

                if (signErr?.message?.includes("Cannot read properties of undefined (reading 'raw')")) {
                    throw new Error('Wallet nicht vollständig initialisiert. Bitte Wallet trennen, Seite neu laden und erneut verbinden.');
                }

                throw new Error(`Signatur fehlgeschlagen: ${signErr?.message || 'Unbekannter Fehler'}`);
            }

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

            const verifyData = await verifyRes.json().catch(() => ({}));

            if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || verifyData.message || 'Verifikation fehlgeschlagen');
            }

            setShowSuccess(true);

            await new Promise(resolve => setTimeout(resolve, 500));

            setTimeout(() => {
                router.push(redirectTo as any);
            }, 1000);

        } catch (error: any) {
            if (error.message?.includes('User rejected')) {
                setError('Signatur wurde abgelehnt. Bitte versuche es erneut.');
            } else if (error.message?.includes('expired')) {
                setError('Challenge abgelaufen. Bitte versuche es erneut.');
            } else {
                setError(error.message || 'Login fehlgeschlagen. Bitte versuche es erneut.');
            }
        } finally {
            setIsSigning(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
                    <p className="text-gray-600">Sichere Authentifizierung via Wallet-Signatur</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                    {showSuccess && (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Login erfolgreich!</h2>
                            <p className="text-gray-600 mb-4">Du wirst zum Admin-Bereich weitergeleitet...</p>
                            <LoadingState size="sm" variant="inline" />
                        </div>
                    )}

                    {!showSuccess && (
                        <>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">1. Wallet verbinden</label>
                                <div className="flex justify-center">
                                    <Web3ConnectButton />
                                </div>

                                {isConnected && address && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500">Verbunden:</span>
                                            <code className="text-gray-900 font-mono">{address.slice(0, 6)}...{address.slice(-4)}</code>
                                        </div>
                                        {isAdminAddress(address) && (
                                            <div className="mt-2 flex items-center text-green-600">
                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                                <span className="text-xs font-medium">Admin-Rechte bestätigt</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={handleSwitchWallet}
                                            disabled={isSwitchingWallet}
                                            className="mt-3 w-full px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {isSwitchingWallet ? 'Wallet wird getrennt...' : 'Mit anderer Wallet anmelden'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isConnected && address && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">2. Signatur zur Authentifizierung</label>

                                    {!signMessageAsync || !connector || !connectorClient ? (
                                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Wallet noch nicht vollständig bereit</p>
                                            <p className="text-xs text-yellow-700">
                                                {!signMessageAsync && 'Signatur-Hook nicht verfügbar. '}
                                                {!connector && 'Connector nicht verbunden. '}
                                                {!connectorClient && 'Client wird geladen... '}
                                            </p>
                                            <button
                                                onClick={() => window.location.reload()}
                                                className="mt-2 text-xs text-yellow-800 underline hover:text-yellow-900"
                                            >
                                                Seite neu laden
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleLogin}
                                                disabled={isSigning || isChecking || !isAdminAddress(address)}
                                                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${isSigning || isChecking
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : isAdminAddress(address)
                                                            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {isSigning ? (
                                                    <span className="flex items-center justify-center">
                                                        <ButtonSpinner className="-ml-1 mr-3 text-gray-400" />
                                                        Signiere Nachricht...
                                                    </span>
                                                ) : isChecking ? (
                                                    'Prüfe Session...'
                                                ) : !isAdminAddress(address) ? (
                                                    'Keine Admin-Rechte'
                                                ) : (
                                                    <>
                                                        <svg className="inline w-5 h-5 mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                        Nachricht signieren
                                                    </>
                                                )}
                                            </button>
                                            <p className="mt-2 text-xs text-gray-500 text-center">
                                                Du wirst gebeten, eine Nachricht zu signieren.<br />
                                                Dies beweist, dass du der Besitzer dieser Wallet bist.
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <div className="text-sm">
                                        <p className="font-medium text-blue-900 mb-1">Sicherheitshinweis</p>
                                        <p className="text-blue-700 text-xs leading-relaxed">
                                            Die Signatur kostet kein Gas und sendet keine Transaktion.
                                            Sie dient ausschließlich zur Authentifizierung deiner Wallet-Adresse.
                                            Die Session ist 24 Stunden gültig.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-red-900">Fehler</p>
                                            <p className="text-sm text-red-700 mt-1">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <a href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                        ← Zurück zur Startseite
                    </a>
                </div>
            </div>
        </div>
    );
}
