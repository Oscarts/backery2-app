#!/usr/bin/env node
/**
 * Test Script: SKU Mapping Creation from Production Runs
 * 
 * This script tests that when production runs complete:
 * 1. Finished products are created
 * 2. SkuMapping records are created with FINISHED_PRODUCT itemType
 * 3. SkuMapping records appear in SKU References page data
 */

const { PrismaClient } = require('@prisma/client');
const { completeProductionRunDirect } = require('./src/services/productionCompletionService.ts');

const prisma = new PrismaClient();

async function testSkuMappingFromProduction() {
    console.log('🧪 Testing SKU Mapping Creation from Production Runs\n');

    try {
        // 1. Get an existing client for testing
        console.log('1️⃣ Finding demo client...');
        const client = await prisma.client.findFirst({
            where: { name: { contains: 'Demo' } }
        });

        if (!client) {
            throw new Error('Demo client not found. Please run seed first.');
        }
        
        console.log(`   ✅ Using client: ${client.name} (ID: ${client.id})`);

        // 2. Find an existing recipe
        console.log('\n2️⃣ Finding existing recipe...');
        const recipe = await prisma.recipe.findFirst({
            where: { clientId: client.id }
        });

        if (!recipe) {
            throw new Error('No recipes found. Please create a recipe first.');
        }

        console.log(`   ✅ Found recipe: ${recipe.name} (ID: ${recipe.id})`);

        // 3. Check existing SkuMapping count
        console.log('\n3️⃣ Checking existing SKU mappings...');
        const beforeSkuCount = await prisma.skuMapping.count({
            where: { 
                clientId: client.id,
                itemType: 'FINISHED_PRODUCT'
            }
        });
        console.log(`   📊 Existing finished product SKU mappings: ${beforeSkuCount}`);

        // 4. Create a production run
        console.log('\n4️⃣ Creating production run...');
        const productionRun = await prisma.productionRun.create({
            data: {
                name: `Test Production - ${Date.now()}`,
                recipeId: recipe.id,
                targetQuantity: 5,
                targetUnit: 'pcs',
                status: 'IN_PROGRESS',
                clientId: client.id,
                steps: {
                    create: {
                        name: 'Test Step',
                        description: 'Complete test production',
                        stepOrder: 1,
                        estimatedMinutes: 30,
                        status: 'COMPLETED',
                        completedAt: new Date(),
                        actualMinutes: 30,
                        clientId: client.id
                    }
                }
            },
            include: {
                recipe: true,
                steps: true
            }
        });

        console.log(`   ✅ Created production run: ${productionRun.name} (ID: ${productionRun.id})`);

        // 5. Complete the production run (this should create SkuMapping)
        console.log('\n5️⃣ Completing production run...');
        const completionResult = await completeProductionRunDirect(productionRun.id, 5);

        if (!completionResult.finishedProduct) {
            throw new Error('No finished product was created');
        }

        const finishedProduct = completionResult.finishedProduct;
        console.log(`   ✅ Finished product created: ${finishedProduct.name}`);
        console.log(`   🏷️ SKU: ${finishedProduct.sku}`);
        console.log(`   🔗 SKU Reference ID: ${finishedProduct.skuReferenceId || 'NULL'}`);

        // 6. Check if SkuMapping was created
        console.log('\n6️⃣ Verifying SKU mapping creation...');
        const afterSkuCount = await prisma.skuMapping.count({
            where: { 
                clientId: client.id,
                itemType: 'FINISHED_PRODUCT'
            }
        });

        const skuMappingCreated = afterSkuCount > beforeSkuCount;
        console.log(`   📊 SKU mappings after: ${afterSkuCount} (was ${beforeSkuCount})`);

        if (skuMappingCreated) {
            console.log(`   ✅ SKU mapping was created! (+${afterSkuCount - beforeSkuCount})`);
            
            // Find the specific mapping
            const newMapping = await prisma.skuMapping.findFirst({
                where: {
                    name: recipe.name,
                    clientId: client.id,
                    itemType: 'FINISHED_PRODUCT'
                }
            });

            if (newMapping) {
                console.log(`   📋 Mapping details:`);
                console.log(`      Name: ${newMapping.name}`);
                console.log(`      SKU: ${newMapping.sku}`);
                console.log(`      Type: ${newMapping.itemType}`);
                console.log(`      ID: ${newMapping.id}`);
            }
        } else {
            console.log(`   ❌ No SKU mapping was created`);
        }

        // 7. Test SKU Reference API endpoint
        console.log('\n7️⃣ Testing SKU Reference API...');
        const skuReferences = await prisma.skuMapping.findMany({
            where: { clientId: client.id },
            include: {
                category: true,
                _count: {
                    select: {
                        rawMaterials: true,
                        finishedProducts: true
                    }
                }
            }
        });

        const finishedProductSkus = skuReferences.filter(ref => ref.itemType === 'FINISHED_PRODUCT');
        console.log(`   📋 Total SKU references: ${skuReferences.length}`);
        console.log(`   🎯 Finished product SKUs: ${finishedProductSkus.length}`);

        if (finishedProductSkus.length > 0) {
            console.log(`   ✅ Finished product SKUs are available in SKU Reference data`);
            finishedProductSkus.forEach((sku, index) => {
                console.log(`      ${index + 1}. ${sku.name} (${sku.sku}) - ${sku._count.finishedProducts} items`);
            });
        }

        // 8. Clean up
        console.log('\n8️⃣ Cleaning up test data...');
        await prisma.finishedProduct.delete({ where: { id: finishedProduct.id } });
        await prisma.productionStep.deleteMany({ where: { productionRunId: productionRun.id } });
        await prisma.productionRun.delete({ where: { id: productionRun.id } });
        console.log(`   🧹 Test data cleaned up`);

        // 9. Results Summary
        console.log('\n🎯 TEST RESULTS SUMMARY');
        console.log('=======================');
        
        if (skuMappingCreated && finishedProductSkus.length > 0) {
            console.log('✅ SUCCESS: Production runs now create SKU mappings!');
            console.log('   ✓ Finished products created from production have SkuMapping records');
            console.log('   ✓ SkuMapping records appear in SKU Reference page data');
            console.log('   ✓ Item type is correctly set to FINISHED_PRODUCT');
        } else {
            console.log('❌ FAILED: SKU mapping creation not working correctly');
            if (!skuMappingCreated) {
                console.log('   ✗ No SkuMapping record was created');
            }
            if (finishedProductSkus.length === 0) {
                console.log('   ✗ No finished product SKUs found in reference data');
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
if (require.main === module) {
    testSkuMappingFromProduction()
        .then(() => {
            console.log('\n✅ Test completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Test failed:', error);
            process.exit(1);
        });
}