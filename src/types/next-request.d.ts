import 'next/server';

declare module 'next/server' {
  interface NextRequest {
    userAddress?: string;
    isAdmin?: boolean;
    validatedData?: unknown;
    validatedQuery?: unknown;
  }
}
