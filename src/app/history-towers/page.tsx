/**
 * History Towers - Main Game Page
 * 
 * Jump & Run Spiel mit progressiver Schwierigkeit
 * - Desktop: Header + zentriertes Spiel mit Marketplace Info
 * - Mobile: Fullscreen Spiel
 */

import { Metadata } from "next";
import GamePageLayout from './components/GamePageLayout';

export const metadata: Metadata = {
    title: "History Towers - Jump & Run Game",
    description: "Klettere so hoch wie möglich in diesem spannenden Jump & Run Spiel mit progressiver Schwierigkeit und Highscore-System.",
    keywords: ["game", "jump and run", "icy towers", "highscore", "web game"],
};

export default function HistoryTowersPage() {
    return (
        <div className="fixed inset-0 bg-gray-50 pt-[66px] overflow-hidden">
            <GamePageLayout />
        </div>
    );
}
