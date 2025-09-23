/**
 * Test Marketplace Page
 * 
 * Zeigt eine funktionierende Marketplace-Liste mit dem neuen NFTContext
 */

import { SimpleMarketplaceList } from '@/components/03-marketplace/99-test-SimpleMarketplaceList';

export default function TestMarketplacePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleMarketplaceList />
    </div>
  );
}