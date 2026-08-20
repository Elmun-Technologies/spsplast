const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
    console.log('=== STARTING DATA EXPORT ===');

    const data = {
        adminUsers: await prisma.adminUser.findMany(),
        settings: await prisma.setting.findMany(),
        categories: await prisma.category.findMany(),
        categoryTranslations: await prisma.categoryTranslation.findMany(),
        attributeDefinitions: await prisma.attributeDefinition.findMany(),
        attributeTranslations: await prisma.attributeTranslation.findMany(),
        attributeOptions: await prisma.attributeOption.findMany(),
        attributeOptionTranslations: await prisma.attributeOptionTranslation.findMany(),
        categoryAttributes: await prisma.categoryAttribute.findMany(),
        products: await prisma.product.findMany(),
        productTranslations: await prisma.productTranslation.findMany(),
        productCategories: await prisma.productCategory.findMany(),
        productAttributeValues: await prisma.productAttributeValue.findMany(),
        productVariants: await prisma.productVariant.findMany(),
        productVariantOptions: await prisma.productVariantOption.findMany(),
        productMedia: await prisma.productMedia.findMany(),
        orders: await prisma.order.findMany(),
        orderStatusHistories: await prisma.orderStatusHistory.findMany(),
        orderItems: await prisma.orderItem.findMany(),
        leads: await prisma.lead.findMany(),
        blogPosts: await prisma.blogPost.findMany(),
        blogPostTranslations: await prisma.blogPostTranslation.findMany(),
        projects: await prisma.project.findMany(),
        banners: await prisma.banner.findMany(),
        paymentTransactions: await prisma.paymentTransaction.findMany(),
        integrationJobs: await prisma.integrationJob.findMany(),
        integrationLogs: await prisma.integrationLog.findMany(),
        auditLogs: await prisma.auditLog.findMany(),
        amoCrmTokens: await prisma.amoCrmToken.findMany(),
        exportedAt: new Date().toISOString()
    };

    const exportDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }

    const exportPath = path.join(exportDir, 'exported-data.json');
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`\nData exported successfully to: ${exportPath}`);
    console.log('Summary of exported counts:');
    for (const [key, val] of Object.entries(data)) {
        if (Array.isArray(val)) {
            console.log(` - ${key}: ${val.length}`);
        }
    }
}

exportData()
    .catch((err) => {
        console.error('Export failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
