/**
 * MultiSig Proposal Details API
 * 
 * GET /api/admin/multisig/proposals/[proposalId] - Get proposal details
 */

import { NextRequest } from 'next/server';
import { apiHandler, apiSuccess } from '@/lib/api';
import {
    assertValidProposalId,
    getMultisigProposalCollection,
    getProposalOrThrow,
    serializeProposal,
} from '@/lib/admin/multisig-proposals';

/**
 * GET /api/admin/multisig/proposals/[proposalId]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ proposalId: string }> }
) {
    return apiHandler(async (req: NextRequest) => {
        const { proposalId } = await params;
        assertValidProposalId(proposalId);

        const collection = await getMultisigProposalCollection();
        const proposal = await getProposalOrThrow(collection, proposalId);

        return apiSuccess({
            proposal: serializeProposal(proposal)
        });
    }, { admin: true })(request);
}
