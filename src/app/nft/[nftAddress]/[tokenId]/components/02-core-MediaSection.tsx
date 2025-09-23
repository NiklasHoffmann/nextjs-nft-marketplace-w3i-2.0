import { memo, useMemo } from 'react';
import Image from 'next/image';
import { NFTMediaSectionProps } from '@/types';
import { formatNFTDisplayName } from '@/utils';

function NFTMediaSection({
    imageUrl,
    animationUrl,
    videoUrl,
    audioUrl,
    name,
    tokenId
}: NFTMediaSectionProps) {
    // Memoize media type detection
    const mediaConfig = useMemo(() => {
        const hasVideo = animationUrl || videoUrl;
        const hasAudio = audioUrl;
        const hasImage = imageUrl;
        const displayName = formatNFTDisplayName(name, tokenId);

        return {
            hasVideo,
            hasAudio,
            hasImage,
            displayName,
            videoSrc: animationUrl || videoUrl || '',
            poster: imageUrl || undefined
        };
    }, [animationUrl, videoUrl, audioUrl, imageUrl, name, tokenId]);

    // Memoize the main media content
    const mainMediaContent = useMemo(() => {
        if (mediaConfig.hasVideo) {
            return (
                <div className="bg-gray-100 rounded-2xl shadow-lg flex items-center justify-center p-4">
                    <video
                        src={mediaConfig.videoSrc}
                        controls
                        className="max-w-full max-h-full object-contain rounded-2xl"
                        poster={mediaConfig.poster}
                        preload="metadata"
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        }

        if (mediaConfig.hasImage) {
            return (
                <div className="bg-gray-100 rounded-2xl shadow-lg flex items-center justify-center">
                    <Image
                        src={imageUrl!}
                        alt={mediaConfig.displayName}
                        width={400}
                        height={400}
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-2xl"
                        sizes="(max-width: 768px) 90vw, (max-width: 1200px) 40vw, 30vw"
                        priority={true}
                        quality={90}
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx4f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bz6rasJsTat2yg4dCLwGRupfphjnFBYc8BUx/9k="
                    />
                </div>
            );
        }

        return (
            <div className="bg-gray-100 rounded-2xl shadow-lg flex items-center justify-center p-4">
                <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No Media Available</p>
                </div>
            </div>
        );
    }, [mediaConfig, imageUrl]);

    return (
        <div className="space-y-6">
            {/* Main Media */}
            <div className="aspect-square bg-primary rounded-2xl shadow-lg relative p-4 flex items-center justify-center">
                {mainMediaContent}
            </div>

            {/* Audio Player if available */}
            {mediaConfig.hasAudio && (
                <div className="bg-gray-100 rounded-xl shadow-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Audio</h4>
                    <audio controls className="w-full" preload="metadata">
                        <source src={audioUrl!} />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}
        </div>
    );
}

export default memo(NFTMediaSection);
