import { FunctionalitiesTabProps } from '@/types';

export default function FunctionalitiesTab({
    adminInsights,
    collectionInsights,
    loading
}: FunctionalitiesTabProps) {
    const functionalitiesData = adminInsights?.functionalitiesDescriptions ||
        collectionInsights?.functionalitiesDescriptions;

    if (loading) {
        return (
            <div className="text-center py-8 text-gray-500">
                Loading functionalities...
            </div>
        );
    }

    if (!functionalitiesData || !functionalitiesData.titleDescriptionPairs || functionalitiesData.titleDescriptionPairs.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No functionality information available
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">NFT Functionalities</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {functionalitiesData.titleDescriptionPairs.map((item, index) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">{item.title}</h5>
                        <div className="text-sm text-gray-600 space-y-1">
                            {item.descriptions.map((desc, descIndex) => (
                                <p key={descIndex}>{desc}</p>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
