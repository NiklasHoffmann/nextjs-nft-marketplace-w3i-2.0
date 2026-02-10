/**
 * FlowSidebar Component
 * 
 * Displays the 7-step listing flow with dynamic labels and status indicators.
 * 
 * @module sell/components/common
 */

'use client';

import React from 'react';
import { useListingFlow } from '../../contexts/ListingFlowContext';
import type { ListingStep, StepStatus, ListingType } from '../../types';

interface FlowSidebarProps {
    className?: string;
    whitelistStatus?: StepStatus;
    approvalStatus?: StepStatus;
    selectedCount?: number;
    totalNFTs?: number;
    filteredCount?: number;
    listingType?: ListingType;
}

const statusLabel: Record<StepStatus, string> = {
    'not-started': 'Ausstehend',
    checking: 'In Prüfung',
    done: 'Erledigt',
    failed: 'Aktion nötig'
};

const statusStyle: Record<StepStatus, string> = {
    'not-started': 'border-gray-200 bg-gray-50 text-gray-500',
    checking: 'border-blue-200 bg-blue-50 text-blue-700',
    done: 'border-green-200 bg-green-50 text-green-700',
    failed: 'border-red-200 bg-red-50 text-red-700'
};

interface FlowStepItem {
    id: string;
    label: string;
    icon: string;
    checkType?: 'whitelist' | 'approval';
    selectionType?: 'select';
}

const flowSteps: FlowStepItem[] = [
    {
        id: 'select',
        label: 'NFT(s) auswählen',
        icon: '🎯',
        selectionType: 'select'
    },
    {
        id: 'whitelist',
        label: 'Whitelist Check',
        icon: '🔍',
        checkType: 'whitelist'
    },
    {
        id: 'approval',
        label: 'Approval Check',
        icon: '✓',
        checkType: 'approval'
    },
    {
        id: 'form',
        label: 'NFT konfigurieren',
        icon: '🧭'
    },
    {
        id: 'preview',
        label: 'Listing prüfen',
        icon: '📝'
    },
    {
        id: 'listing',
        label: 'Signieren',
        icon: '✍️'
    },
    {
        id: 'success',
        label: 'Live',
        icon: '✅'
    }
];

export function FlowSidebar({
    className = '',
    whitelistStatus = 'not-started',
    approvalStatus = 'not-started',
    selectedCount = 0,
    totalNFTs = 0,
    filteredCount,
    listingType = 'single'
}: FlowSidebarProps) {
    const { progressData } = useListingFlow();

    // Dynamische Labels basierend auf listingType
    const getStepLabel = (stepId: string): string => {
        if (stepId === 'select') {
            return listingType === 'batch' ? 'NFTs auswählen' : 'NFT auswählen';
        }
        if (stepId === 'form') {
            return listingType === 'batch' ? 'NFTs konfigurieren' : 'NFT konfigurieren';
        }
        if (stepId === 'listing') {
            return listingType === 'batch' ? 'Transaktionen signieren' : 'Signieren';
        }
        const step = flowSteps.find(s => s.id === stepId);
        return step?.label || stepId;
    };

    // Intelligente Step-Bestimmung basierend auf Fortschritt
    let currentStepId: string = progressData.currentStep;

    // Wenn noch keine NFTs ausgewählt, dann ist 'select' der aktive Step
    if (selectedCount === 0) {
        currentStepId = 'select';
    }
    // Wenn Whitelist check läuft, ist 'whitelist' aktiv
    else if (whitelistStatus === 'checking') {
        currentStepId = 'whitelist';
    }
    // Wenn Approval check läuft, ist 'approval' aktiv
    else if (approvalStatus === 'checking') {
        currentStepId = 'approval';
    }
    // Wenn Checks fehlschlagen, bleibe bei select
    else if (whitelistStatus === 'failed' || approvalStatus === 'failed') {
        currentStepId = 'select';
    }
    // Wenn Transaction pending ist (nach signing), wechsle zu 'success' Step
    else if (progressData.currentStep === 'listing' && progressData.progressStep === 'pending') {
        currentStepId = 'success';
    }

    const activeStep = flowSteps.find(step => step.id === currentStepId) ?? flowSteps[0]!;
    const stepIndex = flowSteps.findIndex(step => step.id === activeStep.id);

    const getStatus = (step: FlowStepItem): StepStatus => {
        // Selection-spezifischer Status
        if (step.selectionType === 'select') {
            if (selectedCount > 0) return 'done';
            return 'not-started';
        }

        // Check-spezifische Status
        if (step.checkType === 'whitelist') return whitelistStatus;
        if (step.checkType === 'approval') return approvalStatus;

        // Bei 'listing' Step: Prüfe progressStep für detaillierten Status
        if (step.id === 'listing') {
            // Wenn wir schon bei success sind, ist listing erledigt
            if (progressData.currentStep === 'success') return 'done';

            // Sonst prüfe den progressStep
            if (progressData.currentStep === 'listing') {
                const progressStep = progressData.progressStep;
                // Signieren ist erledigt sobald die TX submitted wurde (pending) oder erfolgreich war
                if (progressStep === 'pending' || progressStep === 'success') return 'done';
                if (progressStep === 'error') return 'failed';
                if (progressStep === 'signing') return 'checking';
            }

            // Noch nicht erreicht
            const currentIndex = flowSteps.findIndex(s => s.id === progressData.currentStep);
            const listingIndex = flowSteps.findIndex(s => s.id === 'listing');
            if (currentIndex > listingIndex) return 'done';
            return 'not-started';
        }

        // Bei 'success' Step: Blau während Transaction läuft, Grün wenn NFT Daten geladen sind
        if (step.id === 'success') {
            // Grün nur wenn wir auf success page sind UND die NFT Daten geladen sind
            if (progressData.currentStep === 'success' && progressData.nftDataLoaded) {
                return 'done';
            }
            // Blau während die Transaction läuft ODER während NFT Daten laden
            if ((progressData.currentStep === 'listing' && progressData.progressStep === 'pending') ||
                (progressData.currentStep === 'success' && !progressData.nftDataLoaded)) {
                return 'checking';
            }
            return 'not-started';
        }

        // Form und Preview Steps: Als erledigt markieren wenn wir weiter sind
        if (step.id === 'form' || step.id === 'preview') {
            const currentIndex = flowSteps.findIndex(s => s.id === progressData.currentStep);
            const thisStepIndex = flowSteps.findIndex(s => s.id === step.id);
            if (currentIndex > thisStepIndex) return 'done';
        }

        // Flow-Status basierend auf aktuellem Schritt
        const currentIndex = flowSteps.findIndex(s => s.id === step.id);
        if (currentIndex < stepIndex) return 'done';
        if (step.id === activeStep.id) return 'checking';
        return 'not-started';
    };

    const selectedLabel = listingType === 'batch' ? 'NFTs ausgewählt' : 'NFT ausgewählt';

    return (
        <aside className={`space-y-3 ${className}`}>
            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">Flow</p>
                <div className="mt-2 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500" aria-hidden />
                    <span className="text-xs text-gray-700 font-medium">{getStepLabel(activeStep.id)}</span>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Schritte</p>
                <div className="space-y-1.5">
                    {flowSteps.map(step => {
                        const stepStatus = getStatus(step);
                        const isActive = step.id === activeStep.id;
                        return (
                            <div
                                key={step.id}
                                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition ${isActive
                                    ? 'border-indigo-300 bg-indigo-50'
                                    : stepStatus === 'done'
                                        ? 'border-green-300 bg-green-50'
                                        : stepStatus === 'failed'
                                            ? 'border-red-300 bg-red-50'
                                            : stepStatus === 'checking'
                                                ? 'border-blue-300 bg-blue-50'
                                                : 'border-gray-200 bg-gray-50'
                                    }`}
                            >
                                <span className="text-sm leading-none">{step.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-900 leading-tight">
                                        {getStepLabel(step.id)}
                                    </p>
                                </div>
                                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                                {stepStatus === 'done' && <span className="text-green-600 text-xs">✓</span>}
                                {stepStatus === 'failed' && <span className="text-red-600 text-xs">✗</span>}
                                {stepStatus === 'checking' && !isActive && <span className="text-blue-600 text-xs">...</span>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
}
