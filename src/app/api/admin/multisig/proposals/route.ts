/**
 * MultiSig Proposals API
 * 
 * POST   /api/admin/multisig/proposals - Create new proposal
 * GET    /api/admin/multisig/proposals - List all proposals (with filters)
 */

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, parseJsonBody, BadRequestError } from '@/lib/api';
import { withAdmin } from '@/lib/middleware';
import clientPromise from '@/lib/mongodb';
import { MultisigProposal, CreateProposalRequest, ProposalStatus } from '@/types';
import { randomUUID } from 'crypto';

/**
 * POST /api/admin/multisig/proposals
 * Create a new MultiSig proposal
 */
export const POST = apiHandler(async (request: NextRequest) => {
    await withAdmin(request);

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

    if (requiredConfirmations < 1 || requiredConfirmations > 10) {
        throw new BadRequestError('requiredConfirmations must be between 1 and 10');
    }

    // @ts-ignore - Injected by withAdmin middleware
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
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection<MultisigProposal>('multisig_proposals');

    const result = await collection.insertOne(proposal);

    return apiSuccess({
        success: true,
        proposalId: proposal.proposalId,
        proposal: { ...proposal, _id: result.insertedId.toString() },
        message: 'Proposal created successfully'
    }, 201);
});

/**
 * GET /api/admin/multisig/proposals
 * List all proposals with optional filters
 */
export const GET = apiHandler(async (request: NextRequest) => {
    await withAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ProposalStatus | null;
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const collection = db.collection<MultisigProposal>('multisig_proposals');

    // Build filter
    const filter: any = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

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
        proposals: proposals.map(p => ({ ...p, _id: p._id?.toString() })),
        total,
        pending,
        confirmed,
        executed
    });
});
