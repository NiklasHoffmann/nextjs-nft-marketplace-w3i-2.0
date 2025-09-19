// app/sell/page.tsx
import { Metadata } from 'next';
import { SellTradePage } from './SellTradePage';

export const metadata: Metadata = {
    title: 'Sell & Trade NFTs | W3I Marketplace',
    description: 'Sell your NFTs for ETH or trade them with other collectors.',
};

export default function SellPage() {
    return <SellTradePage />;
}