/**
 * MultiSig Proposal Confirmation API
 * 
 * POST /api/admin/multisig/proposals/[proposalId]/confirm - Confirm a proposal
 */

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, NotFoundError, BadRequestError, ForbiddenError } from '@/lib/api';
import { withAdmin } from '@/lib/middleware';
import clientPromise from '@/lib/mongodb';
import { MultisigProposal, ProposalConfirmation } from '@/types';

/**
 * POST /api/admin/multisig/proposals/[proposalId]/confirm
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
        if (proposal.status !== 'PENDING') {
            throw new BadRequestError(`Cannot confirm proposal with status: ${proposal.status}`);
        }

        if (Date.now() > proposal.expiresAt) {
            // Auto-expire
            await collection.updateOne(
                { proposalId },
                { $set: { status: 'EXPIRED', updatedAt: Date.now() } }
            );
            throw new BadRequestError('Proposal has expired');
        }

        // Check if already confirmed by this admin
        const alreadyConfirmed = proposal.confirmations.some(
            c => c.address.toLowerCase() === adminAddress
        );

        if (alreadyConfirmed) {
            throw new BadRequestError('You have already confirmed this proposal');
        }

        // Check if rejected by this admin
        const hasRejected = proposal.rejections.some(
            r => r.address.toLowerCase() === adminAddress
        );

        if (hasRejected) {
            throw new ForbiddenError('You have rejected this proposal. Cannot confirm.');
        }

        // Add confirmation
        const confirmation: ProposalConfirmation = {
            address: adminAddress,
            timestamp: Date.now()
        };

        const newConfirmations = [...proposal.confirmations, confirmation];
        const newStatus = newConfirmations.length >= proposal.requiredConfirmations
            ? 'CONFIRMED'
            : 'PENDING';

        // Update proposal
        await collection.updateOne(
            { proposalId },
            {
                $set: {
                    confirmations: newConfirmations,
                    status: newStatus,
                    updatedAt: Date.now()
                }
            }
        );

        // Fetch updated proposal
        const updatedProposal = await collection.findOne({ proposalId });

        return apiSuccess({
            success: true,
            proposal: { ...updatedProposal, _id: updatedProposal?._id?.toString() },
            message: newStatus === 'CONFIRMED'
                ? 'Proposal confirmed! Ready to execute.'
                : 'Confirmation added successfully'
        });
    })(request);
}
