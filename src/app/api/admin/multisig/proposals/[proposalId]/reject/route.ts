/**
 * MultiSig Proposal Rejection API
 * 
 * POST /api/admin/multisig/proposals/[proposalId]/reject - Reject a proposal
 */

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, NotFoundError, BadRequestError } from '@/lib/api';
import { withAdmin } from '@/lib/middleware';
import clientPromise from '@/lib/mongodb';
import { MultisigProposal, ProposalConfirmation } from '@/types';

/**
 * POST /api/admin/multisig/proposals/[proposalId]/reject
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ proposalId: string }> }
) {
    return apiHandler(async (req: NextRequest) => {
        await withAdmin(req);

        const { proposalId } = await params;
        // @ts-ignore - Injected by withAdmin
        const adminAddress = (req.userAddress as string).toLowerCase();

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const collection = db.collection<MultisigProposal>('multisig_proposals');

        const proposal = await collection.findOne({ proposalId });

        if (!proposal) {
            throw new NotFoundError('Proposal not found');
        }

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
        const updatedProposal = await collection.findOne({ proposalId });

        return apiSuccess({
            success: true,
            proposal: { ...updatedProposal, _id: updatedProposal?._id?.toString() },
            message: 'Proposal rejected successfully'
        });
    })(request);
}
