/**
 * MultiSig Proposal Rejection API
 * 
 * POST /api/admin/multisig/proposals/[proposalId]/reject - Reject a proposal
 */

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, BadRequestError } from '@/lib/api';
import { ProposalConfirmation } from '@/types';
import {
    assertValidProposalId,
    getMultisigProposalCollection,
    getProposalOrThrow,
    getUpdatedProposalOrThrow,
    serializeProposal,
} from '@/lib/admin/multisig-proposals';

/**
 * POST /api/admin/multisig/proposals/[proposalId]/reject
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ proposalId: string }> }
) {
    return apiHandler(async (req: NextRequest) => {
        const { proposalId } = await params;
        assertValidProposalId(proposalId);
        const adminAddress = (req.userAddress as string).toLowerCase();

        const collection = await getMultisigProposalCollection();
        const proposal = await getProposalOrThrow(collection, proposalId);

        // Validations
        if (proposal.status === 'EXECUTED') {
            throw new BadRequestError('Cannot reject already executed proposal');
        }

        if (proposal.status === 'REJECTED') {
            throw new BadRequestError('Proposal is already rejected');
        }

        // Check if already rejected
        const alreadyRejected = proposal.rejections.some(
            r => r.address.toLowerCase() === adminAddress
        );

        if (alreadyRejected) {
            throw new BadRequestError('You have already rejected this proposal');
        }

        // Add rejection
        const rejection: ProposalConfirmation = {
            address: adminAddress,
            timestamp: Date.now()
        };

        // Update proposal - mark as REJECTED
        await collection.updateOne(
            { proposalId },
            {
                $set: {
                    rejections: [...proposal.rejections, rejection],
                    status: 'REJECTED',
                    updatedAt: Date.now()
                }
            }
        );

        // Fetch updated proposal
        const updatedProposal = await getUpdatedProposalOrThrow(collection, proposalId);

        return apiSuccess({
            success: true,
            proposal: serializeProposal(updatedProposal),
            message: 'Proposal rejected successfully'
        });
    }, { admin: true })(request);
}
