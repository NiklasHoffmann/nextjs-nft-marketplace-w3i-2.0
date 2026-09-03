/**
 * API latency benchmark.
 *
 * Measures the DB-first path (/api/user/nfts) against the discovery path
 * (/api/wallet/nfts) so the performance claims in the docs are backed by
 * numbers instead of estimates.
 *
 * The first request of each scenario is reported separately as "cold" — for
 * the discovery path every warm sample is served from the shared cache and
 * says nothing about actual Alchemy latency.
 *
 * Usage:
 *   npm run dev                       # in another terminal
 *   npm run bench:api -- 0xYourWallet
 *
 * Env:
 *   BENCH_BASE_URL    default http://localhost:3000
 *   BENCH_ITERATIONS  default 20
 *   BENCH_WARMUP      default 3
 */

import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(process.cwd(), '.env.local') });

const BASE_URL = process.env.BENCH_BASE_URL || 'http://localhost:3000';
const ITERATIONS = Number.parseInt(process.env.BENCH_ITERATIONS || '20', 10);
const WARMUP = Number.parseInt(process.env.BENCH_WARMUP || '3', 10);

interface Scenario {
    name: string;
    path: string;
    authenticated: boolean;
    iterations?: number;
    warmup?: number;
    delayMs?: number;
}

interface Result {
    name: string;
    coldMs: number | null;
    samples: number[];
    errors: number;
    rateLimited: number;
    lastStatus: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[index];
}

function summarize(result: Result) {
    const sorted = [...result.samples].sort((a, b) => a - b);
    return {
        Scenario: result.name,
        cold: result.coldMs === null ? '-' : Math.round(result.coldMs),
        n: sorted.length,
        min: sorted.length ? Math.round(sorted[0]) : 0,
        p50: Math.round(percentile(sorted, 50)),
        p95: Math.round(percentile(sorted, 95)),
        max: sorted.length ? Math.round(sorted[sorted.length - 1]) : 0,
        errors: result.errors,
        rateLimited: result.rateLimited,
        status: result.lastStatus,
    };
}

async function timeRequest(url: string, cookie: string | null): Promise<{ ms: number; status: number }> {
    const start = performance.now();
    const response = await fetch(url, {
        cache: 'no-store',
        headers: cookie ? { cookie } : undefined,
    });
    await response.arrayBuffer();
    return { ms: performance.now() - start, status: response.status };
}

async function runScenario(scenario: Scenario, cookie: string | null): Promise<Result> {
    const url = `${BASE_URL}${scenario.path}`;
    const iterations = scenario.iterations ?? ITERATIONS;
    const warmup = scenario.warmup ?? WARMUP;
    const delayMs = scenario.delayMs ?? 0;
    const requestCookie = scenario.authenticated ? cookie : null;

    const result: Result = { name: scenario.name, coldMs: null, samples: [], errors: 0, rateLimited: 0, lastStatus: 0 };

    for (let i = 0; i < warmup + iterations; i++) {
        if (delayMs > 0 && i > 0) {
            await sleep(delayMs);
        }

        try {
            const { ms, status } = await timeRequest(url, requestCookie);
            result.lastStatus = status;

            if (status === 429) {
                result.rateLimited++;
                continue;
            }

            if (status >= 400) {
                result.errors++;
                continue;
            }

            if (result.coldMs === null) {
                result.coldMs = ms;
                continue;
            }

            if (i >= warmup) {
                result.samples.push(ms);
            }
        } catch {
            result.errors++;
        }
    }

    return result;
}

async function main() {
    const wallet = process.argv[2]?.toLowerCase();

    if (!wallet || !/^0x[a-f0-9]{40}$/.test(wallet)) {
        console.error('Usage: npm run bench:api -- 0xWalletAddress');
        process.exit(1);
    }

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is missing — cannot mint a session for authenticated endpoints.');
        process.exit(1);
    }

    // Mint a session locally instead of driving a wallet through the signature flow.
    const { createUserSessionToken } = await import('../../src/lib/auth/user-session');
    const token = createUserSessionToken({ jti: `bench-${Date.now()}`, address: wallet });
    const cookie = `user-session=${token}`;

    const scenarios: Scenario[] = [
        { name: 'GET /api/marketplace/items (public)', path: '/api/marketplace/items?pageSize=20', authenticated: false },
        { name: 'GET /api/collections (public)', path: '/api/collections', authenticated: false },
        { name: 'GET /api/user/nfts (DB-first)', path: `/api/user/nfts?walletAddress=${wallet}`, authenticated: true },
        {
            name: 'GET /api/wallet/nfts (discovery)',
            path: `/api/wallet/nfts?address=${wallet}&skipPersist=true`,
            authenticated: false,
            // Rate limited upstream, and warm hits come from the shared cache.
            iterations: 5,
            warmup: 0,
            delayMs: 1500,
        },
    ];

    console.log(`\nBenchmarking ${BASE_URL}`);
    console.log(`Wallet: ${wallet}`);
    console.log(`Default warmup: ${WARMUP}, default iterations: ${ITERATIONS}\n`);

    const results: Result[] = [];
    for (const scenario of scenarios) {
        process.stdout.write(`  running ${scenario.name} ... `);
        const result = await runScenario(scenario, cookie);
        results.push(result);
        console.log(`${result.samples.length} ok, ${result.errors} failed, ${result.rateLimited} rate limited`);
    }

    console.log('');
    console.table(results.map(summarize));

    const dbFirst = results.find(r => r.name.includes('DB-first'));
    const discovery = results.find(r => r.name.includes('discovery'));

    if (dbFirst?.coldMs && discovery?.coldMs) {
        console.log(
            `\nCold start, DB-first vs discovery: ${Math.round(dbFirst.coldMs)}ms vs ${Math.round(discovery.coldMs)}ms ` +
            `→ ${(discovery.coldMs / dbFirst.coldMs).toFixed(1)}x\n`
        );
    } else {
        console.log('\nSkipping comparison — one of the wallet endpoints produced no cold sample.\n');
    }

    console.log('Note: warm discovery samples are served from the shared cache and do not reflect Alchemy latency.\n');
}

main().catch((error) => {
    console.error('Benchmark failed:', error);
    process.exit(1);
});
