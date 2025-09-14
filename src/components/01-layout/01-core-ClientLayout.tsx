"use client";

import React, { type ErrorInfo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ApolloProvider } from "@apollo/client/react";
import apolloClient from "../../config/apolloClient";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { Navbar } from "@/components";
import Web3Provider from "./03-core-Web3Provider";

// --- Simple global fallback UI for render errors ---
function GlobalErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  // TODO: hier an Sentry/Log-Backend senden
  if (process.env.NODE_ENV !== "production") {
    console.error("[GlobalErrorFallback]", error);
  }
  return (
    <div className="p-4 m-4 rounded-xl border border-red-300 bg-red-50 text-red-900">
      <h2 className="font-semibold mb-2">Uups, da ist etwas schiefgelaufen.</h2>
      <p className="text-sm opacity-90 mb-3">
        {error.message || "Unbekannter Fehler. Versuche es bitte erneut."}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="px-3 py-1 rounded-md border border-red-400 hover:bg-white/50"
      >
        Neu laden
      </button>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={GlobalErrorFallback}
      onError={(error: Error, info: ErrorInfo) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("[React ErrorBoundary]", { error, info });
        }
        // TODO: Sentry.captureException(error)
      }}
    >
      <Web3Provider>
        <ApolloProvider client={apolloClient}>
          <CurrencyProvider>
            <div>
              <Navbar />
              <main>{children}</main>
            </div>
          </CurrencyProvider>
        </ApolloProvider>
      </Web3Provider>
    </ErrorBoundary>
  );
}