#!/usr/bin/env node

// Simple test of production completion without inventory service
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simplified completion service for testing
class SimpleProductionCompletionService {

    async completeProductionRun(productionRunId, actualQuantity) {
        try {
            console.log(`🏁 Completing production run: ${productionRunId}`);

            // Get production run details
            const productionRun = await prisma.productionRun.findUnique({
                where: { id: productionRunId },
                include: {
                    recipe: true,
                    steps: true
                }
            });

            if (!productionRun) {
                throw new Error('Production run not found');
            }

            if (productionRun.status === 'COMPLETED') {
                console.log('Production run already completed');
                return productionRun;
            }

            // Use actual quantity if provided, otherwise use target quantity
            const finalQuantity = actualQuantity || productionRun.targetQuantity;

            // Create finished product in inventory
            const finishedProduct = await this.createFinishedProduct(productionRun, finalQuantity);

            // Update production run status
            const completedRun = await prisma.productionRun.update({
                where: { id: productionRunId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                    finalQuantity
                },
                include: {
                    recipe: true,
                    steps: true
                }
            });

            console.log(`✅ Production completed: ${finishedProduct.quantity} ${finishedProduct.unit} of ${finishedProduct.name}`);

            return {
                productionRun: completedRun,
                finishedProduct
            };

        } catch (error) {
            console.error('❌ Error completing production run:', error);
            throw error;
        }
    }

    async createFinishedProduct(productionRun, quantity) {
        try {
            // Generate batch number
            const batchNumber = `BATCH-${Date.now()}`;
            const productionDate = new Date();

            // Calculate expiration date (default 7 days for bakery products)
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 7);

            // Get default storage location
            const defaultLocation = await this.getOrCreateDefaultStorageLocation();

            // Create SKU based on recipe name and batch
            const sku = `${productionRun.recipe.name.replace(/\s+/g, '-').toUpperCase()}-${batchNumber}`;

            // Create finished product
            const finishedProduct = await prisma.finishedProduct.create({
                data: {
                    name: `${productionRun.recipe.name} (${batchNumber})`,
                    description: `Produced from recipe: ${productionRun.recipe.name}`,
                    sku,
                    batchNumber,
                    productionDate,
                    expirationDate,
                    shelfLife: 7, // days
                    quantity,
                    unit: productionRun.targetUnit,
                    salePrice: 10.0, // Default price
                    costToProduce: 5.0, // Default cost
                    storageLocationId: defaultLocation.id,
                    status: 'COMPLETED',
                    packagingInfo: `Produced via ${productionRun.name}`,
                    isContaminated: false,
                    reservedQuantity: 0
                }
            });

            console.log(`📦 Created finished product: ${finishedProduct.name}`);
            return finishedProduct;

        } catch (error) {
            console.error('❌ Error creating finished product:', error);
            throw error;
        }
    }

    async getOrCreateDefaultStorageLocation() {
        let location = await prisma.storageLocation.findFirst({
            where: {
                OR: [
                    { name: { contains: 'warehouse' } },
                    { name: { contains: 'storage' } },
                    { type: 'WAREHOUSE' }
                ]
            }
        });

        if (!location) {
            location = await prisma.storageLocation.create({
                data: {
                    name: 'Default Warehouse',
                    type: 'WAREHOUSE',
                    description: 'Default storage location for finished products',
                    capacity: '1000 units'
                }
            });
        }

        return location;
    }
}

async function testSimpleProductionCompletion() {
    try {
        console.log('🧪 Testing Simple Production Completion\n');

        // Get a recipe with ingredients
        const recipe = await prisma.recipe.findFirst({
            where: {
                ingredients: {
                    some: {}
                }
            },
            include: {
                ingredients: {
                    include: {
                        rawMaterial: true,
                        intermediateProduct: true
                    }
                }
            }
        });

        if (!recipe) {
            console.log('❌ No recipe with ingredients found');
            return;
        }

        console.log(`📋 Using recipe: ${recipe.name}`);

        // Create production run
        const productionRun = await prisma.productionRun.create({
            data: {
                name: `Simple Test Production of ${recipe.name}`,
                recipeId: recipe.id,
                targetQuantity: 2,
                targetUnit: recipe.yieldUnit || 'units',
                status: 'PLANNED',
                notes: 'Testing simple completion workflow',
                steps: {
                    create: [
                        {
                            name: 'Production',
                            description: 'Execute recipe steps',
                            stepOrder: 1,
                            estimatedMinutes: 30,
                            status: 'COMPLETED',
                            startedAt: new Date(Date.now() - 60000),
                            completedAt: new Date(),
                            actualMinutes: 30
                        }
                    ]
                }
            },
            include: {
                recipe: true,
                steps: true
            }
        });

        console.log(`✅ Created production run: ${productionRun.name}`);

        // Test completion service
        const completionService = new SimpleProductionCompletionService();
        const result = await completionService.completeProductionRun(productionRun.id, 2);

        console.log(`\n🎉 SUCCESS!`);
        console.log(`✅ Finished Product Created: ${result.finishedProduct.name}`);
        console.log(`📦 Quantity: ${result.finishedProduct.quantity} ${result.finishedProduct.unit}`);
        console.log(`🏷️ SKU: ${result.finishedProduct.sku}`);
        console.log(`🏪 Storage: ${result.finishedProduct.storageLocationId}`);

        // Check inventory
        const inventoryCheck = await prisma.finishedProduct.findMany({
            where: { name: { contains: recipe.name } },
            include: { storageLocation: true }
        });

        console.log(`\n📋 Inventory Check:`);
        console.log(`Found ${inventoryCheck.length} finished products in inventory`);
        inventoryCheck.forEach(product => {
            console.log(`   - ${product.name}: ${product.quantity} ${product.unit} @ ${product.storageLocation?.name}`);
        });

        // Clean up
        await prisma.finishedProduct.delete({ where: { id: result.finishedProduct.id } });
        await prisma.productionStep.deleteMany({ where: { productionRunId: productionRun.id } });
        await prisma.productionRun.delete({ where: { id: productionRun.id } });
        console.log(`\n✅ Test completed and cleaned up`);

    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testSimpleProductionCompletion();
