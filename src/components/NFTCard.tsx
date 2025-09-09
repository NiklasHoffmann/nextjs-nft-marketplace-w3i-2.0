// app/components/NFTCard.tsx
"use client";
import { formatEther } from "../utils/formatters";
import { useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import OptimizedNFTImage from "./OptimizedNFTImage";
import { useETHPrice } from "@/contexts/CurrencyContext";

interface NFTCardProps {
  listingId: string;
  nftAddress: string;
  tokenId: string;
  isListed: boolean;
  price: string;
  seller: string;
  buyer?: string;
  desiredNftAddress: string;
  desiredTokenId: string;
  imageUrl?: string;
  likeCount?: number;
  category?: string | string[];
  description?: string | string[];
  priority?: boolean;
}

// Separate price component to prevent unnecessary re-renders
const PriceDisplay = memo(({ price, imageUrl }: { price: string; imageUrl?: string }) => {
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
      </div>
    </div>
  );
});

PriceDisplay.displayName = 'PriceDisplay';

const NFTCard = memo(({
  listingId,
  nftAddress,
  tokenId,
  isListed,
  price,
  seller,
  desiredNftAddress,
  desiredTokenId,
  imageUrl,
  likeCount = 0,
  category = ["Art", "DigitalTwin", "Collectible", "Sports", "Music", "VirtualRealEstate"],
  description = ["Access to multisignature wallet with 2/3 approvals required", "Includes 1 free on-chain transaction", "Premium security features"],
  priority = false,
}: Omit<NFTCardProps, 'buyer'>) => {
  const router = useRouter();

  // Normalize category to always be an array
  const categories = Array.isArray(category) ? category : [category];

  // Normalize description to always be an array
  const descriptions = Array.isArray(description) ? description : [description];

  // Memoize the overlay className to prevent re-renders
  const overlayClassName = useMemo(() =>
    `relative z-10 flex flex-col justify-between h-full ${imageUrl ? 'p-2 rounded-xl' : 'p-0'}`,
    [imageUrl]
  );

  const handleCardClick = () => {
    router.push(`/nft/${nftAddress}/${tokenId}`);
  };

  return (
    <div className="group cursor-pointer transform-gpu" onClick={handleCardClick}>
      <div className=" hover:scale-102 hover:-translate-y-1 hover:z-50 transition-all duration-200 ease-out rounded-xl shadow-lg flex flex-col flex-end gap-2 w-80 h-96  relative will-change-transform origin-center">
        {/* Background Image with optimized loading */}
        {imageUrl && (
          <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl">
            <OptimizedNFTImage
              imageUrl={imageUrl}
              tokenId={tokenId}
              className="object-cover"
              fill={true}
              priority={priority}
            />
          </div>
        )}
        {/* Content overlay */}
        <div className={overlayClassName}>
          {/* NFT Name Header at top */}
          <div className="mb-auto">
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-white/20 mb-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                NFT #{tokenId}
              </h3>
              <p className="text-xs text-gray-600 truncate">
                {nftAddress.slice(0, 6)}...{nftAddress.slice(-4)}
              </p>
            </div>
          </div>

          {/* Price Display at bottom */}
          <div className="mt-auto">
            {/* Dynamic Sell/Swap Indicator - directly above price */}
            <div className="mb-2 flex justify-end">
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

            {/* Category and Like Count - directly above price */}
            <div className="flex justify-between items-start mb-2">
              {/* Categories */}
              <div className="flex flex-wrap gap-1 flex-1 mr-2">
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

              {/* Like Count */}
              <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm border border-white/20 h-6 flex items-center gap-1 flex-shrink-0">
                <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="text-xs font-medium text-gray-700">{likeCount}</span>
              </div>
            </div>

            {/* Description - directly above price */}
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

            <PriceDisplay price={price} imageUrl={imageUrl} />
          </div>

          {/* Swap Target Info - only show if exists */}

        </div>
      </div>
    </div>
  );
});

NFTCard.displayName = 'NFTCard';
export default NFTCard;
