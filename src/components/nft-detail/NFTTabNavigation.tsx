type TabType = 'project' | 'functionalities' | 'tokenomics';

interface NFTTabNavigationProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export default function NFTTabNavigation({ activeTab, onTabChange }: NFTTabNavigationProps) {
    const tabs = [
        { key: 'project' as TabType, label: 'Project' },
        { key: 'functionalities' as TabType, label: 'Functionalities' },
        { key: 'tokenomics' as TabType, label: 'Tokenomics' }
    ];

    return (
        <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => onTabChange(tab.key)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === tab.key
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}