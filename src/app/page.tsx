// app/page.tsx
'use client'
import React from "react";
import { ActiveItemsList, CollectionsTable } from "@/components";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 flex flex-col py-8">
        {/* ActiveItemsList - Edge-to-edge ohne Container */}
        <div className="w-full">
          <ActiveItemsList />
        </div>

        {/* CollectionsTable - Mit normalem Container */}
        <div className="w-full max-w-[98vw] px-4 mx-auto mt-8">
          <CollectionsTable />
        </div>
      </main>
      <footer className="w-full py-4 text-center text-gray-400 border-t mt-auto">
        {/* Footer-Inhalt */}
      </footer>
    </div>
  );
}
