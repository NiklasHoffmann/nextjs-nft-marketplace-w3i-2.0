"use client";

import React from 'react';
import { ApolloError } from '@apollo/client';
import { devLog } from '@/utils';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error | ApolloError;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error | ApolloError }>;
}

const DefaultErrorFallback: React.FC<{ error: Error | ApolloError }> = ({ error }) => {
    const isApolloError = 'networkError' in error || 'graphQLErrors' in error;

    return (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 m-4">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                        {isApolloError ? 'GraphQL Service Temporarily Unavailable' : 'Application Error'}
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                        {isApolloError ? (
                            <div>
                                <p>The marketplace is running in fallback mode with limited data.</p>
                                <p className="mt-1 text-xs">This typically resolves automatically. All core functionality remains available.</p>
                            </div>
                        ) : (
                            <p>An unexpected error occurred. Please try refreshing the page.</p>
                        )}
                    </div>
                    {process.env.NODE_ENV === 'development' && (
                        <details className="mt-2">
                            <summary className="text-xs text-yellow-600 cursor-pointer">Technical Details</summary>
                            <pre className="mt-1 text-xs text-yellow-600 whitespace-pre-wrap">
                                {error.message}
                            </pre>
                        </details>
                    )}
                </div>
            </div>
        </div>
    );
};

export class ApolloErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error | ApolloError): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error | ApolloError, errorInfo: React.ErrorInfo) {
        const isApolloError = 'networkError' in error || 'graphQLErrors' in error;

        if (isApolloError) {
            devLog.warn('Apollo error caught by boundary:', error);
            devLog.info('Application will continue with fallback data');
        } else {
            devLog.error('Application error caught by boundary:', error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError && this.state.error) {
            const FallbackComponent = this.props.fallback || DefaultErrorFallback;
            return <FallbackComponent error={this.state.error} />;
        }

        return this.props.children;
    }
}

export default ApolloErrorBoundary;
