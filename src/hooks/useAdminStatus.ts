"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getAdminAddressesList } from '@/utils';

/**
 * Hook to check if the current user is an admin
 * Shared logic between CollectionsList and ListedNFTsList
 */
export function useAdminStatus() {
    const [isAdmin, setIsAdmin] = useState(false);
    const { address } = useAccount();

    useEffect(() => {
        if (address) {
            const adminAddresses = getAdminAddressesList();
            const lowerAddress = address.toLowerCase();
            setIsAdmin(adminAddresses.includes(lowerAddress));
        } else {
            setIsAdmin(false);
        }
    }, [address]);

    return { isAdmin, address };
}

export default useAdminStatus;
