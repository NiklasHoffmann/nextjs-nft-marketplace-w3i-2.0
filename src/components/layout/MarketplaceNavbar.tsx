'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/contexts';

export default function MarketplaceNavbar() {
    const router = useRouter();
    const pathname = usePathname() || '';
    const { itemCount } = useCart();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const search = params.get('search') || '';
        setSearchTerm(search);
        setDebouncedSearchTerm(search);
    }, [pathname]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 350);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const current = new URLSearchParams(window.location.search).get('search') || '';
        if (debouncedSearchTerm === current) return;

        const params = new URLSearchParams();
        if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);

        if (pathname.startsWith('/marketplace')) {
            router.replace(`/marketplace?${params.toString()}`, { scroll: false });
        } else {
            router.push(`/marketplace?${params.toString()}`);
        }
    }, [debouncedSearchTerm, pathname, router]);

    return (
        <header className="w-full fixed h-[66px] bg-primary shadow flex items-center justify-between px-4 sm:px-6 z-[60] left-0 right-0 top-0">
            <div className="flex items-center gap-4 min-w-0">
                <Link href="/" className="flex items-center shrink-0">
                    <Image src="/media/Logo-w3i-marketplace.png" alt="Logo" width={160} height={40} className="h-9 w-36 sm:h-10 sm:w-40" priority />
                </Link>

                <div className="hidden md:block relative w-[420px] max-w-[42vw]">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search NFTs..."
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/sell" className="hidden sm:inline text-gray-700 hover:text-blue-600 font-medium transition-colors">
                    Sell
                </Link>

                <Link href="/wallet" className="hidden sm:inline text-gray-700 hover:text-blue-600 font-medium transition-colors">
                    Wallet
                </Link>

                <Link
                    href="/cart"
                    className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
                    title="Shopping Cart"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {itemCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[1.25rem]">
                            {itemCount > 99 ? '99+' : itemCount}
                        </span>
                    )}
                </Link>
            </div>
        </header>
    );
}
