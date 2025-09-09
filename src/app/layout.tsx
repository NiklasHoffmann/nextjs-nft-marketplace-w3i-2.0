// app/layout.tsx
import type { Metadata } from "next";
import React from "react";
import { Poppins, Roboto, Inter } from "next/font/google";
import ClientLayout from "@/ui/ClientLayout";
import "@/app/globals.css";
import "./globals"; // Import BigInt serialization setup


const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
  variable: "--font-poppins",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
  variable: "--font-roboto",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "W3I Marketplace v2.0",
  description: "A decentralized marketplace for Utility NFTs services.",
  robots: { index: false, follow: false },
  metadataBase: new URL("https://ideationmarket.com"),
  icons: [{ rel: "icon", url: "/media/only-lightbulb-favicone.ico" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} ${roboto.variable} ${inter.variable}`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
