// Quick test script to check if subgraph is working
const fetch = require('node-fetch');

const query = {
  query: `
    {
      items(first: 5) {
        listingId
        nftAddress
        tokenId
        isListed
        price
        seller
      }
    }
  `
};

async function testSubgraph() {
  try {
    console.log('🔍 Testing subgraph at: https://api.studio.thegraph.com/query/46078/nft-marketplace/v0.1.2');

    const response = await fetch('https://api.studio.thegraph.com/query/46078/nft-marketplace/v0.1.2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query)
    });

    const result = await response.json();

    console.log('✅ Response status:', response.status);
    console.log('📊 Response data:', JSON.stringify(result, null, 2));

    if (result.data?.items) {
      console.log(`📈 Found ${result.data.items.length} items`);
      if (result.data.items.length > 0) {
        console.log('📋 First item:', result.data.items[0]);
      }
    } else {
      console.log('⚠️ No items found in response');
    }

    if (result.errors) {
      console.log('❌ GraphQL errors:', result.errors);
    }

  } catch (error) {
    console.error('💥 Network error:', error);
  }
}

testSubgraph();