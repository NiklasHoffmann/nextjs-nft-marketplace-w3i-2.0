const fs = require('fs');
const https = require('https');

const CONTRACT_ADDRESS = '0x1107Eb26D47A5bF88E9a9F97cbC7EA38c3E1D7EC';
const url = `https://api-sepolia.etherscan.io/api?module=contract&action=getabi&address=${CONTRACT_ADDRESS}`;

console.log('Fetching ABI from Etherscan...');
console.log('URL:', url);

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);

            if (response.status === '1' && response.result) {
                // Result is a JSON string, parse it
                const abi = JSON.parse(response.result);

                // Save to file
                fs.writeFileSync('etherscan-abi.json', JSON.stringify(abi, null, 2));
                console.log('✅ ABI saved to etherscan-abi.json');
                console.log(`📊 Total ABI entries: ${abi.length}`);

                // Count types
                const types = {};
                abi.forEach(item => {
                    types[item.type] = (types[item.type] || 0) + 1;
                });
                console.log('📋 ABI breakdown:', types);

            } else {
                console.error('❌ Error fetching ABI:', response.message || response.result);
            }
        } catch (err) {
            console.error('❌ Error parsing response:', err.message);
            console.error('Raw response:', data.substring(0, 500));
        }
    });
}).on('error', (err) => {
    console.error('❌ Request error:', err.message);
});
