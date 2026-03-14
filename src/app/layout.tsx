// app/layout.tsx
import type { Metadata } from "next";
import React from "react";
import { Inter } from "next/font/google";
import { ClientLayout } from "@/components";
import "@/app/globals.css";
import "@/lib/globals";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "W3I Marketplace v2.0",
  description: "A decentralized marketplace for Utility NFTs services.",
  robots: { index: false, follow: false },
  metadataBase: new URL("https://hoffmann-niklas.de"),
  icons: [{ rel: "icon", url: "/media/only-lightbulb-favicone.ico" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-primary font-inter`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
