"use client";
import { memo } from "react";
import NFTCard from "./01-core-NFTCard";

const NFTCardExplanation = memo(() => {
    return (
        <div className="relative">
            <NFTCard
                listingId="explanation-card"
                nftAddress="0xExpl...Addr"
                tokenId="Demo"
                isListed={true}
                price="1000000000000000000" // 1 ETH
                seller="0xDemo...User"
                desiredNftAddress="0x0000000000000000000000000000000000000000" // Sell mode
                desiredTokenId="0"
                imageUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNBMTA4Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNDAlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMjAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iYm9sZCI+REVNTzwvdGV4dD4KPHRleHQgeD0iNTAlIiB5PSI2MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNiIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiPkNBUkQ8L3RleHQ+Cjwvc3ZnPgo=" // Orange demo card
                likeCount={42}
                category={["Erklärung", "Tutorial", "Demo", "Hilfe"]}
                description={["Dies ist der NFT-Name", "Contract-Adresse hier", "Status-Indicator zeigt Sell/Swap"]}
                priority={true}
            />

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
