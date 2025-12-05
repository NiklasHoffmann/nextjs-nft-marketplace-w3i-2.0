// app/cart/page.tsx
import { Metadata } from 'next';
import { CartPage } from './CartPage';

export const metadata: Metadata = {
    title: 'Shopping Cart | W3I Marketplace',
    description: 'Review and purchase multiple NFTs in a single transaction.',
};

export default function Cart() {
    return <CartPage />;
}
