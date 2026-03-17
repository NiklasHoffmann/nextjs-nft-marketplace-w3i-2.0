"use client";

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminPageShell } from '@/app/admin/components/shared/AdminPageShell';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { getMultisigAddress } from '@/config';
import { MULTISIG_WALLET_ABI } from '@/config/abis/multisig-wallet';
import { MULTISIG_ADDRESSES } from '@/types';
import { useRouter } from 'next/navigation';

interface AdminSessionItem {
    jti: string;
    address: string;
    createdAt: number;
    expiresAt: number;
    revokedAt?: number | null;
    userAgent?: string;
}

export default function AdminSettings() {
    const router = useRouter();
    const { address: connectedAddress } = useAccount();
    const [sessions, setSessions] = useState<AdminSessionItem[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [sessionActionLoading, setSessionActionLoading] = useState(false);
    const [currentSessionJti, setCurrentSessionJti] = useState<string | null>(null);
    const [storedAdditionalAdmins, setStoredAdditionalAdmins] = useState<string[]>([]);
    const [adminAddressesInput, setAdminAddressesInput] = useState('');
    const [adminAddressesLoading, setAdminAddressesLoading] = useState(false);
    const [adminAddressesSaving, setAdminAddressesSaving] = useState(false);
    const chainId = useChainId();

    const multisigAddress = useMemo(() => {
        if (chainId) {
            const fromConfig = getMultisigAddress(chainId);
            if (fromConfig) return fromConfig;
            return chainId === 1 ? MULTISIG_ADDRESSES.mainnet : MULTISIG_ADDRESSES.sepolia;
        }
        return process.env.NEXT_PUBLIC_MULTISIG_WALLET_ADDRESS || process.env.NEXT_PUBLIC_MULTISIG_ADDRESS || '';
    }, [chainId]);

    const {
        data: owners,
        isLoading: ownersLoading,
        isError: ownersError,
    } = useReadContract({
        address: multisigAddress ? (multisigAddress as `0x${string}`) : undefined,
        abi: MULTISIG_WALLET_ABI,
        functionName: 'getOwners',
        query: {
            enabled: !!multisigAddress,
        },
    });

    const multisigOwnersDisplay = !multisigAddress
        ? 'Not configured for network'
        : ownersLoading
            ? 'Loading...'
            : Array.isArray(owners)
                ? `${owners.length} live on-chain`
                : ownersError
                    ? 'Owner read failed'
                    : 'Not available';

    const canManageAdditionalAdmins = Boolean(
        connectedAddress &&
        Array.isArray(owners) &&
        owners.some((owner) => String(owner).toLowerCase() === connectedAddress.toLowerCase())
    );

    const loadSessions = async () => {
        try {
            setSessionsLoading(true);

            const [sessionResponse, listResponse] = await Promise.all([
                fetch('/api/auth/session', { cache: 'no-store', credentials: 'include' }),
                fetch('/api/admin/security/sessions', { cache: 'no-store', credentials: 'include' })
            ]);

            if (sessionResponse.ok) {
                const payload = await sessionResponse.json();
                setCurrentSessionJti(payload?.data?.jti || null);
            }

            if (listResponse.ok) {
                const payload = await listResponse.json();
                setSessions(Array.isArray(payload?.data?.sessions) ? payload.data.sessions : []);
            }
        } finally {
            setSessionsLoading(false);
        }
    };

    useEffect(() => {
        loadSessions();
    }, []);

    const loadAdminAddresses = async () => {
        try {
            setAdminAddressesLoading(true);
            const response = await fetch('/api/admin/security/admin-addresses', {
                cache: 'no-store',
                credentials: 'include',
            });

            if (!response.ok) return;

            const payload = await response.json();
            const stored = Array.isArray(payload?.data?.storedAdditional) ? payload.data.storedAdditional : [];
            setStoredAdditionalAdmins(stored);
            setAdminAddressesInput(stored.join('\n'));
        } finally {
            setAdminAddressesLoading(false);
        }
    };

    useEffect(() => {
        loadAdminAddresses();
    }, []);

    const runSessionAction = async (action: 'revoke-current' | 'revoke-all' | 'revoke-one', jti?: string) => {
        try {
            setSessionActionLoading(true);

            const response = await fetch('/api/admin/security/sessions', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, jti }),
            });

            if (!response.ok) {
                return;
            }

            if (action === 'revoke-current') {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include',
                });
                router.replace('/admin/login?reason=session_revoked');
                return;
            }

            await loadSessions();
        } finally {
            setSessionActionLoading(false);
        }
    };

    const saveAdditionalAdminAddresses = async () => {
        try {
            setAdminAddressesSaving(true);

            const addresses = adminAddressesInput
                .split(/[\n,]/g)
                .map((entry) => entry.trim())
                .filter(Boolean);

            const response = await fetch('/api/admin/security/admin-addresses', {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ addresses }),
            });

            if (!response.ok) {
                return;
            }

            await loadAdminAddresses();
        } finally {
            setAdminAddressesSaving(false);
        }
    };

    const activeSessions = sessions.filter((session) => !session.revokedAt && session.expiresAt > Date.now());

    return (
        <AdminPageShell>
                    {/* Back Button */}
                    <div className="mb-6">
                        <Link
                            href="/admin"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Zurück zum Admin Panel
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                        <p className="text-gray-600">System-Konfiguration und Admin-Einstellungen</p>
                    </div>

                    {/* Settings Sections */}
                    <div className="space-y-6">
                        {/* General Settings */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                General Settings
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Maintenance Mode</p>
                                        <p className="text-xs text-gray-500">Disable public access to the marketplace</p>
                                    </div>
                                    <button
                                        disabled
                                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-gray-200 bg-gray-200 transition-colors duration-200 ease-in-out"
                                    >
                                        <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Read-Only Mode</p>
                                        <p className="text-xs text-gray-500">Disable all write operations</p>
                                    </div>
                                    <button
                                        disabled
                                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-gray-200 bg-gray-200 transition-colors duration-200 ease-in-out"
                                    >
                                        <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Debug Mode</p>
                                        <p className="text-xs text-gray-500">Show detailed error messages</p>
                                    </div>
                                    <button
                                        disabled
                                        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-not-allowed rounded-full border-2 border-gray-200 bg-gray-200 transition-colors duration-200 ease-in-out"
                                    >
                                        <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Environment Variables */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                Environment Variables
                            </h2>
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Subgraph URL</p>
                                        <p className="text-sm font-mono text-gray-900 truncate">
                                            {process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'Not configured'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-xs font-medium text-gray-500 mb-1">MultiSig Owner Admins</p>
                                        <p className="text-sm font-mono text-gray-900 truncate">
                                            {multisigOwnersDisplay}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Additional Admin Addresses</p>
                                        <p className="text-sm font-mono text-gray-900 truncate">
                                            {adminAddressesLoading ? 'Loading...' : `${storedAdditionalAdmins.length} stored`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Admin Addresses (Editable)</h2>
                            <p className="text-sm text-gray-600 mb-3">
                                One address per line (or comma-separated). These addresses are applied immediately for admin auth.
                            </p>
                            {!canManageAdditionalAdmins && (
                                <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    Only on-chain MultiSig owners can edit additional admin addresses.
                                </div>
                            )}
                            <textarea
                                value={adminAddressesInput}
                                onChange={(event) => setAdminAddressesInput(event.target.value)}
                                rows={6}
                                disabled={!canManageAdditionalAdmins}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                placeholder="0x1234...\n0xabcd..."
                            />
                            <div className="mt-3 flex justify-end">
                                <button
                                    onClick={saveAdditionalAdminAddresses}
                                    disabled={adminAddressesSaving || !canManageAdditionalAdmins}
                                    className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {adminAddressesSaving ? 'Saving...' : 'Save Additional Admins'}
                                </button>
                            </div>
                        </div>

                        {/* Admin Access */}
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Admin Access Management
                            </h2>
                            <div className="text-center py-8">
                                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="text-sm text-gray-500 mb-2">Admin access = MultiSig owners + optional additional addresses</p>
                                <p className="text-xs text-gray-400">Edit NEXT_PUBLIC_MULTISIG_OWNER_ADDRESSES and optional NEXT_PUBLIC_INSIGHTS_ADMIN_ADDRESSES in .env file</p>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Session Security</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => runSessionAction('revoke-current')}
                                        disabled={sessionActionLoading || !currentSessionJti}
                                        className="px-3 py-2 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Current Session Revoke
                                    </button>
                                    <button
                                        onClick={() => runSessionAction('revoke-all')}
                                        disabled={sessionActionLoading}
                                        className="px-3 py-2 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Revoke All Others
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">
                                Active sessions: <span className="font-semibold text-gray-900">{activeSessions.length}</span>
                            </p>

                            {sessionsLoading ? (
                                <p className="text-sm text-gray-500">Loading sessions...</p>
                            ) : activeSessions.length === 0 ? (
                                <p className="text-sm text-gray-500">No active admin sessions found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {activeSessions.map((session) => {
                                        const isCurrent = currentSessionJti === session.jti;

                                        return (
                                            <div key={session.jti} className="border border-gray-200 rounded-md p-3 flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {session.address} {isCurrent ? '(current)' : ''}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        Created: {new Date(session.createdAt).toLocaleString('de-DE')} · Expires: {new Date(session.expiresAt).toLocaleString('de-DE')}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => runSessionAction('revoke-one', session.jti)}
                                                    disabled={sessionActionLoading || isCurrent}
                                                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40"
                                                >
                                                    Revoke
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Info Notice */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm text-blue-800 font-medium mb-1">Interactive Settings Coming Soon</p>
                                    <p className="text-xs text-blue-600">
                                        Most settings are currently configured through environment variables and require a server restart. 
                                        Interactive configuration will be available in a future update.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
        </AdminPageShell>
    );
}
