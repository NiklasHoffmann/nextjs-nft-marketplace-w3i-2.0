'use client';

import { useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { registerUserSessionSigner, clearUserSessionSigner, ensureUserSession } from '@/lib/auth/user-session-client';

/**
 * Establishes the signature-backed user session for the connected wallet
 * and exposes the signer to non-React services (cart, stats, wallet NFTs).
 *
 * Only prompts when no valid session cookie exists; a declined signature is
 * not re-requested for the same address.
 */
export function UserSessionProvider({ children }: { children: React.ReactNode }) {
    const { address, isConnected, connector } = useAccount();
    const { signMessageAsync } = useSignMessage();

    useEffect(() => {
        if (!isConnected || !address || !connector) {
            clearUserSessionSigner();
            return;
        }

        registerUserSessionSigner({
            address,
            signMessage: (message: string) =>
                signMessageAsync({ message, account: address as `0x${string}` }),
        });

        // Give the connector a tick to finish initializing before requesting a signature.
        const timer = setTimeout(() => { void ensureUserSession(); }, 250);

        return () => clearTimeout(timer);
    }, [address, isConnected, connector, signMessageAsync]);

    return <>{children}</>;
}

export default UserSessionProvider;
