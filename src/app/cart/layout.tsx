'use client';

import { ReactNode } from 'react';
import { CartHeader } from '@/components/cart';
import { useCart } from '@/contexts';

export default function CartLayout({ children }: { children: ReactNode }) {
    const { itemCount, totalPriceFormatted } = useCart();

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="pt-[66px]">
                <CartHeader itemCount={itemCount} totalValue={totalPriceFormatted} />
                <div className="pt-[120px]">
                    {children}
                </div>
            </main>
        </div>
    );
}
