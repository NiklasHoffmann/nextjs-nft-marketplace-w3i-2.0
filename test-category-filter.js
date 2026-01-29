// Test script for category filtering
// Tests if the category filter works correctly with the MongoDB API

async function testCategoryFilter() {
    const baseUrl = 'http://localhost:3001/api/marketplace/items';

    console.log('\n🧪 Testing Category Filter\n');
    console.log('='.repeat(50));

    // Test 1: No filter (should return all items)
    console.log('\n📝 Test 1: No category filter');
    const response1 = await fetch(`${baseUrl}?limit=5`);
    const data1 = await response1.json();
    console.log(`✓ Returned ${data1.data.items.length} items`);
    console.log(`✓ Available categories:`, data1.data.filters.availableCategories);

    // Show categories of first few items
    if (data1.data.items.length > 0) {
        console.log('\n📋 Categories in first 3 items:');
        data1.data.items.slice(0, 3).forEach((item, i) => {
            console.log(`  ${i + 1}. ${item.metadata?.name || 'Unknown'} - Category: "${item.insights?.category || 'N/A'}"`);
        });
    }

    // Test 2: Filter by "Art"
    console.log('\n\n📝 Test 2: Filter by "Art"');
    const response2 = await fetch(`${baseUrl}?category=Art&limit=10`);
    const data2 = await response2.json();
    console.log(`✓ Returned ${data2.data.items.length} items`);

    if (data2.data.items.length > 0) {
        console.log('\n📋 First 3 Art items:');
        data2.data.items.slice(0, 3).forEach((item, i) => {
            console.log(`  ${i + 1}. ${item.metadata?.name || 'Unknown'} - Category: "${item.insights?.category || 'N/A'}"`);
        });

        // Verify all items have "Art" category
        const nonArtItems = data2.data.items.filter(item =>
            item.insights?.category?.toLowerCase() !== 'art'
        );
        if (nonArtItems.length > 0) {
            console.log(`\n⚠️ WARNING: Found ${nonArtItems.length} non-Art items!`);
            nonArtItems.forEach(item => {
                console.log(`  - ${item.metadata?.name}: "${item.insights?.category}"`);
            });
        } else {
            console.log('\n✅ All items have "Art" category');
        }
    } else {
        console.log('⚠️ No Art items found!');
    }

    // Test 3: Filter by multiple categories
    console.log('\n\n📝 Test 3: Filter by "Art,Gaming"');
    const response3 = await fetch(`${baseUrl}?category=Art,Gaming&limit=10`);
    const data3 = await response3.json();
    console.log(`✓ Returned ${data3.data.items.length} items`);

    if (data3.data.items.length > 0) {
        // Group by category
        const byCategory = {};
        data3.data.items.forEach(item => {
            const cat = item.insights?.category || 'N/A';
            byCategory[cat] = (byCategory[cat] || 0) + 1;
        });
        console.log('\n📊 Items by category:');
        Object.entries(byCategory).forEach(([cat, count]) => {
            console.log(`  - ${cat}: ${count} items`);
        });

        // Verify all items have Art or Gaming category
        const invalidItems = data3.data.items.filter(item => {
            const cat = item.insights?.category?.toLowerCase();
            return cat !== 'art' && cat !== 'gaming';
        });
        if (invalidItems.length > 0) {
            console.log(`\n⚠️ WARNING: Found ${invalidItems.length} items with wrong category!`);
            invalidItems.forEach(item => {
                console.log(`  - ${item.metadata?.name}: "${item.insights?.category}"`);
            });
        } else {
            console.log('\n✅ All items have "Art" or "Gaming" category');
        }
    } else {
        console.log('⚠️ No Art or Gaming items found!');
    }

    // Test 4: Filter by "Virtual Real Estate" (has space)
    console.log('\n\n📝 Test 4: Filter by "Virtual Real Estate" (with space)');
    const response4 = await fetch(`${baseUrl}?category=${encodeURIComponent('Virtual Real Estate')}&limit=10`);
    const data4 = await response4.json();
    console.log(`✓ Returned ${data4.data.items.length} items`);

    if (data4.data.items.length > 0) {
        console.log('\n📋 First 3 Virtual Real Estate items:');
        data4.data.items.slice(0, 3).forEach((item, i) => {
            console.log(`  ${i + 1}. ${item.metadata?.name || 'Unknown'} - Category: "${item.insights?.category || 'N/A'}"`);
        });
    } else {
        console.log('⚠️ No Virtual Real Estate items found (might be expected if category doesn\'t exist)');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Testing complete\n');
}

// Run test
testCategoryFilter().catch(console.error);
