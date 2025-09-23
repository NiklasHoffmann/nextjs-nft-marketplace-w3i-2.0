/**
 * NFT Context Test Page
 * 
 * Einfache Testseite um zu prüfen, ob der neue NFTContext funktioniert
 */

import { SimpleNFTList } from '@/components/02-nft/99-test-SimpleNFTList';

export default function NFTContextTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleNFTList />
    </div>
  );
}