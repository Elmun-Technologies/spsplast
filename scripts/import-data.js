const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importData() {
    console.log('=== STARTING DATA IMPORT ===');

    const exportPath = path.join(process.cwd(), 'backups', 'exported-data.json');
    if (!fs.existsSync(exportPath)) {
        throw new Error(`Exported data file not found at ${exportPath}. Run npm run db:export first.`);
    }

    const data = JSON.parse(fs.readFileSync(exportPath, 'utf8'));

    const tables = [
        { name: 'adminUsers', model: prisma.adminUser },
        { name: 'settings', model: prisma.setting },
        { name: 'categories', model: prisma.category },
        { name: 'categoryTranslations', model: prisma.categoryTranslation },
        { name: 'attributeDefinitions', model: prisma.attributeDefinition },
        { name: 'attributeTranslations', model: prisma.attributeTranslation },
        { name: 'attributeOptions', model: prisma.attributeOption },
        { name: 'attributeOptionTranslations', model: prisma.attributeOptionTranslation },
        { name: 'categoryAttributes', model: prisma.categoryAttribute },
        { name: 'products', model: prisma.product },
        { name: 'productTranslations', model: prisma.productTranslation },
        { name: 'productCategories', model: prisma.productCategory },
        { name: 'productAttributeValues', model: prisma.productAttributeValue },
        { name: 'productVariants', model: prisma.productVariant },
        { name: 'productVariantOptions', model: prisma.productVariantOption },
        { name: 'productMedia', model: prisma.productMedia },
        { name: 'orders', model: prisma.order },
        { name: 'orderStatusHistories', model: prisma.orderStatusHistory },
        { name: 'orderItems', model: prisma.orderItem },
        { name: 'leads', model: prisma.lead },
        { name: 'blogPosts', model: prisma.blogPost },
        { name: 'blogPostTranslations', model: prisma.blogPostTranslation },
        { name: 'projects', model: prisma.project },
        { name: 'banners', model: prisma.banner },
        { name: 'paymentTransactions', model: prisma.paymentTransaction },
        { name: 'integrationJobs', model: prisma.integrationJob },
        { name: 'integrationLogs', model: prisma.integrationLog },
        { name: 'auditLogs', model: prisma.auditLog },
        { name: 'amoCrmTokens', model: prisma.amoCrmToken },
    ];

    const results = {};

    for (const table of tables) {
        const records = data[table.name] || [];
        let imported = 0;

        for (const item of records) {
            // Convert ISO strings back to Date objects where needed
            const processedItem = { ...item };
            for (const [k, v] of Object.entries(processedItem)) {
                if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
                    processedItem[k] = new Date(v);
                }
            }

            try {
                // Use create with catch for idempotency
                await table.model.create({ data: processedItem });
                imported++;
            } catch (err) {
                // Skip duplicate primary key / unique constraint errors gracefully
                if (err.code === 'P2002') {
                    imported++;
                } else {
                    console.warn(`Warning importing item into ${table.name}:`, err.message);
                }
            }
        }

        const targetCount = await table.model.count();
        results[table.name] = { exported: records.length, targetCount };
    }

    console.log('\n=== MIGRATION VERIFICATION SUMMARY ===');
    console.table(results);
}

importData()
    .catch((err) => {
        console.error('Import failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
