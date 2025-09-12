import { SwapTargetInfoProps } from '@/types/nft-detail';

export default function SwapTargetInfo({ desiredNftAddress, desiredTokenId }: SwapTargetInfoProps) {
    if (desiredNftAddress === "0x0000000000000000000000000000000000000000") {
        return null;
    }

    return (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-4">Swap Target</h3>
            <div className="space-y-2">
                <div>
                    <label className="text-sm font-medium text-orange-700">Desired NFT Address</label>
                    <p className="text-sm font-mono text-orange-900 break-all">{desiredNftAddress}</p>
                </div>
                <div>
                    <label className="text-sm font-medium text-orange-700">Desired Token ID</label>
                    <p className="text-sm font-mono text-orange-900">#{desiredTokenId}</p>
                </div>
            </div>
        </div>
    );
}