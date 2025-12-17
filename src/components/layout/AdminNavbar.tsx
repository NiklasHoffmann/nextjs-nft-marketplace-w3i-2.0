'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAccount } from 'wagmi';
import { Web3ConnectButton } from './Web3ConnectButton';
import CurrencySelector from '../ui/CurrencySelector';
import { hasAdminAccess } from '@/utils';

export default function AdminNavbar() {
    const [mounted, setMounted] = useState(false);
    const { address } = useAccount();
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    const isAdmin = mounted ? hasAdminAccess(address) : false;

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-8">
                        <Link href="/admin" className="flex items-center gap-2 shrink-0">
                            <Image
                                src="/media/Logo-w3i-marketplace.png"
                                alt="W3Ideation NFT Marketplace"
                                width={256} height={64}
                                className="object-contain h-10 w-auto"
                                priority
                            />
                        </Link>

                        {/* Admin Navigation */}
                        {isAdmin && mounted && (
                            <div className="hidden md:flex items-center gap-1">
                                <Link
                                    href="/admin/dashboard"
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/dashboard')
                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/admin/insights"
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/insights')
                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    NFT Insights
                                </Link>
                                <Link
                                    href="/admin/marketplace"
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/marketplace')
                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    Marketplace
                                </Link>
                                <Link
                                    href="/admin/settings"
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/settings')
                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    Settings
                                </Link>
                                <Link
                                    href="/"
                                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                                >
                                    ← Exit Admin
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Currency + Wallet */}
                    <div className="flex items-center gap-4">
                        {/* Currency Selector */}
                        {mounted && <CurrencySelector />}

                        {/* Wallet Connection */}
                        {mounted && (
                            <div className="shrink-0">
                                <Web3ConnectButton />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
