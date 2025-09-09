'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Web3ConnectButton } from "@/components/Web3ConnectButton";
import CurrencySelector from "@/components/CurrencySelector";

export default function Navbar() {

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
                {/* Wallet ConnectButton (RainbowKit) */}
                <Web3ConnectButton />
                {/*<Image src="/media/Logo-insconsolata-straightened-e1690296964226.png" alt="Logo" className="h-10 w-auto" width={256} height={64} />*/}
            </div>
        </header>
    );
}
