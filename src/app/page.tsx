// app/page.tsx
'use client'
import React, { useState } from "react";
import { ActiveItemsList, CollectionsTable, NFTFilterSidebar } from "@/components";
import type { NFTFilters, NFTSortOptions } from "@/components/marketplace/NFTFilterBar";

export default function Home() {
  const [filters, setFilters] = useState<NFTFilters>({
    categories: [],
    rarities: [],
  });
  const [sort, setSort] = useState<NFTSortOptions>({
    field: 'price',
    direction: 'desc'
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* NFTFilterSidebar - Einmalig für beide Listen */}
      <NFTFilterSidebar
        onFiltersChange={setFilters}
        onSortChange={setSort}
        currentSort={sort}
        totalItems={0}
        filteredCount={0}
      />

      <main className="flex-1 flex flex-col pt-[66px] py-8">
        {/* ActiveItemsList - Edge-to-edge ohne Container */}
        <div className="w-full pt-4">  {/* Nur 4 padding-top für etwas Abstand zum Header */}
          <ActiveItemsList
            externalFilters={filters}
            externalSort={sort}
          />
        </div>

        {/* Trennlinie zwischen Listen */}
        <div className="w-full">
          <hr className="border-t border-gray-300" />
        </div>

        {/* CollectionsTable - Mit normalem Container + Sidebar Padding auf Desktop */}
        <div className="w-full pt-4">
          <CollectionsTable
            currentSort={sort}
            onSortChange={setSort}
            filters={filters}
          />
        </div>
      </main>
      <footer className="w-full py-4 text-center text-gray-400 border-t mt-auto">
        {/* Footer-Inhalt */}
      </footer>
    </div>
  );
}
