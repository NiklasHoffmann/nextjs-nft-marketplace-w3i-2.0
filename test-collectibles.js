// Quick test for Collectibles category
fetch('http://localhost:3001/api/marketplace/items?category=Collectibles&limit=5')
    .then(r => r.json())
    .then(data => {
        console.log('\n✅ Collectibles Filter Test:');
        console.log(`Found ${data.data.items.length} items\n`);
        data.data.items.forEach((item, i) => {
            console.log(`${i + 1}. ${item.metadata?.name || 'Unknown'} - Category: "${item.insights?.category}"`);
        });

        // Check if all items are Collectibles
        const allCollectibles = data.data.items.every(item =>
            item.insights?.category === 'Collectibles'
        );
        console.log(`\n${allCollectibles ? '✅' : '❌'} All items are Collectibles: ${allCollectibles}\n`);
    })
    .catch(console.error);
