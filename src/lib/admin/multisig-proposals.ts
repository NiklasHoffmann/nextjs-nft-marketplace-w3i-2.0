import clientPromise from '@/lib/mongodb';
import { BadRequestError, NotFoundError } from '@/lib/api';
import { MultisigProposal } from '@/types';
import { Collection } from 'mongodb';

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getMultisigProposalCollection(): Promise<Collection<MultisigProposal>> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    return db.collection<MultisigProposal>('multisig_proposals');
}

export function assertValidProposalId(proposalId: string): void {
    if (!UUID_V4_REGEX.test(proposalId)) {
        throw new BadRequestError('Invalid proposalId format');
    }
}

export async function getProposalOrThrow(
    collection: Collection<MultisigProposal>,
    proposalId: string
): Promise<MultisigProposal> {
    const proposal = await collection.findOne({ proposalId });

    if (!proposal) {
        throw new NotFoundError('Proposal not found');
    }

    return proposal;
}

export async function getUpdatedProposalOrThrow(
    collection: Collection<MultisigProposal>,
    proposalId: string
): Promise<MultisigProposal> {
    return getProposalOrThrow(collection, proposalId);
}

export function serializeProposal(proposal: MultisigProposal) {
    return {
        ...proposal,
        _id: proposal._id?.toString(),
    };
}
