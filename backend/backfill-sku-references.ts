import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Backfill SKU mappings from existing raw materials and finished products
 * This creates a SkuMapping entry for each unique product/material name
 */
async function backfillSkuReferences() {
    console.log('🔄 Starting SKU Reference backfill...\n');

    try {
        // Get all clients
        const clients = await prisma.client.findMany({
            where: { slug: { not: 'system' } }, // Skip system client
        });

        for (const client of clients) {
            console.log(`\n📦 Processing client: ${client.name} (${client.id})`);

            // Get all raw materials for this client
            const rawMaterials = await prisma.rawMaterial.findMany({
                where: { clientId: client.id },
                include: { category: true, storageLocation: true },
            });

            // Get all finished products for this client
            const finishedProducts = await prisma.finishedProduct.findMany({
                where: { clientId: client.id },
                include: { category: true, storageLocation: true },
            });

            console.log(`   Found ${rawMaterials.length} raw materials`);
            console.log(`   Found ${finishedProducts.length} finished products`);

            // Track unique items by name (case-insensitive)
            const uniqueItems = new Map<string, {
                name: string;
                sku: string;
                description?: string;
                categoryId?: string;
                storageLocationId?: string;
                unitPrice?: number;
                unit?: string;
                reorderLevel?: number;
            }>();

            // Process raw materials
            for (const material of rawMaterials) {
                const normalizedName = material.name.toLowerCase();

                if (!uniqueItems.has(normalizedName)) {
                    uniqueItems.set(normalizedName, {
                        name: material.name,
                        sku: material.sku || generateSku(material.name),
                        description: material.description || undefined,
                        categoryId: material.categoryId || undefined,
                        storageLocationId: material.storageLocationId || undefined,
                        unitPrice: material.unitPrice || undefined,
                        unit: material.unit || undefined,
                        reorderLevel: material.reorderLevel || undefined,
                    });
                }
            }

            // Process finished products
            for (const product of finishedProducts) {
                const normalizedName = product.name.toLowerCase();

                if (!uniqueItems.has(normalizedName)) {
                    uniqueItems.set(normalizedName, {
                        name: product.name,
                        sku: product.sku || generateSku(product.name),
                        description: product.description || undefined,
                        categoryId: product.categoryId || undefined,
                        storageLocationId: product.storageLocationId || undefined,
                        unitPrice: product.salePrice || undefined,
                        unit: product.unit || undefined,
                        reorderLevel: undefined,
                    });
                }
            }

            console.log(`   Found ${uniqueItems.size} unique items to create SKU mappings for`);

            // Create SKU mappings
            let createdCount = 0;
            let skippedCount = 0;

            for (const [_, item] of uniqueItems) {
                // Check if SKU mapping already exists
                const existing = await prisma.skuMapping.findFirst({
                    where: {
                        clientId: client.id,
                        OR: [
                            { name: item.name },
                            { sku: item.sku },
                        ],
                    },
                });

                if (existing) {
                    console.log(`   ⏭️  Skipped: ${item.name} (already exists)`);
                    skippedCount++;
                    continue;
                }

                // Create SKU mapping
                await prisma.skuMapping.create({
                    data: {
                        name: item.name,
                        sku: item.sku,
                        description: item.description,
                        categoryId: item.categoryId,
                        storageLocationId: item.storageLocationId,
                        unitPrice: item.unitPrice,
                        unit: item.unit,
                        reorderLevel: item.reorderLevel,
                        clientId: client.id,
                    },
                });

                console.log(`   ✅ Created: ${item.sku} - ${item.name}`);
                createdCount++;
            }

            console.log(`\n   Summary for ${client.name}:`);
            console.log(`   • Created: ${createdCount}`);
            console.log(`   • Skipped: ${skippedCount}`);
        }

        console.log('\n✅ Backfill completed successfully!');
    } catch (error) {
        console.error('❌ Error during backfill:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

/**
 * Generate a simple SKU from a name
 */
function generateSku(name: string): string {
    return name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
}

// Run the script
backfillSkuReferences()
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
