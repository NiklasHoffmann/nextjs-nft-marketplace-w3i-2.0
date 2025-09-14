"use client";

interface RaritySelectorProps {
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    onChange: (rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary') => void;
}

const RARITY_OPTIONS = [
    {
        value: 'common' as const,
        label: 'Common',
        description: 'Häufig vorkommend',
        color: 'bg-gray-100 text-gray-700 border-gray-300',
        selectedColor: 'bg-gray-200 border-gray-400',
        percentage: '60-80%',
        icon: '⚪'
    },
    {
        value: 'uncommon' as const,
        label: 'Uncommon',
        description: 'Weniger häufig',
        color: 'bg-green-100 text-green-700 border-green-300',
        selectedColor: 'bg-green-200 border-green-400',
        percentage: '15-25%',
        icon: '🟢'
    },
    {
        value: 'rare' as const,
        label: 'Rare',
        description: 'Selten',
        color: 'bg-blue-100 text-blue-700 border-blue-300',
        selectedColor: 'bg-blue-200 border-blue-400',
        percentage: '5-15%',
        icon: '🔵'
    },
    {
        value: 'epic' as const,
        label: 'Epic',
        description: 'Sehr selten',
        color: 'bg-purple-100 text-purple-700 border-purple-300',
        selectedColor: 'bg-purple-200 border-purple-400',
        percentage: '1-5%',
        icon: '🟣'
    },
    {
        value: 'legendary' as const,
        label: 'Legendary',
        description: 'Extrem selten',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        selectedColor: 'bg-yellow-200 border-yellow-400',
        percentage: '<1%',
        icon: '🟡'
    }
];

export default function RaritySelector({ rarity, onChange }: RaritySelectorProps) {
    const selectedOption = RARITY_OPTIONS.find(option => option.value === rarity);

    return (
        <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Rarity Level
                </label>
                {selectedOption && (
                    <span className="text-xs text-gray-500">
                        {selectedOption.icon} {selectedOption.label} ({selectedOption.percentage})
                    </span>
                )}
            </div>

            {/* Rarity Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {RARITY_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        className={`p-3 border-2 rounded-lg transition-all duration-200 ${rarity === option.value
                            ? option.selectedColor + ' transform scale-105 shadow-md'
                            : option.color + ' hover:shadow-sm'
                            }`}
                    >
                        <div className="text-center">
                            <div className="text-lg mb-1">{option.icon}</div>
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs opacity-75 mt-1">{option.percentage}</div>
                        </div>
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selected Rarity Details */}
                <div className={`p-4 rounded-lg border ${selectedOption ? selectedOption.color : 'bg-gray-100 border-gray-300'}`}>
                    {selectedOption ? (
                        <div className="flex flex-col text-center items-center gap-3">
                            <div className="text-2xl">{selectedOption.icon}</div>
                            <div>
                                <h4 className="font-medium">{selectedOption.label} Rarity</h4>
                                <p className="text-sm opacity-75">{selectedOption.description}</p>
                                <p className="text-xs opacity-60 mt-1">
                                    Typische Verteilung in Collections: {selectedOption.percentage}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-4">
                            <div className="text-2xl mb-2">🎯</div>
                            <p className="text-sm font-medium">Rarity auswählen</p>
                            <p className="text-xs opacity-75">Wähle eine Rarity-Stufe aus, um Details zu sehen</p>
                        </div>
                    )}
                </div>

                {/* Rarity Info */}
                <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-xs text-gray-600 space-y-1">
                        <p className="font-medium">💡 Rarity Guidelines:</p>
                        <ul className="space-y-1 ml-4">
                            <li>• <strong>Common:</strong> Standard NFTs ohne besondere Eigenschaften</li>
                            <li>• <strong>Uncommon:</strong> Einige seltene Traits oder Features</li>
                            <li>• <strong>Rare:</strong> Mehrere seltene Eigenschaften kombiniert</li>
                            <li>• <strong>Epic:</strong> Sehr seltene Trait-Kombinationen</li>
                            <li>• <strong>Legendary:</strong> Einzigartige oder extrem seltene NFTs</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}