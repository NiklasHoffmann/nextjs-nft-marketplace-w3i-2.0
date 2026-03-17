/**
 * CreateProposalModal Component
 * Modal for creating new MultiSig proposals
 */
"use client";

import { useState } from 'react';
import { ProposalType } from '@/types';
import { BaseModal } from '@/components/core/Modal/BaseModal';
import { devLog } from '@/utils';
import { AddressWithEns } from '@/app/admin/components/shared/AddressWithEns';

interface CreateProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        type: ProposalType;
        title: string;
        description: string;
        functionName: string;
        functionArgs: any[];
        targetContract: string;
    }) => Promise<void>;
    marketplaceAddress: string;
}

const PROPOSAL_TEMPLATES: Record<ProposalType, {
    label: string;
    functionName: string;
    argsPlaceholder: string;
    description: string;
}> = {
    'TRANSFER_OWNERSHIP': {
        label: 'Transfer Ownership',
        functionName: 'transferOwnership',
        argsPlaceholder: '0x... (new owner address)',
        description: 'Transfer contract ownership to a new address (requires acceptance)'
    },
    'ACCEPT_OWNERSHIP': {
        label: 'Accept Ownership',
        functionName: 'acceptOwnership',
        argsPlaceholder: '(no arguments)',
        description: 'Accept pending ownership transfer'
    },
    'SET_INNOVATION_FEE': {
        label: 'Set Innovation Fee',
        functionName: 'setInnovationFee',
        argsPlaceholder: '2500 (2.5% = 2500 basis points)',
        description: 'Update the marketplace innovation fee percentage'
    },
    'ADD_WHITELISTED_COLLECTION': {
        label: 'Add Collection to Whitelist',
        functionName: 'addWhitelistedCollection',
        argsPlaceholder: '0x... (collection address)',
        description: 'Add a single NFT collection to the whitelist'
    },
    'REMOVE_WHITELISTED_COLLECTION': {
        label: 'Remove Collection from Whitelist',
        functionName: 'removeWhitelistedCollection',
        argsPlaceholder: '0x... (collection address)',
        description: 'Remove a collection from the whitelist'
    },
    'BATCH_ADD_COLLECTIONS': {
        label: 'Batch Add Collections',
        functionName: 'batchAddWhitelistedCollections',
        argsPlaceholder: '["0x...","0x..."] (array of addresses)',
        description: 'Add multiple collections to whitelist at once'
    },
    'BATCH_REMOVE_COLLECTIONS': {
        label: 'Batch Remove Collections',
        functionName: 'batchRemoveWhitelistedCollections',
        argsPlaceholder: '["0x...","0x..."] (array of addresses)',
        description: 'Remove multiple collections from whitelist'
    },
    'PAUSE_CONTRACT': {
        label: 'Pause Contract',
        functionName: 'pause',
        argsPlaceholder: '(no arguments)',
        description: 'Pause all marketplace operations (emergency only)'
    },
    'UNPAUSE_CONTRACT': {
        label: 'Unpause Contract',
        functionName: 'unpause',
        argsPlaceholder: '(no arguments)',
        description: 'Resume marketplace operations after pause'
    },
    'DIAMOND_CUT': {
        label: 'Diamond Upgrade',
        functionName: 'diamondCut',
        argsPlaceholder: 'Advanced - requires diamond cut struct',
        description: 'Upgrade diamond facets (advanced operation)'
    },
    'UPGRADE_FACET': {
        label: 'Upgrade Facet',
        functionName: 'diamondCut',
        argsPlaceholder: 'Advanced - upgrade existing facet',
        description: 'Upgrade an existing diamond facet'
    },
    'ADD_FACET': {
        label: 'Add Facet',
        functionName: 'diamondCut',
        argsPlaceholder: 'Advanced - add new facet',
        description: 'Add a new facet to the diamond'
    },
    'REMOVE_FACET': {
        label: 'Remove Facet',
        functionName: 'diamondCut',
        argsPlaceholder: 'Advanced - remove facet',
        description: 'Remove a facet from the diamond'
    },
    'REPLACE_FACET': {
        label: 'Replace Facet',
        functionName: 'diamondCut',
        argsPlaceholder: 'Advanced - replace facet',
        description: 'Replace an existing diamond facet'
    },
    'CLEAN_LISTING': {
        label: 'Clean Listing',
        functionName: 'cleanListing',
        argsPlaceholder: 'listingId (string)',
        description: 'Remove an invalid marketplace listing'
    },
    'CUSTOM': {
        label: 'Custom Function',
        functionName: '',
        argsPlaceholder: 'Custom arguments',
        description: 'Execute a custom function call'
    }
};

export function CreateProposalModal({ isOpen, onClose, onSubmit, marketplaceAddress }: CreateProposalModalProps) {
    const [selectedType, setSelectedType] = useState<ProposalType>('TRANSFER_OWNERSHIP');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [argsInput, setArgsInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const template = PROPOSAL_TEMPLATES[selectedType];

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) {
            alert('Please fill in all fields');
            return;
        }

        // Parse arguments
        let functionArgs: any[] = [];

        if (argsInput.trim()) {
            try {
                // Try to parse as JSON array
                if (argsInput.trim().startsWith('[')) {
                    functionArgs = JSON.parse(argsInput);
                } else {
                    // Single argument
                    const trimmed = argsInput.trim();
                    // Check if it's a number
                    if (/^\d+$/.test(trimmed)) {
                        functionArgs = [parseInt(trimmed)];
                    } else {
                        functionArgs = [trimmed];
                    }
                }
            } catch (e) {
                alert('Invalid arguments format. Use JSON array or single value.');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                type: selectedType,
                title,
                description,
                functionName: template.functionName,
                functionArgs,
                targetContract: marketplaceAddress
            });

            // Reset form
            setTitle('');
            setDescription('');
            setArgsInput('');
            onClose();
        } catch (error) {
            devLog.error('[Multisig] Failed to create proposal', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Create MultiSig Proposal"
            size="lg"
        >
            <div className="space-y-4">
                {/* Proposal Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proposal Type
                    </label>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as ProposalType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {Object.entries(PROPOSAL_TEMPLATES).map(([type, info]) => (
                            <option key={type} value={type}>
                                {info.label}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">{template.description}</p>
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Transfer ownership to new multisig"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Explain the purpose and reasoning for this proposal..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </div>

                {/* Function Arguments */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Function Arguments
                    </label>
                    <input
                        type="text"
                        value={argsInput}
                        onChange={(e) => setArgsInput(e.target.value)}
                        placeholder={template.argsPlaceholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Enter arguments as needed. Use JSON array format for multiple args: [&quot;0x...&quot;, 123]
                    </p>
                </div>

                {/* Preview */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Preview:</div>
                    <div className="font-mono text-sm text-gray-900">
                        {template.functionName}({argsInput || '...'})
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Target: <AddressWithEns address={marketplaceAddress} showAddress className="font-mono" />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !title.trim() || !description.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Proposal'}
                    </button>
                </div>
            </div>
        </BaseModal>
    );
}
