'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AggregatedNFT } from '@/types/core/core-nft-modern';
import type {
    ListingMode,
    StepStatus,
    ProgressStep,
    Currency,
    TradeType
} from '../types';
import type { ListingStep } from '../types';

// Re-export for backwards compatibility
export type { ListingStep };

// ==================== Context Data Interfaces ====================

export interface ListingFormData {
    mode: ListingMode;
    selectedNFT: AggregatedNFT | null;
    selectedNFTs?: AggregatedNFT[];
    userNFTs?: AggregatedNFT[];
    price?: string;
    currency?: Currency;
    description?: string;
    duration?: string;
    allowOffers?: boolean;
    tradeType?: TradeType;
    targetNFT?: AggregatedNFT | null;
    targetCollection?: string;
}

export interface ListingProgressData {
    currentStep: ListingStep;
    progressStep?: ProgressStep;
    completedSteps: string[];
    whitelistStatus?: StepStatus;
    approvalStatus?: StepStatus;
    txHash?: string;
    error?: string;
    nftDataLoaded?: boolean;
}

// ==================== Context Value Interface ====================

interface ListingFlowContextValue {
    // Form Data
    formData: ListingFormData;
    setFormData: (data: Partial<ListingFormData>) => void;

    // Progress Data
    progressData: ListingProgressData;
    setProgressStep: (step: ListingStep, progressStep?: ProgressStep) => void;
    setCompletedSteps: (steps: string[]) => void;
    setWhitelistStatus: (status: StepStatus) => void;
    setApprovalStatus: (status: StepStatus) => void;
    setTxHash: (hash: string) => void;
    setError: (error: string) => void;
    setNftDataLoaded: (loaded: boolean) => void;

    // Actions
    reset: () => void;
    canGoBack: boolean;
}

const ListingFlowContext = createContext<ListingFlowContextValue | undefined>(undefined);

const STORAGE_KEY = 'listing-flow-data';

const initialFormData: ListingFormData = {
    mode: 'sale',
    selectedNFT: null,
    currency: '0x0000000000000000000000000000000000000000', // Native ETH
};

const initialProgressData: ListingProgressData = {
    currentStep: 'form',
    completedSteps: [],
};

export function ListingFlowProvider({ children }: { children: ReactNode }) {
    const [formData, setFormDataState] = useState<ListingFormData>(initialFormData);
    const [progressData, setProgressDataState] = useState<ListingProgressData>(initialProgressData);

    // Load from sessionStorage on mount
    useEffect(() => {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const { formData: storedForm, progressData: storedProgress } = JSON.parse(stored);
                if (storedForm) setFormDataState(storedForm);
                if (storedProgress) setProgressDataState(storedProgress);
            } catch (error) {
                console.error('Failed to load listing flow data:', error);
            }
        }
    }, []);

    // Save to sessionStorage on change
    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, progressData }));
    }, [formData, progressData]);

    const setFormData = useCallback((data: Partial<ListingFormData>) => {
        setFormDataState(prev => ({ ...prev, ...data }));
    }, []);

    const setProgressStep = useCallback((step: ListingStep, progressStep?: ProgressStep) => {
        setProgressDataState(prev => ({
            ...prev,
            currentStep: step,
            progressStep,
        }));
    }, []);

    const setCompletedSteps = useCallback((steps: string[]) => {
        setProgressDataState(prev => ({ ...prev, completedSteps: steps }));
    }, []);

    const setWhitelistStatus = useCallback((status: StepStatus) => {
        setProgressDataState(prev => ({ ...prev, whitelistStatus: status }));
    }, []);

    const setApprovalStatus = useCallback((status: StepStatus) => {
        setProgressDataState(prev => ({ ...prev, approvalStatus: status }));
    }, []);

    const setTxHash = useCallback((hash: string) => {
        setProgressDataState(prev => ({ ...prev, txHash: hash }));
    }, []);

    const setError = useCallback((error: string) => {
        setProgressDataState(prev => ({ ...prev, error }));
    }, []);

    const setNftDataLoaded = useCallback((loaded: boolean) => {
        setProgressDataState(prev => ({ ...prev, nftDataLoaded: loaded }));
    }, []);

    const reset = useCallback(() => {
        setFormDataState(initialFormData);
        setProgressDataState(initialProgressData);
        sessionStorage.removeItem(STORAGE_KEY);
    }, []);

    const canGoBack = progressData.currentStep !== 'form' && progressData.currentStep !== 'success';

    const value: ListingFlowContextValue = {
        formData,
        setFormData,
        progressData,
        setProgressStep,
        setCompletedSteps,
        setWhitelistStatus,
        setApprovalStatus,
        setTxHash,
        setError,
        setNftDataLoaded,
        reset,
        canGoBack,
    };

    return (
        <ListingFlowContext.Provider value={value}>
            {children}
        </ListingFlowContext.Provider>
    );
}

export function useListingFlow() {
    const context = useContext(ListingFlowContext);
    if (!context) {
        throw new Error('useListingFlow must be used within ListingFlowProvider');
    }
    return context;
}
