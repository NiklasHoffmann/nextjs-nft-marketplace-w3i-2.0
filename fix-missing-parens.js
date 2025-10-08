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

        // Fix missing ); after NextResponse.json blocks
        // Pattern: { status: NNN }\n    }
        content = content.replace(/(\{\s*status:\s*\d+\s*\})\s*\n\s+\}/gm, '$1\n      );\n    }');

        // Remove orphaned HIT/MISS template strings
        content = content.replace(/\s+['`]\s*:\s*'HIT\s*\(stale\)'.*?`\);?\s*\n/gm, '\n');

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed ${filePath}`);
    } else {
        console.log(`⚠️  File not found: ${filePath}`);
    }
});

console.log('Done!');
