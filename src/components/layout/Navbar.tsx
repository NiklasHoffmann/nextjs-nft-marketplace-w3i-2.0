'use client';

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAccount, useBalance } from 'wagmi';
import { Web3ConnectButton } from './Web3ConnectButton';
import CurrencySelector from '../marketplace/CurrencySelector';
import { hasAdminAccess } from '@/utils';

export default function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Wait for hydration before using wagmi hooks
    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync search term with URL
    useEffect(() => {
        const search = searchParams?.get('search') || '';
        setSearchTerm(search);
    }, [searchParams]);

    // Handle search
    const handleSearch = (value: string) => {
        setSearchTerm(value);

        // Only navigate to home if not already there
        if (pathname !== '/') {
            router.push(`/?search=${encodeURIComponent(value)}`);
        } else {
            // Update URL without navigation
            const params = new URLSearchParams(searchParams?.toString() || '');
            if (value) {
                params.set('search', value);
            } else {
                params.delete('search');
            }
            router.replace(`/?${params.toString()}`, { scroll: false });
        }
    };

    const clearSearch = () => {
        handleSearch('');
    };

    // Wallet connection state - only after mounted
    const { address, isConnected } = useAccount();
    const { data: balance } = useBalance({
        address: address,
    });

    // Check if user has admin access
    const isAdmin = mounted ? hasAdminAccess(address) : false;

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
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, []);

    // Close mobile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isOutsideMenu = mobileMenuRef.current && !mobileMenuRef.current.contains(target);
            const isOutsideButton = mobileMenuButtonRef.current && !mobileMenuButtonRef.current.contains(target);

            if (isOutsideMenu && isOutsideButton) {
                setIsMobileMenuOpen(false);
            }
        };

        if (isMobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobileMenuOpen]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isMobileMenuOpen]);

    return (
        <>
            <header className="w-full fixed h-[66px] bg-primary shadow flex items-center justify-between px-6 z-[60] left-0 right-0 top-0">
                {/* Left Logo - hidden on mobile */}
                <div className="hidden md:flex items-center flex-shrink-0 mr-6">
                    <Link href="/" className="flex items-center">
                        <Image src="/media/Logo-w3i-marketplace.png" alt="Logo" className="h-10 w-auto" width={256} height={64} />
                    </Link>
                </div>

                {/* Spacer for mobile to push button to the right */}
                <div className="flex-1 md:hidden"></div>
                {/* Center Searchbar - Desktop only */}
                <div className="flex-1 hidden md:flex justify-center">
                    <div className="relative w-full max-w-md">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Suche NFTs..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full px-4 pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Clear search"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
                {/* Right Section - hidden on mobile */}
                <div className="hidden md:flex items-center gap-4 ml-6">
                    {/* Links */}
                    <Link href="/sell" className="text-gray-700 hover:text-blue-600 font-medium">Sell</Link>
                    <Link href="/sell" className="text-gray-700 hover:text-blue-600 font-medium">Trade</Link>

                    {/* Game Link with Figure */}
                    <Link
                        href="/history-towers"
                        className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors group"
                        title="Spiel spielen"
                    >
                        <Image
                            src="/media/game/Figur2.svg"
                            alt="Zum Spiel"
                            width={32}
                            height={32}
                            className="h-8 w-auto transition-transform group-hover:scale-110"
                        />
                        <span className="text-gray-700 group-hover:text-blue-600 font-medium">Spiel</span>
                    </Link>

                    {/* Currency Selector */}
                    <CurrencySelector />
                    {/* Wallet Section */}
                    {mounted && isConnected && address ? (
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
                    ) : mounted ? (
                        /* Not Connected: Show Connect Button directly in Navbar */
                        <Web3ConnectButton />
                    ) : (
                        /* Loading state before provider is mounted */
                        <div className="w-24 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
                    )}
                    {/*<Image src="/media/Logo-insconsolata-straightened-e1690296964226.png" alt="Logo" className="h-10 w-auto" width={256} height={64} />*/}
                </div>

                {/* Mobile Menu Button (only visible on mobile) - moved to the right */}
                <button
                    ref={mobileMenuButtonRef}
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log('Lightbulb clicked, current state:', isMobileMenuOpen);
                        setIsMobileMenuOpen(!isMobileMenuOpen);
                    }}
                    className="md:hidden flex-shrink-0 h-10 flex items-center relative z-[61] pointer-events-auto"
                    aria-label="Toggle Mobile Menu"
                    style={{ pointerEvents: 'auto' }}
                >
                    <Image
                        src="/media/only-lightbulb.png"
                        alt="Menu"
                        width={40}
                        height={40}
                        className="h-10 w-auto object-contain pointer-events-none"
                    />
                </button>
            </header>

            {/* Mobile Menu Overlay - starts below navbar */}
            {isMobileMenuOpen && (
                <div
                    className="fixed top-[66px] left-0 right-0 bottom-0 bg-black bg-opacity-50 z-[58] md:hidden pointer-events-auto"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMobileMenuOpen(false);
                    }}
                />
            )}

            {/* Mobile Menu Sidebar - slides in from the right */}
            <div
                ref={mobileMenuRef}
                className={`fixed top-0 right-0 h-full w-80 bg-white z-[59] transform transition-transform duration-300 ease-in-out md:hidden overflow-hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                style={{
                    boxShadow: isMobileMenuOpen ? '-4px 0 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
                    pointerEvents: isMobileMenuOpen ? 'auto' : 'none'
                }}
            >
                <div className="flex flex-col h-full">
                    {/* Mobile Menu Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <Image
                                src="/media/only-lightbulb.png"
                                alt="Menu"
                                width={40}
                                height={40}
                                className="h-8 w-auto object-contain"
                            />
                            <h2 className="text-xl font-bold text-gray-800">Menu</h2>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Close Menu"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Menu Content */}
                    <div className="flex-1 overflow-y-auto">
                        {/* Search Bar */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Suche NFTs..."
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full px-4 pl-11 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label="Clear search"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="p-6 space-y-2">
                            <Link
                                href="/"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span className="text-gray-700 font-medium">Home</span>
                            </Link>

                            <Link
                                href="/sell"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span className="text-gray-700 font-medium">Sell</span>
                            </Link>

                            <Link
                                href="/sell"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                <span className="text-gray-700 font-medium">Trade</span>
                            </Link>

                            {/* Game Link with Figure */}
                            <Link
                                href="/history-towers"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                            >
                                <Image
                                    src="/media/game/Figur2.svg"
                                    alt="Zum Spiel"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5"
                                />
                                <span className="text-blue-700 font-medium">Spiel spielen</span>
                            </Link>
                        </div>

                        {/* Wallet Section */}
                        {mounted && isConnected && address ? (
                            <div className="p-6 border-t border-gray-200">
                                {/* Wallet Status */}
                                <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                                        <span className="text-sm font-medium text-green-700">Wallet Connected</span>
                                    </div>
                                    <div className="text-xs text-green-600 font-mono break-all mb-2">
                                        {address}
                                    </div>
                                    <div className="text-sm text-green-700">
                                        Balance: {formatBalance(balance)} ETH
                                    </div>
                                </div>

                                {/* Wallet Actions */}
                                <div className="space-y-2 mb-4">
                                    <Link
                                        href="/wallet"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <span className="text-blue-700 font-medium">View Dashboard</span>
                                    </Link>

                                    {/* Admin Link (only show for admins) */}
                                    {isAdmin && (
                                        <Link
                                            href="/admin"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors"
                                        >
                                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-purple-700 font-medium">Admin Panel</span>
                                        </Link>
                                    )}
                                </div>

                                {/* Currency Selector */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                                    <CurrencySelector />
                                </div>

                                {/* Disconnect Button */}
                                <Web3ConnectButton />
                            </div>
                        ) : mounted ? (
                            /* Not Connected: Show Connect Button */
                            <div className="p-6 border-t border-gray-200">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                                    <CurrencySelector />
                                </div>
                                <Web3ConnectButton />
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
}
