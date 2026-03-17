import { memo, useMemo } from 'react';
import { OptimizedNFTImage } from '@/components/nft';
import { NFTMediaSectionProps } from '@/types';
import { formatNFTDisplayName, convertIpfsToHttp, resolveNftImageUrl } from '@/utils';

function NFTMediaSection({
    imageUrl,
    animationUrl,
    videoUrl,
    audioUrl,
    name,
    tokenId
}: NFTMediaSectionProps) {
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
            videoSrc: convertIpfsToHttp(animationUrl || videoUrl || ''),
            poster: imageUrl ? resolveNftImageUrl(imageUrl, convertIpfsToHttp(imageUrl)) : undefined,
            imageSrc: imageUrl ? resolveNftImageUrl(imageUrl, imageUrl) : '',
            audioSrc: audioUrl ? convertIpfsToHttp(audioUrl) : ''
        };
    }, [animationUrl, videoUrl, audioUrl, imageUrl, name, tokenId]);

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
                <div className="bg-gray-100 rounded-2xl shadow-lg overflow-hidden w-full">
                    <OptimizedNFTImage
                        imageUrl={mediaConfig.imageSrc}
                        tokenId={String(tokenId)}
                        alt={mediaConfig.displayName}
                        variant="detail"
                        className="w-full h-auto object-contain"
                        width={800}
                        height={800}
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 78vw, 960px"
                        priority={true}
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
    }, [mediaConfig, tokenId]);

    return (
        <div className="space-y-6">
            {/* Main Media - Width fest, Höhe flexibel */}
            <div className="bg-primary rounded-2xl shadow-lg w-full">
                {mainMediaContent}
            </div>

            {/* Audio Player if available */}
            {mediaConfig.hasAudio && (
                <div className="bg-gray-100 rounded-xl shadow-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Audio</h4>
                    <audio controls className="w-full" preload="metadata">
                        <source src={mediaConfig.audioSrc} />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}
        </div>
    );
}

export default memo(NFTMediaSection);
