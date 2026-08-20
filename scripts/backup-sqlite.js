const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function run() {
    const counts = {
        products: await prisma.product.count(),
        categories: await prisma.category.count(),
        orders: await prisma.order.count(),
        leads: await prisma.lead.count(),
        admins: await prisma.adminUser.count(),
        productMedia: await prisma.productMedia.count(),
    };

    console.log('=== DATABASE REALITY COUNTS ===');
    console.log(JSON.stringify(counts, null, 2));

    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const backupPath = path.join(backupDir, `dev-before-postgres-${timestamp}.db`);
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

    if (fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, backupPath);
        console.log(`\nSQLite database backup created at: ${backupPath}`);
        console.log(`Size: ${fs.statSync(backupPath).size} bytes`);
    } else {
        console.log(`\nNo SQLite database file found at ${dbPath}`);
    }
}

run()
    .catch((err) => {
        console.error('Backup error:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
