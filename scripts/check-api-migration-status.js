/**
 * Check API Migration Status
 * 
 * Scans all API routes and reports migration progress
 */

const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');

function findRouteFiles(dir, files = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            findRouteFiles(fullPath, files);
        } else if (entry.name === 'route.ts') {
            files.push(fullPath);
        }
    }

    return files;
}

function analyzeRoute(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(apiDir, filePath).replace(/\\/g, '/').replace('/route.ts', '');

    // Check for apiHandler pattern
    const hasApiHandler = /export const \w+ = apiHandler/.test(content);

    // Check for legacy pattern
    const hasLegacyExport = /export async function (GET|POST|PUT|DELETE|PATCH)/.test(content);

    // Check for auth
    const hasAuth = /\{ auth: true \}|\{ admin: true \}|withAuth|withAdmin/.test(content);

    // Get HTTP methods
    const methods = [];
    const methodRegex = /export (?:async function|const) (GET|POST|PUT|DELETE|PATCH)/g;
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
        methods.push(match[1]);
    }

    return {
        path: relativePath,
        methods,
        migrated: hasApiHandler,
        legacy: hasLegacyExport,
        hasAuth,
        mixed: hasApiHandler && hasLegacyExport
    };
}

const routes = findRouteFiles(apiDir);
const analysis = routes.map(analyzeRoute);

// Categorize routes
const migrated = analysis.filter(r => r.migrated && !r.mixed);
const legacy = analysis.filter(r => r.legacy && !r.migrated);
const mixed = analysis.filter(r => r.mixed);
const withAuth = analysis.filter(r => r.hasAuth);

console.log('📊 API Migration Status\n');
console.log(`Total Routes: ${analysis.length}`);
console.log(`Migrated: ${migrated.length} (${Math.round(migrated.length / analysis.length * 100)}%)`);
console.log(`Legacy: ${legacy.length} (${Math.round(legacy.length / analysis.length * 100)}%)`);
console.log(`Mixed: ${mixed.length}`);
console.log(`With Auth: ${withAuth.length} (${Math.round(withAuth.length / analysis.length * 100)}%)\n`);

if (migrated.length > 0) {
    console.log('✅ MIGRATED ROUTES:');
    migrated.forEach(r => {
        const authBadge = r.hasAuth ? '🔒' : '🌐';
        console.log(`   ${authBadge} /${r.path} [${r.methods.join(', ')}]`);
    });
    console.log('');
}

if (legacy.length > 0) {
    console.log('❌ LEGACY ROUTES (need migration):');
    legacy.forEach(r => {
        console.log(`   /${r.path} [${r.methods.join(', ')}]`);
    });
    console.log('');
}

if (mixed.length > 0) {
    console.log('⚠️  MIXED ROUTES (partially migrated):');
    mixed.forEach(r => {
        console.log(`   /${r.path} [${r.methods.join(', ')}]`);
    });
    console.log('');
}

// Summary
if (legacy.length === 0 && mixed.length === 0) {
    console.log('🎉 ALL ROUTES MIGRATED!');
} else {
    console.log(`📝 ${legacy.length + mixed.length} routes still need migration`);
}
