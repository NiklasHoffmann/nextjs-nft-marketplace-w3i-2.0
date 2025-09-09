// app/page.tsx
'use client'
import React from "react";
import ActiveItemsList from "@/components/ActiveItemsList";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 flex flex-col items-center  py-8">
        <div className="w-full max-w-[98vw] px-4 mt-8">
          <ActiveItemsList />
        </div>
      </main>
      <footer className="w-full py-4 text-center text-gray-400 border-t mt-auto">
        {/* Footer-Inhalt */}
      </footer>
    </div>
  );
}
