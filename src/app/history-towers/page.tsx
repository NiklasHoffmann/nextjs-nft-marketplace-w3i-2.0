import { HistoryJumper } from "./components";

export default function HistoryTowersPage() {
    return (
        <div className="h-screen bg-gray-50 overflow-hidden">
            {/* Desktop: Header + Game centered */}
            <div className="hidden md:flex md:flex-col h-full">
                <div className="flex-shrink-0 pt-20 pb-4">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">
                                History Towers
                            </h1>
                            <p className="text-sm text-gray-600">
                                Ein Jump & Run Spiel - Klettere so hoch wie möglich!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Game Container - controlled height */}
                <div className="flex-1 flex items-center justify-center pb-4 overflow-hidden min-h-0">
                    <div className="w-full max-w-md h-full flex items-center justify-center">
                        <HistoryJumper />
                    </div>
                </div>
            </div>

            {/* Mobile: Fullscreen Game */}
            <div className="md:hidden h-full flex flex-col">
                <HistoryJumper />
            </div>
        </div>
    )
}   