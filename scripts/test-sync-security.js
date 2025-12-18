/**
 * Security Test Script for API Routes
 * 
 * Tests authentication and authorization for protected endpoints
 */

const baseURL = 'http://localhost:3000/api';

async function testEndpoint(url, method = 'GET', body = null, headers = {}) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json();

        return {
            status: response.status,
            success: response.ok,
            data
        };
    } catch (error) {
        return {
            status: 0,
            success: false,
            error: error.message
        };
    }
}

console.log('🔒 Testing API Security...\n');

// Test 1: User NFT Sync (requires auth)
console.log('1️⃣ POST /api/user/nfts/sync (without auth)');
const test1 = await testEndpoint(`${baseURL}/user/nfts/sync`, 'POST', {});
console.log(`   Status: ${test1.status} - ${test1.status === 401 ? '✅ PASS (Unauthorized)' : '❌ FAIL'}`);
console.log(`   Response:`, test1.data);
console.log('');

// Test 2: Marketplace Sync Status (requires admin)
console.log('2️⃣ GET /api/marketplace/sync (without admin)');
const test2 = await testEndpoint(`${baseURL}/marketplace/sync`, 'GET');
console.log(`   Status: ${test2.status} - ${test2.status === 401 || test2.status === 403 ? '✅ PASS (Unauthorized/Forbidden)' : '❌ FAIL'}`);
console.log(`   Response:`, test2.data);
console.log('');

// Test 3: Marketplace Sync Control (requires admin)
console.log('3️⃣ POST /api/marketplace/sync (without admin)');
const test3 = await testEndpoint(`${baseURL}/marketplace/sync`, 'POST', { action: 'start' });
console.log(`   Status: ${test3.status} - ${test3.status === 401 || test3.status === 403 ? '✅ PASS (Unauthorized/Forbidden)' : '❌ FAIL'}`);
console.log(`   Response:`, test3.data);
console.log('');

// Summary
console.log('\n📊 Security Test Summary:');
const passed = [test1, test2, test3].filter(t => t.status === 401 || t.status === 403).length;
console.log(`   Passed: ${passed}/3`);
console.log(`   Failed: ${3 - passed}/3`);

if (passed === 3) {
    console.log('\n✅ All security tests passed! Sync routes are properly secured.');
} else {
    console.log('\n❌ Some security tests failed. Check route protection.');
}
