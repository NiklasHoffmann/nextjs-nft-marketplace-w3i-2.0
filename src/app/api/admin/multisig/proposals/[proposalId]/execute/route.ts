/**
 * MultiSig Proposal Execution API
 * 
 * POST /api/admin/multisig/proposals/[proposalId]/execute - Execute a confirmed proposal
 * 
 * Note: This marks the proposal as ready for execution. The actual on-chain
 * transaction must be initiated from the frontend with the user's wallet.
 */

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, parseJsonBody, BadRequestError } from '@/lib/api';
import {
    assertValidProposalId,
    getMultisigProposalCollection,
    getProposalOrThrow,
    getUpdatedProposalOrThrow,
    serializeProposal,
} from '@/lib/admin/multisig-proposals';

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
        const { proposalId } = await params;
        assertValidProposalId(proposalId);
        const body = await parseJsonBody<ExecuteProposalRequest>(req);
        const { txHash } = body;

        const adminAddress = (req.userAddress as string).toLowerCase();

        if (!txHash) {
            throw new BadRequestError('Transaction hash is required');
        }

        if (!/^0x([A-Fa-f0-9]{64})$/.test(txHash)) {
            throw new BadRequestError('Invalid transaction hash format');
        }

        const collection = await getMultisigProposalCollection();
        const proposal = await getProposalOrThrow(collection, proposalId);

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
        const updatedProposal = await getUpdatedProposalOrThrow(collection, proposalId);

        return apiSuccess({
            success: true,
            proposal: serializeProposal(updatedProposal),
            message: 'Proposal marked as executed successfully'
        });
    }, { admin: true })(request);
}
