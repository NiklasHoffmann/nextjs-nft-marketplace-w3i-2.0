import { memo, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { CategoryPillsProps } from '@/types';
import { AdminNFTInsight, AdminCollectionInsight } from '@/types';
import { canEditInsights } from '@/utils/insights-access';
import Link from 'next/link';

function CategoryPills({
    categories,
    tags,
    externalUrl,
    websiteUrl,
    twitterUrl,
    insights,
    insightsLoading,
    contractAddress,
    tokenId
}: CategoryPillsProps) {
    const { address, isConnected } = useAccount();

    // Check edit permissions
    const canEdit = canEditInsights(address);

    // Combine metadata categories with insights categories (but NOT tags)
    const allCategories = useMemo(() => {
        const finalCategories = new Set<string>();

        // Add metadata categories
        categories.forEach(cat => finalCategories.add(cat));

        // Add insights category if available and not loading (but NOT tags)
        if (!insightsLoading && insights) {
            if (insights.category) {
                finalCategories.add(insights.category);
            }
        }

        return Array.from(finalCategories);
    }, [categories, insights, insightsLoading]);

    // Combine metadata tags with insights tags
    const allTags = useMemo(() => {
        const finalTags = new Set<string>();

        // Add metadata tags
        tags.forEach(tag => finalTags.add(tag));

        // Add insights tags if available and not loading
        if (!insightsLoading && insights) {
            if (insights.tags && insights.tags.length > 0) {
                insights.tags.forEach((tag: string) => finalTags.add(tag));
            }
        }

        return Array.from(finalTags);
    }, [tags, insights, insightsLoading]);
    // Memoize category pills to prevent unnecessary re-renders
    const categoryPills = useMemo(() =>
        allCategories.map((cat, index) => {
            // Check if this category comes from insights (only category, not tags)
            const isFromInsights = insights && !insightsLoading && insights.category === cat;

            return (
                <span
                    key={`cat-${index}`}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${isFromInsights
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-blue-100 text-blue-800'
                        }`}
                >
                    {'🏷️'} {cat}
                </span>
            );
        }), [allCategories, insights, insightsLoading]);

    // Memoize tag pills
    const tagPills = useMemo(() =>
        allTags.map((tag, index) => {
            // Check if this tag comes from insights
            const isFromInsights = insights && !insightsLoading && insights.tags && insights.tags.includes(tag);

            return (
                <span
                    key={`tag-${index}`}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${isFromInsights
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-gray-100 text-gray-800'
                        }`}
                >
                    {'#'} {tag}
                </span>
            );
        }), [allTags, insights, insightsLoading]);

    // Memoize external links
    const externalLinks = useMemo(() => {
        const links = [];

        if (externalUrl) {
            links.push(
                <a
                    key="external"
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    🌐 External
                </a>
            );
        }

        if (websiteUrl) {
            links.push(
                <a
                    key="website"
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                    � Website
                </a>
            );
        }

        if (twitterUrl) {
            links.push(
                <a
                    key="twitter"
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-sky-100 text-sky-800 hover:bg-sky-200 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                >
                    🐦 Twitter
                </a>
            );
        }

        // Add Discord link from admin insights if available
        if (insights && 'projectDiscord' in insights && insights.projectDiscord) {
            links.push(
                <a
                    key="discord"
                    href={insights.projectDiscord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    💬 Discord
                </a>
            );
        }

        return links;
    }, [externalUrl, websiteUrl, twitterUrl, insights]);

    // Memoize debug info (only for admins)
    const debugPill = useMemo(() => {
        if (!canEdit) return null;

        return (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                📊 Debug: Categories={allCategories.length}, Tags={allTags.length}, Insights={insights ? 'Yes' : 'No'}
            </span>
        );
    }, [allCategories.length, allTags.length, insights, canEdit]);

    // Memoize insights status pills
    const insightsStatusPills = useMemo(() => {
        if (insightsLoading) {
            return [
                <span key="insights-loading" className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                    <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full mr-2"></div>
                    Loading Insights...
                </span>
            ];
        }

        if (!insights) return [];

        const statusPills = [];

        // Rarity pill (available in AdminInsights)
        if (insights.rarity) {
            const rarityColors = {
                legendary: 'bg-purple-100 text-purple-800 border-purple-200',
                epic: 'bg-red-100 text-red-800 border-red-200',
                rare: 'bg-blue-100 text-blue-800 border-blue-200',
                uncommon: 'bg-green-100 text-green-800 border-green-200',
                common: 'bg-gray-100 text-gray-800 border-gray-200'
            };

            statusPills.push(
                <span
                    key="rarity"
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${rarityColors[insights.rarity as keyof typeof rarityColors]}`}
                >
                    💎 {insights.rarity.charAt(0).toUpperCase() + insights.rarity.slice(1)}
                </span>
            );
        }

        // Admin Insights indicator (for AdminNFTInsight/AdminCollectionInsight)
        if ('projectName' in insights && insights.projectName) {
            statusPills.push(
                <span key="project-info" className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    🚀 Project: {insights.projectName}
                </span>
            );
        }

        // Partnership indicator
        if ('partnerships' in insights && insights.partnerships && insights.partnerships.length > 0) {
            statusPills.push(
                <span key="partnerships" className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    🤝 {insights.partnerships.length} Partnership{insights.partnerships.length > 1 ? 's' : ''}
                </span>
            );
        }

        // Collection-level indicator
        if ('contractAddress' in insights && !('tokenId' in insights)) {
            statusPills.push(
                <span key="collection-level" className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                    🔗 Collection-wide
                </span>
            );
        }

        // Legacy status badges (only for old NFTInsights)
        if ('personalRating' in insights && insights.personalRating && insights.personalRating > 0) {
            statusPills.push(
                <span key="rating" className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    {'⭐'.repeat(insights.personalRating)} Rating
                </span>
            );
        }

        if ('strategy' in insights && insights.strategy) {
            const strategyColors = {
                hold: 'bg-blue-100 text-blue-800 border-blue-200',
                flip: 'bg-orange-100 text-orange-800 border-orange-200',
                trade: 'bg-green-100 text-green-800 border-green-200',
                collect: 'bg-purple-100 text-purple-800 border-purple-200'
            };

            statusPills.push(
                <span
                    key="strategy"
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${strategyColors[insights.strategy as keyof typeof strategyColors]}`}
                >
                    📈 {insights.strategy.charAt(0).toUpperCase() + insights.strategy.slice(1)}
                </span>
            );
        }

        if ('isFavorite' in insights && insights.isFavorite) {
            statusPills.push(
                <span key="favorite" className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                    ❤️ Favorite
                </span>
            );
        }

        if ('isWatchlisted' in insights && insights.isWatchlisted) {
            statusPills.push(
                <span key="watchlisted" className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    👁️ Watching
                </span>
            );
        }

        if ('isForSale' in insights && insights.isForSale) {
            statusPills.push(
                <span key="for-sale" className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    💰 For Sale
                </span>
            );
        }

        return statusPills;
    }, [insights, insightsLoading]);

    // Memoize insights edit button
    const insightsEditButton = useMemo(() => {
        if (!contractAddress || !tokenId || !isConnected) return null;

        if (insights && canEdit) {
            // Edit existing insights
            return (
                <Link
                    href={`/insights?contractAddress=${contractAddress}&tokenId=${tokenId}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 transition-colors"
                >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Insights
                </Link>
            );
        } else if (!insights && canEdit) {
            // Create new insights
            return (
                <Link
                    href={`/insights?contractAddress=${contractAddress}&tokenId=${tokenId}`}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 transition-colors"
                >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Insights
                </Link>
            );
        }

        return null;
    }, [contractAddress, tokenId, insights, canEdit, isConnected]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pt-8">
            <div className="flex flex-wrap gap-2 items-center">
                {/* Insights edit button (prominent position) */}
                {insightsEditButton}

                {/* Insights status pills */}
                {insightsStatusPills}

                {/* Categories with insights highlighting */}
                {categoryPills}

                {/* Tags */}
                {tagPills}

                {/* Insights availability indicator 
                {!insightsLoading && insights && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        ✨ Enhanced with Insights
                    </span>
                )}*/}

                {/* Debug pill (only for admins) */}
                {debugPill}

                {/* External links */}
                {externalLinks}
            </div>
        </div>
    );
}

export default memo(CategoryPills);
