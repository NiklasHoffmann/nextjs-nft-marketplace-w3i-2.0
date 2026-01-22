#!/usr/bin/env node
/**
 * API Routes Test Script
 * 
 * Tests all migrated API routes to ensure they work correctly
 * Run: node scripts/test-api-routes.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Test configuration
const tests = [
    {
        name: 'Admin Insights - Unauthorized Access',
        method: 'POST',
        url: '/api/nft/admin/insights',
        body: {
            contractAddress: '0x1234567890123456789012345678901234567890',
            title: 'Test NFT',
            description: 'Test Description'
        },
        expectedStatus: 403,
        expectedError: 'Forbidden'
    },
    {
        name: 'Marketplace Collections - Get All',
        method: 'GET',
        url: '/api/marketplace/collections',
        expectedStatus: 200,
        expectedData: {
            success: true,
            data: expect.any(Array)
        }
    },
    {
        name: 'Whitelist Check - Missing Parameters',
        method: 'POST',
        url: '/api/marketplace/whitelist-check',
        body: {},
        expectedStatus: 400,
        expectedError: 'Missing required parameters'
    },
    {
        name: 'NFT Insights - Get Collections',
        method: 'GET',
        url: '/api/nft/insights',
        expectedStatus: 200,
        expectedData: {
            success: true
        }
    }
];

// Test runner
async function runTests() {
    console.log('🧪 Starting API Routes Tests...\n');

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const url = `${BASE_URL}${test.url}`;
            const options = {
                method: test.method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (test.body) {
                options.body = JSON.stringify(test.body);
            }

            console.log(`Testing: ${test.name}`);
            console.log(`  ${test.method} ${test.url}`);

            const response = await fetch(url, options);
            const data = await response.json();

            // Check status code
            if (response.status !== test.expectedStatus) {
                console.log(`  ❌ FAILED: Expected status ${test.expectedStatus}, got ${response.status}`);
                failed++;
                continue;
            }

            // Check error message
            if (test.expectedError && !data.error?.includes(test.expectedError)) {
                console.log(`  ❌ FAILED: Expected error containing "${test.expectedError}"`);
                console.log(`     Got: ${data.error}`);
                failed++;
                continue;
            }

            // Check data structure
            if (test.expectedData) {
                if (test.expectedData.success !== undefined && data.success !== test.expectedData.success) {
                    console.log(`  ❌ FAILED: Expected success=${test.expectedData.success}, got ${data.success}`);
                    failed++;
                    continue;
                }
            }

            console.log(`  ✅ PASSED\n`);
            passed++;

        } catch (error) {
            console.log(`  ❌ ERROR: ${error.message}\n`);
            failed++;
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`Test Results: ${passed} passed, ${failed} failed`);
    console.log('='.repeat(50));

    if (failed > 0) {
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };
