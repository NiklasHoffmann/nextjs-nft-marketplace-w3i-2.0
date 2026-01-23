/**
 * MultiSig Proposal Execution API
 * 
 * POST /api/admin/multisig/proposals/[proposalId]/execute - Execute a confirmed proposal
 * 
 * Note: This marks the proposal as ready for execution. The actual on-chain
 * transaction must be initiated from the frontend with the user's wallet.
 */

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, parseJsonBody, NotFoundError, BadRequestError } from '@/lib/api';
import { withAdmin } from '@/lib/middleware';
import clientPromise from '@/lib/mongodb';
import { MultisigProposal } from '@/types';

interface ExecuteProposalRequest {
    txHash: string; // Transaction hash from the executed on-chain transaction
}

/**
 * POST /api/admin/multisig/proposals/[proposalId]/execute
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ proposalId: string }> }
) {
    return apiHandler(async (req: NextRequest) => {
        await withAdmin(req);

        const { proposalId } = await params;
        const body = await parseJsonBody<ExecuteProposalRequest>(req);
        const { txHash } = body;

        // @ts-ignore - Injected by withAdmin
        const adminAddress = (req.userAddress as string).toLowerCase();

        if (!txHash) {
            throw new BadRequestError('Transaction hash is required');
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const collection = db.collection<MultisigProposal>('multisig_proposals');

        const proposal = await collection.findOne({ proposalId });

        if (!proposal) {
            throw new NotFoundError('Proposal not found');
        }

        // Validations
        if (proposal.status !== 'CONFIRMED') {
            throw new BadRequestError(`Proposal must be CONFIRMED to execute. Current status: ${proposal.status}`);
        }

        if (Date.now() > proposal.expiresAt) {
            await collection.updateOne(
                { proposalId },
                { $set: { status: 'EXPIRED', updatedAt: Date.now() } }
            );
            throw new BadRequestError('Proposal has expired');
        }

        // Update proposal as executed
        await collection.updateOne(
            { proposalId },
            {
                $set: {
                    status: 'EXECUTED',
                    executedBy: adminAddress,
                    executedAt: Date.now(),
                    txHash,
                    updatedAt: Date.now()
                }
            }
        );

        // Fetch updated proposal
        const updatedProposal = await collection.findOne({ proposalId });

        return apiSuccess({
            success: true,
            proposal: { ...updatedProposal, _id: updatedProposal?._id?.toString() },
            message: 'Proposal marked as executed successfully'
        });
    })(request);
}
