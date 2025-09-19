"use client";
import { memo, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useETHPrice } from "@/contexts/OptimizedCurrencyContext";
import { formatEther } from "@/utils";
import OptimizedNFTImage from "./02-utils-OptimizedNFTImage";

// Separate price component for demo
const DemoPriceDisplay = memo(({ price, desiredNftAddress }: { price: string; desiredNftAddress: string }) => {
    const ethPrice = useMemo(() => parseFloat(formatEther(price)), [price]);
    const { convertedPrice, loading } = useETHPrice(ethPrice);

    return (
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-white/20">
            <div className="flex justify-between items-center">
                <div className="text-left">
                    <div className="text-orange font-semibold text-lg">{formatEther(price)} ETH</div>
                    {loading ? (
                        <div className="text-xs text-gray-500">Lädt...</div>
                    ) : (
                        <div className="text-xs text-gray-600">≈ {convertedPrice}</div>
                    )}
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg border border-white/20">
                    {desiredNftAddress !== "0x0000000000000000000000000000000000000000" ? (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange rounded-full"></div>
                            <span className="text-xs font-medium text-orange">Swap</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-forestgreen rounded-full"></div>
                            <span className="text-xs font-medium text-forestgreen">Sell</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

DemoPriceDisplay.displayName = 'DemoPriceDisplay';

// Demo NFT Card component that doesn't use NFTContext
const DemoNFTCard = memo(() => {
    const router = useRouter();

    const demoImageUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNBMTA4Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iYm9sZCI+REVNTzwvdGV4dD4KPHRleHQgeD0iNTAlIiB5PSI2MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPkNBUkQ8L3RleHQ+Cjwvc3ZnPgo=";
    const categories = ["Erklärung", "Tutorial", "Demo", "Hilfe"];
    const descriptions = ["Dies ist der NFT-Name", "Contract-Adresse hier", "Status-Indicator zeigt Sell/Swap"];

    const handleCardClick = useCallback(() => {
        // Don't navigate for demo card
        console.log("Demo card clicked - navigation disabled");
    }, []);

    return (
        <div className="group cursor-pointer transform-gpu" onClick={handleCardClick}>
            <div className="hover:scale-102 hover:-translate-y-1 hover:z-50 transition-all duration-200 ease-out rounded-xl shadow-lg flex flex-col flex-end gap-2 w-80 h-96 relative will-change-transform origin-center">
                {/* Background Image */}
                <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl">
                    <OptimizedNFTImage
                        imageUrl={demoImageUrl}
                        tokenId="Demo"
                        className="object-cover"
                        fill={true}
                        priority={true}
                    />
                </div>

                {/* Content overlay */}
                <div className="relative z-10 flex flex-col justify-between h-full p-2 rounded-xl">
                    {/* NFT Name Header */}
                    <div className="mb-auto">
                        <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-white/20 mb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                        NFT #Demo
                                    </h3>
                                    <p className="text-xs text-gray-600 truncate">
                                        0xExpl...Addr
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom content */}
                    <div className="mt-auto">
                        {/* Social Stats */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-white/20 h-6 flex items-center gap-1">
                                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                                <span className="text-xs font-medium text-gray-700">42</span>
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="flex flex-wrap gap-1 mb-2">
                            {categories.slice(0, 3).map((cat, index) => (
                                <div key={index} className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-white/20 h-6 flex items-center">
                                    <span className="text-xs font-medium text-gray-700">{cat}</span>
                                </div>
                            ))}
                            {categories.length > 3 && (
                                <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-white/20 h-6 flex items-center">
                                    <span className="text-xs font-medium text-gray-500">+{categories.length - 3}</span>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="mb-2 flex flex-wrap gap-1">
                            {descriptions.slice(0, 2).map((desc, index) => (
                                <div key={index} className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-white/20 text-xs text-gray-600">
                                    {desc}
                                </div>
                            ))}
                            {descriptions.length > 2 && (
                                <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-white/20 text-xs text-gray-500">
                                    +{descriptions.length - 2}
                                </div>
                            )}
                        </div>

                        {/* Price */}
                        <DemoPriceDisplay
                            price="1000000000000000000"
                            desiredNftAddress="0x0000000000000000000000000000000000000000"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

DemoNFTCard.displayName = 'DemoNFTCard';

const NFTCardExplanation = memo(() => {
    return (
        <div className="relative">
            <DemoNFTCard />

            {/* Overlay with explanations */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Header explanation */}
                <div className="absolute top-4 left-4 right-4">
                    <div className="bg-black/80 text-white text-xs px-2 py-1 rounded opacity-90">
                        📱 Header: NFT-Name & Contract-Adresse
                    </div>
                </div>

                {/* Status indicator explanation */}
                <div className="absolute top-40 left-4">
                    <div className="bg-black/80 text-white text-xs px-2 py-1 rounded opacity-90">
                        🔵 Status: Grün=Sell, Orange=Swap
                    </div>
                </div>

                {/* Categories explanation */}
                <div className="absolute bottom-36 left-4">
                    <div className="bg-black/80 text-white text-xs px-2 py-1 rounded opacity-90">
                        🏷️ Kategorien: Max 3 + Overflow
                    </div>
                </div>

                {/* Likes explanation */}
                <div className="absolute bottom-36 right-4">
                    <div className="bg-black/80 text-white text-xs px-2 py-1 rounded opacity-90">
                        ❤️ Zähler
                    </div>
                </div>

                {/* Description explanation */}
                <div className="absolute bottom-24 left-4 right-16">
                    <div className="bg-black/80 text-white text-xs px-2 py-1 rounded opacity-90">
                        📝 Beschreibungen: Max 2 Pills + Overflow
                    </div>
                </div>

                {/* Price explanation */}
                <div className="absolute bottom-8 left-4 right-4">
                    <div className="bg-black/80 text-white text-xs px-2 py-1 rounded opacity-90">
                        💰 Preis: ETH + Währungsumrechnung
                    </div>
                </div>
            </div>
        </div>
    );
});

NFTCardExplanation.displayName = 'NFTCardExplanation';
export default NFTCardExplanation;
