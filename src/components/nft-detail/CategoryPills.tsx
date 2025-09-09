interface CategoryPillsProps {
    categories: string[];
    tags: string[];
    externalUrl?: string | null;
    websiteUrl?: string | null;
    twitterUrl?: string | null;
}

export default function CategoryPills({
    categories,
    tags,
    externalUrl,
    websiteUrl,
    twitterUrl
}: CategoryPillsProps) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pt-8">
            <div className="flex flex-wrap gap-2 items-center">
                {categories.map((cat, index) => (
                    <span key={`cat-${index}`} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        🏷️ {cat}
                    </span>
                ))}
                
                {tags.map((tag, index) => (
                    <span key={`tag-${index}`} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        # {tag}
                    </span>
                ))}

                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    🧪 Test Category
                </span>
                
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    📊 Debug: Categories={categories.length}, Tags={tags.length}
                </span>

                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                    ❤️ 23 Likes
                </span>

                {externalUrl && (
                    <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    >
                        🌐 External
                    </a>
                )}
                
                {websiteUrl && (
                    <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
                    >
                        🏠 Website
                    </a>
                )}
                
                {twitterUrl && (
                    <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-sky-100 text-sky-800 hover:bg-sky-200 transition-colors"
                    >
                        🐦 Twitter
                    </a>
                )}
            </div>
        </div>
    );
}