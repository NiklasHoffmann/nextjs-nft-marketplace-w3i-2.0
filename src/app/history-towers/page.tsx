/**
 * History Towers - Main Game Page
 * 
 * Jump & Run Spiel mit progressiver Schwierigkeit
 * - Desktop: Header + zentriertes Spiel
 * - Mobile: Fullscreen Spiel
 */

import { Metadata } from "next";
import { HistoryJumper } from "./components";

export const metadata: Metadata = {
    title: "History Towers - Jump & Run Game",
    description: "Klettere so hoch wie möglich in diesem spannenden Jump & Run Spiel mit progressiver Schwierigkeit und Highscore-System.",
    keywords: ["game", "jump and run", "icy towers", "highscore", "web game"],
};

export default function HistoryTowersPage() {
    return (
        <div className="h-screen bg-gray-50 overflow-hidden">
            {/* Desktop Layout: Header + Game Container */}
            <div className="hidden md:flex md:flex-col h-full">
                {/* Header Section */}
                <header className="flex-shrink-0 pt-20 pb-4">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">
                                History Towers
                            </h1>
                            <p className="text-sm text-gray-600">
                                Ein Jump & Run Spiel - Klettere so hoch wie möglich!
                            </p>
                        </div>
                    </div>
                </header>

                {/* Game Container - Centered & Controlled Height */}
                <main className="flex-1 flex items-center justify-center pb-4 overflow-hidden min-h-0">
                    <div className="w-full max-w-md h-full flex items-center justify-center">
                        <HistoryJumper />
                    </div>
                </main>
            </div>

            {/* Mobile Layout: Fullscreen Game */}
            <div className="md:hidden h-full flex flex-col">
                <HistoryJumper />
            </div>
        </div>
    );
}