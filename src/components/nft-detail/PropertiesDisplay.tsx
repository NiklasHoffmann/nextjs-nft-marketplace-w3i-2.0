import { PropertiesDisplayProps } from '@/types/nft-detail';

export default function PropertiesDisplay({ properties }: PropertiesDisplayProps) {
    if (!properties || Object.keys(properties).length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties</h3>
            <div className="space-y-3">
                {Object.entries(properties).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-sm font-medium text-gray-600">{key}</span>
                        <span className="text-sm text-gray-900">{String(value)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}