import { memo, useMemo, useCallback } from 'react';
import { NFTTabNavigationProps, TabType } from '@/types/nft-detail';

function NFTTabNavigation({ activeTab, onTabChange }: NFTTabNavigationProps) {
    // Memoize tabs array to prevent recreating on every render
    const tabs = useMemo(() => [
        { key: 'project' as TabType, label: 'Project' },
        { key: 'functionalities' as TabType, label: 'Functionalities' },
        { key: 'tokenomics' as TabType, label: 'Tokenomics' }
    ], []);

    // Memoize tab click handler to prevent creating new function on every render
    const handleTabClick = useCallback((tabKey: TabType) => {
        onTabChange(tabKey);
    }, [onTabChange]);

    // Memoize tab styling function
    const getTabClassName = useCallback((tabKey: TabType) => {
        const baseClass = 'py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
        return activeTab === tabKey
            ? `${baseClass} border-blue-500 text-blue-600`
            : `${baseClass} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`;
    }, [activeTab]);

    return (
        <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs" role="tablist">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabClick(tab.key)}
                        className={getTabClassName(tab.key)}
                        role="tab"
                        aria-selected={activeTab === tab.key}
                        aria-controls={`tabpanel-${tab.key}`}
                        id={`tab-${tab.key}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}

export default memo(NFTTabNavigation);