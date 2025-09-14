import { memo, useMemo, useCallback } from 'react';
import { NFTTabNavigationProps, TabType } from '@/types';

function NFTTabNavigation({ activeTab, onTabChange }: NFTTabNavigationProps) {
    // Memoize tabs array with better organization
    const tabs = useMemo(() => [
        {
            key: 'project' as TabType,
            label: 'Projekt',
            icon: (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        },
        {
            key: 'overview' as TabType,
            label: 'Overview',
            icon: (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            key: 'technical' as TabType,
            label: 'Technical',
            icon: (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
        {/*
            key: 'investment' as TabType,
            label: 'Investment',
            icon: (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
            )
        },
        {
            key: 'insights' as TabType,
            label: 'Market Insights',
            icon: (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        */},
        {
            key: 'personal' as TabType,
            label: 'Personal',
            icon: (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 8.943 7.134 6 12 6c4.866 0 8.268 2.943 9.542 6-1.274 3.057-4.676 6-9.542 6-4.866 0-8.268-2.943-9.542-6z" />
                </svg>
            )
        },
        {
            key: 'functionalities' as TabType,
            label: 'Functionalities',
            icon: (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 8.943 7.134 6 12 6c4.866 0 8.268 2.943 9.542 6-1.274 3.057-4.676 6-9.542 6-4.866 0-8.268-2.943-9.542-6z" />
                </svg>
            )
        },
        {
            key: 'tokenomics' as TabType,
            label: 'Tokenomics',
            icon: (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
            )
        }
    ], []);

    // Memoize tab click handler to prevent creating new function on every render
    const handleTabClick = useCallback((tabKey: TabType) => {
        onTabChange(tabKey);
    }, [onTabChange]);

    // Memoize tab styling function
    const getTabClassName = useCallback((tabKey: TabType) => {
        const baseClass = 'flex items-center py-4 px-4 border-b-2 font-medium text-sm transition-colors focus:outline-none rounded-t-lg';
        return activeTab === tabKey
            ? `${baseClass} border-blue-500 text-blue-600 bg-blue-50`
            : `${baseClass} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50`;
    }, [activeTab]);

    return (
        <div className="border-b border-gray-200 bg-gray-50 py-2 bg-primary">
            <nav className="flex space-x-2 px-6" aria-label="Tabs" role="tablist">
                {tabs
                    .filter((tab): tab is { key: TabType; label: string; icon: JSX.Element } => !!tab && !!tab.key)
                    .map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabClick(tab.key)}
                            className={getTabClassName(tab.key)}
                            role="tab"
                            aria-selected={activeTab === tab.key}
                            aria-controls={`tabpanel-${tab.key}`}
                            id={`tab-${tab.key}`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
            </nav>
        </div>
    );
}

export default memo(NFTTabNavigation);
