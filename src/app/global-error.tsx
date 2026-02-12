'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="m-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-900">
          <h2 className="mb-2 text-base font-semibold">Something went wrong</h2>
          <p className="mb-3 text-sm opacity-90">Please try again.</p>
          <button
            onClick={reset}
            className="rounded-md border border-red-400 px-3 py-1 text-sm hover:bg-white/50"
          >
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
