'use client';

import { ReactNode } from 'react';
import { CartHeader } from './components';
import { useCart } from '@/contexts';

export default function CartLayout({ children }: { children: ReactNode }) {
    const { itemCount, totalPriceDisplay } = useCart();

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="pt-[66px]">
                <CartHeader itemCount={itemCount} totalValue={totalPriceDisplay} />
                <div className="pt-[100px]">
                    {children}
                </div>
            </main>
        </div>
    );
}
