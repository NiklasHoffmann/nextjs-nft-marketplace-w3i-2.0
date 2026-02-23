/**
 * MultiSig Proposals API
 * 
 * POST   /api/admin/multisig/proposals - Create new proposal
 * GET    /api/admin/multisig/proposals - List all proposals (with filters)
 */

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, parseJsonBody, BadRequestError } from '@/lib/api';
import { MultisigProposal, CreateProposalRequest, ProposalStatus, ProposalType } from '@/types';
import { randomUUID } from 'crypto';
import { getMultisigProposalCollection, serializeProposal } from '@/lib/admin/multisig-proposals';

/**
 * POST /api/admin/multisig/proposals
 * Create a new MultiSig proposal
 */
export const POST = apiHandler(async (request: NextRequest) => {
    const body = await parseJsonBody<CreateProposalRequest>(request);
    const {
        type,
        title,
        description,
        targetContract,
        functionName,
        functionArgs,
        requiredConfirmations = 2,
        expiresInDays = 7
    } = body;

    // Validation
    if (!type || !title || !targetContract || !functionName) {
        throw new BadRequestError('Missing required fields');
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(targetContract)) {
        throw new BadRequestError('Invalid targetContract address');
    }

    if (requiredConfirmations < 1 || requiredConfirmations > 10) {
        throw new BadRequestError('requiredConfirmations must be between 1 and 10');
    }

    if (expiresInDays < 1 || expiresInDays > 30) {
        throw new BadRequestError('expiresInDays must be between 1 and 30');
    }

    const initiatorAddress = request.userAddress as string;

    const now = Date.now();
    const proposal: MultisigProposal = {
        proposalId: randomUUID(),
        type,
        title,
        description,
        initiatedBy: initiatorAddress.toLowerCase(),
        initiatedAt: now,
        targetContract: targetContract.toLowerCase(),
        functionName,
        functionArgs,
        requiredConfirmations,
        confirmations: [],
        rejections: [],
        status: 'PENDING' as ProposalStatus,
        expiresAt: now + (expiresInDays * 24 * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now
    };

    // Save to MongoDB
    const collection = await getMultisigProposalCollection();

    const result = await collection.insertOne(proposal);

    return apiSuccess({
        success: true,
        proposalId: proposal.proposalId,
        proposal: { ...serializeProposal(proposal), _id: result.insertedId.toString() },
        message: 'Proposal created successfully'
    }, 201);
}, { admin: true });

/**
 * GET /api/admin/multisig/proposals
 * List all proposals with optional filters
 */
export const GET = apiHandler(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ProposalStatus | null;
    const type = searchParams.get('type');
        const isProposalType = (value: string): value is ProposalType => {
            const validTypes: ProposalType[] = [
                'TRANSFER_OWNERSHIP',
                'ACCEPT_OWNERSHIP',
                'SET_INNOVATION_FEE',
                'ADD_WHITELISTED_COLLECTION',
                'REMOVE_WHITELISTED_COLLECTION',
                'BATCH_ADD_COLLECTIONS',
                'BATCH_REMOVE_COLLECTIONS',
                'PAUSE_CONTRACT',
                'UNPAUSE_CONTRACT',
                'DIAMOND_CUT',
                'UPGRADE_FACET',
                'ADD_FACET',
                'REMOVE_FACET',
                'REPLACE_FACET',
                'CLEAN_LISTING',
                'CUSTOM'
            ];
            return validTypes.includes(value as ProposalType);
        };

    const rawLimit = Number.parseInt(searchParams.get('limit') || '50', 10);
    const rawSkip = Number.parseInt(searchParams.get('skip') || '0', 10);
    const limit = Number.isNaN(rawLimit) ? 50 : Math.min(Math.max(rawLimit, 1), 100);
    const skip = Number.isNaN(rawSkip) ? 0 : Math.max(rawSkip, 0);

    const collection = await getMultisigProposalCollection();

    // Build filter
    const filter: Partial<Pick<MultisigProposal, 'status' | 'type'>> = {};
    if (status) filter.status = status;
    if (type && isProposalType(type)) filter.type = type;

    // Fetch proposals
    const proposals = await collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

    // Get counts
    const total = await collection.countDocuments(filter);
    const pending = await collection.countDocuments({ status: 'PENDING' });
    const confirmed = await collection.countDocuments({ status: 'CONFIRMED' });
    const executed = await collection.countDocuments({ status: 'EXECUTED' });

    return apiSuccess({
        proposals: proposals.map(serializeProposal),
        total,
        pending,
        confirmed,
        executed
    });
}, { admin: true });
