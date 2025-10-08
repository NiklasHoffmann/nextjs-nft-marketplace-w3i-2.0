const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/app/api/nft/admin/insights/route.ts',
    'src/app/api/nft/cache/route.ts',
    'src/app/api/nft/insights/collections/route.ts',
    'src/app/api/nft/insights/route.ts',
    'src/app/api/wallet/nfts/route.ts'
];

filesToFix.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');

        // Remove lines with only whitespace and );
        content = content.replace(/^\s+\);\s*$/gm, '');

        // Remove lines with orphaned expressions like === ''
        content = content.replace(/^\s+===\s+.*$/gm, '');

        // Remove orphaned for wallet:
        content = content.replace(/^\s+for\s+wallet:.*$/gm, '');

        // Remove orphaned template literal parts
        content = content.replace(/^\s+['`].*?HIT.*?MISS.*?`\);?\s*$/gm, '');

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed ${filePath}`);
    } else {
        console.log(`⚠️  File not found: ${filePath}`);
    }
});

console.log('Done!');
