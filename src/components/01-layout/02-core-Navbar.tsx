'use client';

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAccount, useBalance } from 'wagmi';
import { Web3ConnectButton, CurrencySelector } from "@/components";
import { hasAdminAccess } from '@/utils';

export default function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Wallet connection state
    const { address, isConnected } = useAccount();
    const { data: balance } = useBalance({
        address: address,
    });

    // Check if user has admin access
    const isAdmin = hasAdminAccess(address);

    // Format wallet address (show first 6 and last 4 characters)
    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Format balance (show max 4 decimal places)
    const formatBalance = (bal: any) => {
        if (!bal) return '0.0000';
        const value = parseFloat(bal.formatted);
        return value.toFixed(4);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    return (
        <header className="w-full fixed bg-primary shadow flex items-center px-6 py-3 z-50">
            {/* Left Logo */}
            <div className="flex items-center mr-6">
                <Link href="/" className="flex items-center">
                    <Image src="/media/Logo-w3i-marketplace.png" alt="Logo" className="h-10 w-auto" width={256} height={64} />
                </Link>
            </div>
            {/* Center Searchbar */}
            <div className="flex-1 flex justify-center">
                <input
                    type="text"
                    placeholder="Suche NFTs..."
                    className="w-full max-w-md px-4 py-2 border rounded focus:outline-none focus:ring"
                />
            </div>
            {/* Right Section */}
            <div className="flex items-center gap-4 ml-6">
                {/* Links */}
                <Link href="#" className="text-gray-700 hover:text-blue-600 font-medium">Sell</Link>
                <Link href="#" className="text-gray-700 hover:text-blue-600 font-medium">Swap</Link>
                {/* Currency Selector */}
                <CurrencySelector />
                {/* Wallet Section */}
                {isConnected && address ? (
                    /* Connected: Show Wallet Dropdown with same styling as Currency Selector */
                    <div className="relative" ref={dropdownRef}>
                        {/* Wallet Button (matches Currency Selector styling) */}
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150 h-10"
                            aria-label="Wallet Menu"
                            aria-expanded={isDropdownOpen}
                            aria-haspopup="menu"
                        >
                            {/* Connection Status Indicator */}
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />

                            {/* Wallet Info */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-sm font-medium text-gray-700 truncate">
                                    {formatAddress(address)}
                                </span>
                                <span className="text-sm text-gray-500 whitespace-nowrap">
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

                        {/* Dropdown Menu for Connected Wallet */}
                        {isDropdownOpen && (
                            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-80 overflow-hidden">
                                <div className="py-1" role="menu">
                                    {/* Wallet Status Header */}
                                    <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                                            <span className="text-sm font-medium text-green-700">Wallet Connected</span>
                                        </div>
                                        <div className="text-xs text-green-600 font-mono break-all">
                                            {address}
                                        </div>
                                        <div className="text-sm text-green-700 mt-1">
                                            Balance: {formatBalance(balance)} ETH
                                        </div>
                                    </div>

                                    {/* Wallet Settings Section */}
                                    <div className="px-4 py-3">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-gray-700">Wallet Settings</span>
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                        </div>

                                        {/* Dashboard Link */}
                                        <div className="mb-3">
                                            <Link
                                                href="/wallet"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                                View Dashboard
                                            </Link>
                                        </div>

                                        {/* Admin Link (only show for admins) */}
                                        {isConnected && isAdmin && (
                                            <div className="mb-3">
                                                <Link
                                                    href="/admin"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    Admin Panel
                                                </Link>
                                            </div>
                                        )}


                                        <Web3ConnectButton />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Not Connected: Show Connect Button directly in Navbar */
                    <Web3ConnectButton />
                )}
                {/*<Image src="/media/Logo-insconsolata-straightened-e1690296964226.png" alt="Logo" className="h-10 w-auto" width={256} height={64} />*/}
            </div>
        </header>
    );
}
