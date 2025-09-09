// config/apolloClient.ts
// Apollo Client mit HTTP + optional WS, Retry, Error-Handling, Cache-Persistenz (nur Browser)

import {
    ApolloClient,
    InMemoryCache,
    ApolloLink,
    HttpLink,
    FetchPolicy,
    DefaultOptions,
} from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { RetryLink } from "@apollo/client/link/retry";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { persistCache, LocalStorageWrapper } from "apollo3-cache-persist";

// ---- Env defensiv lesen (Next 15: Turbopack) ----
const HTTP_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;
const WS_URL = process.env.NEXT_PUBLIC_SUBGRAPH_WS_URL;

// Hilfsfunktion: ist Browser?
const isBrowser = typeof window !== "undefined";

// ---- HTTP Link ----
const httpLink = new HttpLink({
    uri: HTTP_URL,
    // credentials: "include", // falls Cookies/Auth nötig
    // fetchOptions: { mode: "cors" },
});

// ---- Error-Link (Logging / ggf. Sentry) ----
const errorLink = new ErrorLink((errorResponse) => {
    // Type assertion for compatibility with Apollo Client v4
    const { graphQLErrors, networkError, operation } = errorResponse as {
        graphQLErrors?: Array<{ message: string; path?: unknown; extensions?: unknown }>;
        networkError?: Error;
        operation: { operationName?: string };
    };
    if (graphQLErrors?.length) {
        for (const err of graphQLErrors) {
            console.warn(
                `[GraphQL error] op=${operation.operationName ?? "unknown"} message=${err.message}`,
                { path: err.path, extensions: err.extensions }
            );
        }
    }
    if (networkError) {
        console.warn(`[Network error] op=${operation.operationName ?? "unknown"}:`, networkError);
    }
});

// ---- Retry-Link (exponentielles Backoff mit Jitter) ----
const retryLink = new RetryLink({
    delay: {
        initial: 400,
        max: 8000,
        jitter: true,
    },
    attempts: (count, operation, error) => {
        // Bei 4xx (außer 408/429) keine Retries — sonst retry bis ~5x
        const max = 5;
        if (!error) return count <= max;

        const errorResponse = error as { statusCode?: number; result?: { status?: number } };
        const status = errorResponse?.statusCode ?? errorResponse?.result?.status ?? null;
        if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) return false;
        return count <= max;
    },
});

// ---- Optionaler WS-Link (nur im Browser) ----
const wsLink =
    isBrowser && WS_URL
        ? new GraphQLWsLink(
            createClient({
                url: WS_URL,
                retryAttempts: Infinity,
                shouldRetry: () => true,
                lazy: true,
                keepAlive: 15000,
            })
        )
        : null;

// ---- HTTP/WS splitten ----
const link = wsLink
    ? ApolloLink.from([
        errorLink,
        retryLink,
        ApolloLink.split(
            ({ query }) => {
                const def = getMainDefinition(query);
                return def.kind === "OperationDefinition" && def.operation === "subscription";
            },
            wsLink,
            httpLink
        ),
    ])
    : ApolloLink.from([errorLink, retryLink, httpLink]);
// ---- Cache (mit Beispiel-TypePolicy) ----
const cache = new InMemoryCache({
    typePolicies: {
        Query: {
            fields: {
                items: {
                    keyArgs: false,
                    merge(_existing, incoming: unknown[]) {
                        // Wenn du Pagination machst, hier anpassen
                        return incoming;
                    },
                },
            },
        },
    },
});

// ---- Cache Persistenz nur im Browser ----
if (isBrowser) {
    // Fire-and-forget; Apollo kann parallel laufen, Persistenz hydriert asynchron
    persistCache({
        cache,
        storage: new LocalStorageWrapper(window.localStorage),
    }).catch((err: Error) => console.warn("Cache-Persistenz fehlgeschlagen:", err));
}

const defaultOptions: DefaultOptions = {
    watchQuery: {
        fetchPolicy: "cache-and-network" as FetchPolicy,
        nextFetchPolicy: "cache-first" as FetchPolicy,
        errorPolicy: "ignore",
    },
    query: {
        fetchPolicy: "cache-first" as FetchPolicy,
        errorPolicy: "all",
    },
    mutate: {
        errorPolicy: "all",
    },
};

// ---- Factory (nützlich für Tests/SSR-Instanzen) ----
export function makeApolloClient() {
    if (!HTTP_URL) {
        console.warn("NEXT_PUBLIC_SUBGRAPH_URL ist nicht gesetzt — Apollo arbeitet ohne Ziel-URL.");
    }
    return new ApolloClient({
        link,
        cache,
        defaultOptions,
        // ssrMode: !isBrowser, // optional aktivieren, falls du auf dem Server queries ausführst
        // connectToDevTools: isBrowser, // optional
    });
}

// ---- Singleton für Client Components (App Router) ----
const apolloClient = makeApolloClient();
export default apolloClient;
