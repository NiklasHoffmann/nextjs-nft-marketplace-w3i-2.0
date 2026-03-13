'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAccount, useBalance } from 'wagmi';
import { Web3ConnectButton } from '@/components/layout/Web3ConnectButton';
import { hasAdminAccess } from '@/utils';

export default function AdminNavbar() {
    const [mounted, setMounted] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [sessionStatus, setSessionStatus] = useState<'unknown' | 'active' | 'inactive'>('unknown');
    const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
    const [isSessionChecking, setIsSessionChecking] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { address, isConnected } = useAccount();
    const { data: balance } = useBalance({ address });
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Close dropdown on escape key
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, []);

    const isAdmin = mounted ? hasAdminAccess(address) : false;

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const formatBalance = (bal: any) => {
        if (!bal) return '0.0000';
        const value = parseFloat(bal.formatted);
        return value.toFixed(4);
    };

    const formatSessionExpiry = (expiresAt: number | null) => {
        if (!expiresAt) return null;
        try {
            const remainingMs = expiresAt - Date.now();
            if (remainingMs <= 0) return 'abgelaufen';
            const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
            const hours = Math.floor(remainingMinutes / 60);
            const minutes = remainingMinutes % 60;
            if (hours <= 0) return `${minutes} min`;
            if (minutes === 0) return `${hours} h`;
            return `${hours} h ${minutes} min`;
        } catch {
            return null;
        }
    };

    const fetchSession = useCallback(async () => {
        if (!mounted || !isConnected || !address) {
            setSessionStatus('inactive');
            setSessionExpiresAt(null);
            return false;
        }

        try {
            setIsSessionChecking(true);
            const response = await fetch('/api/auth/session', {
                credentials: 'include',
                cache: 'no-store'
            });

            if (!response.ok) {
                setSessionStatus('inactive');
                setSessionExpiresAt(null);
                return false;
            }

            const data = await response.json();
            if (data.success && data.data?.isAuthenticated) {
                const sessionAddress = data.data?.address?.toLowerCase();
                const expiresAt = typeof data.data?.expiresAt === 'number' ? data.data.expiresAt : null;
                if (sessionAddress === address.toLowerCase()) {
                    if (expiresAt && expiresAt <= Date.now()) {
                        setSessionStatus('inactive');
                        setSessionExpiresAt(null);
                        return false;
                    }
                    setSessionStatus('active');
                    setSessionExpiresAt(expiresAt);
                    return true;
                }
            }

            setSessionStatus('inactive');
            setSessionExpiresAt(null);
            return false;
        } catch {
            setSessionStatus('inactive');
            setSessionExpiresAt(null);
            return false;
        } finally {
            setIsSessionChecking(false);
        }
    }, [address, isConnected, mounted]);

    useEffect(() => {
        let retryOne: number | null = null;
        let retryTwo: number | null = null;

        const refreshWithRetry = async () => {
            const activeNow = await fetchSession();
            if (!activeNow) {
                retryOne = window.setTimeout(() => {
                    void fetchSession();
                }, 350);

                retryTwo = window.setTimeout(() => {
                    void fetchSession();
                }, 1200);
            }
        };

        const handleSessionUpdated = () => {
            void refreshWithRetry();
        };

        void refreshWithRetry();
        const interval = window.setInterval(() => {
            void fetchSession();
        }, 60_000);
        window.addEventListener('admin-session-updated', handleSessionUpdated as EventListener);

        return () => {
            window.clearInterval(interval);
            window.removeEventListener('admin-session-updated', handleSessionUpdated as EventListener);
            if (retryOne) {
                window.clearTimeout(retryOne);
            }
            if (retryTwo) {
                window.clearTimeout(retryTwo);
            }
        };
    }, [fetchSession]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                cache: 'no-store'
            });
        } finally {
            setIsLoggingOut(false);
            setIsDropdownOpen(false);
            router.replace('/admin/login');
        }
    };

    const adminMenuItems = [
        {
            href: '/admin',
            label: 'Overview',
            icon: (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            badge: undefined as string | undefined
        },
        {
            href: '/admin/dashboard',
            label: 'Dashboard',
            icon: (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            badge: undefined as string | undefined
        },
        {
            href: '/admin/system',
            label: 'System Diagnostics',
            icon: (
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6m14 0V9a2 2 0 012-2h2a2 2 0 012 2v8m-8 0V5a2 2 0 012-2h2a2 2 0 012 2v12m-10 0a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
            ),
            badge: undefined as string | undefined
        },
        {
            href: '/admin/insights',
            label: 'NFT Insights',
            icon: (
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
            badge: undefined as string | undefined
        },
        {
            href: '/admin/multisig-wallet',
            label: 'MultiSig Wallet',
            icon: (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            ),
            badge: undefined as string | undefined
        },
        {
            href: '/admin/marketplace-governance',
            label: 'Marketplace Governance',
            icon: (
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3v2a3 3 0 106 0v-2c0-1.657-1.343-3-3-3zm7 3a7 7 0 10-14 0v2a7 7 0 0014 0v-2z" />
                </svg>
            ),
            badge: undefined as string | undefined
        },
        {
            href: '/admin/marketplace',
            label: 'Marketplace Admin (Legacy)',
            icon: (
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            badge: undefined as string | undefined
        },
        {
            href: '/admin/settings',
            label: 'Settings',
            icon: (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            badge: undefined as string | undefined
        },
        { type: 'divider' as const },
        {
            href: '/',
            label: 'Exit Admin Area',
            icon: (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            ),
            external: true,
            badge: undefined as string | undefined
        }
    ];

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/admin" className="flex items-center gap-2 shrink-0">
                        <Image
                            src="/media/Logo-w3i-marketplace.png"
                            alt="W3Ideation NFT Marketplace"
                            width={256} height={64}
                            className="object-contain h-10 w-auto"
                            priority
                        />
                        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                            </svg>
                            ADMIN
                        </span>
                        {mounted && isConnected && (
                            <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${sessionStatus === 'active'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : sessionStatus === 'inactive'
                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        : 'bg-gray-50 text-gray-600 border-gray-200'
                                }`}>
                                {isSessionChecking ? 'Session pruefen' : sessionStatus === 'active' ? (
                                    <>Session aktiv{formatSessionExpiry(sessionExpiresAt) ? ` (${formatSessionExpiry(sessionExpiresAt)})` : ''}</>
                                ) : sessionStatus === 'inactive' ? 'Session fehlt' : 'Session pruefen'}
                            </span>
                        )}
                    </Link>

                    {/* Right Side: Wallet Dropdown */}
                    <div className="flex items-center gap-3">
                        {/* Wallet Dropdown (or Connect Button) */}
                        {mounted && isConnected && address ? (
                            <div className="relative" ref={dropdownRef}>
                                {/* Wallet Button */}
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-150 h-10"
                                    aria-label="Admin Menu"
                                    aria-expanded={isDropdownOpen}
                                >
                                    {/* Connection Status */}
                                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />

                                    {/* Wallet Info */}
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="text-sm font-medium text-gray-700 truncate">
                                            {formatAddress(address)}
                                        </span>
                                        <span className="hidden sm:inline text-sm text-gray-500 whitespace-nowrap">
                                            {formatBalance(balance)} ETH
                                        </span>
                                    </div>

                                    {/* Dropdown Arrow */}
                                    <svg
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-150 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-80 overflow-hidden">
                                        {/* Wallet Status Header */}
                                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-3 h-3 bg-green-500 rounded-full" />
                                                <span className="text-sm font-medium text-gray-700">Admin Wallet Connected</span>
                                            </div>
                                            <div className="text-xs text-gray-600 font-mono break-all mb-2">
                                                {address}
                                            </div>
                                            <div className="text-sm text-gray-700">
                                                Balance: {formatBalance(balance)} ETH
                                            </div>
                                        </div>

                                        {/* Admin Navigation */}
                                        <div className="py-2">
                                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Admin Navigation
                                            </div>
                                            {adminMenuItems.map((item, index) => {
                                                if (item.type === 'divider') {
                                                    return <div key={index} className="my-2 border-t border-gray-200" />;
                                                }

                                                // Exact match for homepage and special handling for nested routes
                                                let isCurrentPage = false;
                                                if (item.href === '/admin') {
                                                    isCurrentPage = pathname === '/admin';
                                                } else if (item.href) {
                                                    // For nested routes, check if current path starts with the menu item path
                                                    // but ensure we don't match partial paths (e.g., /admin/multisig shouldn't match /admin/multisig-wallet)
                                                    isCurrentPage = pathname === item.href ||
                                                        (pathname?.startsWith(item.href + '/') || false);
                                                }

                                                if (!item.href) return null;

                                                // Determine background color based on menu item
                                                let activeBgClass = 'bg-gray-50';
                                                let activeTextClass = 'text-gray-700';
                                                let activeIconClass = 'text-gray-600';

                                                if (isCurrentPage) {
                                                    if (item.href === '/admin') {
                                                        activeBgClass = 'bg-gray-50';
                                                        activeTextClass = 'text-gray-700';
                                                        activeIconClass = 'text-gray-600';
                                                    } else if (item.href === '/admin/dashboard') {
                                                        activeBgClass = 'bg-blue-50';
                                                        activeTextClass = 'text-blue-700';
                                                        activeIconClass = 'text-blue-600';
                                                    } else if (item.href === '/admin/insights') {
                                                        activeBgClass = 'bg-teal-50';
                                                        activeTextClass = 'text-teal-700';
                                                        activeIconClass = 'text-teal-600';
                                                    } else if (item.href === '/admin/marketplace') {
                                                        activeBgClass = 'bg-purple-50';
                                                        activeTextClass = 'text-purple-700';
                                                        activeIconClass = 'text-purple-600';
                                                    } else if (item.href === '/admin/multisig-wallet') {
                                                        activeBgClass = 'bg-green-50';
                                                        activeTextClass = 'text-green-700';
                                                        activeIconClass = 'text-green-600';
                                                    } else if (item.href === '/admin/marketplace-governance') {
                                                        activeBgClass = 'bg-amber-50';
                                                        activeTextClass = 'text-amber-700';
                                                        activeIconClass = 'text-amber-600';
                                                    } else if (item.href === '/admin/settings') {
                                                        activeBgClass = 'bg-gray-50';
                                                        activeTextClass = 'text-gray-700';
                                                        activeIconClass = 'text-gray-600';
                                                    }
                                                }

                                                return (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href as any}
                                                        onClick={() => setIsDropdownOpen(false)}
                                                        className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isCurrentPage
                                                            ? `${activeBgClass} ${activeTextClass} font-medium`
                                                            : 'text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {item.icon}
                                                        <span className="flex-1">{item.label}</span>
                                                        {item.badge && (
                                                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                        {isCurrentPage && (
                                                            <svg className={`w-4 h-4 ${activeIconClass}`} fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                                            </svg>
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </div>

                                        {/* Wallet Settings Section */}
                                        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-medium text-gray-700">Wallet Settings</span>
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                                </svg>
                                            </div>

                                            {/* Disconnect Button */}
                                            <Web3ConnectButton />

                                            <button
                                                onClick={handleLogout}
                                                disabled={isLoggingOut}
                                                className="mt-3 w-full px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {isLoggingOut ? 'Abmelden...' : 'Admin-Session abmelden'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : mounted ? (
                            /* Not Connected: Show Connect Button */
                            <Web3ConnectButton />
                        ) : (
                            /* Loading state */
                            <div className="w-32 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
