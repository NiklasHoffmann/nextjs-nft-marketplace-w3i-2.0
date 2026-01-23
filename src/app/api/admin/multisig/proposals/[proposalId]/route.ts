/**
 * MultiSig Proposal Details API
 * 
 * GET /api/admin/multisig/proposals/[proposalId] - Get proposal details
 */

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess, NotFoundError } from '@/lib/api';
import { withAdmin } from '@/lib/middleware';
import clientPromise from '@/lib/mongodb';
import { MultisigProposal } from '@/types';

/**
 * GET /api/admin/multisig/proposals/[proposalId]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ proposalId: string }> }
) {
    return apiHandler(async (req: NextRequest) => {
        await withAdmin(req);

        const { proposalId } = await params;

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const collection = db.collection<MultisigProposal>('multisig_proposals');

        const proposal = await collection.findOne({ proposalId });

        if (!proposal) {
            throw new NotFoundError('Proposal not found');
        }

        return apiSuccess({
            proposal: { ...proposal, _id: proposal._id?.toString() }
        });
    })(request);
}
