const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('========================================');
console.log('SPS PLAST — PRODUCTION READINESS VERIFICATION');
console.log('========================================\n');

let passed = true;

function runStep(name, command) {
    process.stdout.write(`[CHECK] ${name}... `);
    try {
        execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
        console.log('✔ PASSED');
    } catch (err) {
        console.log('❌ FAILED');
        if (err.stdout) console.log(err.stdout);
        if (err.stderr) console.log(err.stderr);
        passed = false;
    }
}

// 1. Prisma Format
runStep('Prisma Format', 'npx prisma format');

// 2. Prisma Validate
runStep('Prisma Validate', 'npx prisma validate');

// 3. TypeScript Typecheck
runStep('TypeScript Typecheck', 'npm run typecheck');

// 4. ESLint
runStep('ESLint', 'npm run lint');

// 5. Unit & Phase Tests
runStep('Jest Tests', 'npm test');

// 6. Check Documentation Files
process.stdout.write('[CHECK] Production Documentation Files... ');
const requiredDocs = [
    'docs/DEPLOYMENT.md',
    'docs/POSTGRES-MIGRATION.md',
    'docs/LAUNCH-CHECKLIST.md',
];
let docsOk = true;
for (const doc of requiredDocs) {
    if (!fs.existsSync(path.join(__dirname, '..', doc))) {
        docsOk = false;
        console.log(`\n  Missing required doc: ${doc}`);
    }
}
if (docsOk) {
    console.log('✔ PASSED');
} else {
    console.log('❌ FAILED');
    passed = false;
}

// 7. Check Data Migration Scripts
process.stdout.write('[CHECK] Database Migration Scripts... ');
const requiredScripts = [
    'scripts/backup-sqlite.js',
    'scripts/export-data.js',
    'scripts/import-data.js',
];
let scriptsOk = true;
for (const s of requiredScripts) {
    if (!fs.existsSync(path.join(__dirname, '..', s))) {
        scriptsOk = false;
        console.log(`\n  Missing required script: ${s}`);
    }
}
if (scriptsOk) {
    console.log('✔ PASSED');
} else {
    console.log('❌ FAILED');
    passed = false;
}

console.log('\n========================================');
if (passed) {
    console.log('SUCCESS: All production static checks passed cleanly!');
    console.log('========================================\n');
    process.exit(0);
} else {
    console.log('FAILURE: Production readiness checks failed. See output above.');
    console.log('========================================\n');
    process.exit(1);
}
