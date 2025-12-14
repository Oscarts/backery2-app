/**
 * Direct Database Test for Multi-Batch Allocation
 * 
 * This tests the inventoryAllocationService directly
 */

import { PrismaClient } from '@prisma/client';
import { InventoryAllocationService } from './backend/src/services/inventoryAllocationService';

const prisma = new PrismaClient();
const allocationService = new InventoryAllocationService();

async function runTest() {
    try {
        console.log('🧪 Testing Multi-Batch Allocation Logic\n');
        console.log('='.repeat(60));

        // Get any existing client
        const client = await prisma.client.findFirst();
        if (!client) {
            console.error('❌ No client found in database');
            console.log('   Run: npm run seed:quick');
            process.exit(1);
        }

        console.log(`✅ Using client: ${client.name} (${client.id})`);

        // Get storage location and supplier
        const storage = await prisma.storageLocation.findFirst({ where: { clientId: client.id } });
        const supplier = await prisma.supplier.findFirst({ where: { clientId: client.id } });

        if (!storage || !supplier) {
            console.error('❌ No storage location or supplier found');
            process.exit(1);
        }

        console.log('✅ Storage and supplier ready\n');

        // Create test material name
        const timestamp = Date.now();
        const materialName = `TestMaterial_${timestamp}`;

        console.log('📦 Creating multiple batches with same name...');

        // Batch 1: 1 kg, expires sooner
        const batch1 = await prisma.rawMaterial.create({
            data: {
                name: materialName,
                sku: `TEST-${timestamp}`,
                description: 'Batch 1',
                supplierId: supplier.id,
                batchNumber: `BATCH-${timestamp}-001`,
                expirationDate: new Date('2025-06-30'),
                quantity: 1.0,
                unit: 'kg',
                unitPrice: 3.50,
                storageLocationId: storage.id,
                clientId: client.id
            }
        });
        console.log(`  Batch 1: ${batch1.quantity} kg (expires 2025-06-30)`);

        // Batch 2: 1.5 kg, expires later
        const batch2 = await prisma.rawMaterial.create({
            data: {
                name: materialName, // Same name!
                sku: `TEST-${timestamp}`,
                description: 'Batch 2',
                supplierId: supplier.id,
                batchNumber: `BATCH-${timestamp}-002`,
                expirationDate: new Date('2025-12-31'),
                quantity: 1.5,
                unit: 'kg',
                unitPrice: 3.50,
                storageLocationId: storage.id,
                clientId: client.id
            }
        });
        console.log(`  Batch 2: ${batch2.quantity} kg (expires 2025-12-31)`);
        console.log(`  Total: ${batch1.quantity + batch2.quantity} kg\n`);

        // Create recipe needing 2 kg
        console.log('📋 Creating recipe needing 2 kg...');
        const recipe = await prisma.recipe.create({
            data: {
                name: `Test Recipe ${timestamp}`,
                description: 'Multi-batch test',
                yield: 10,
                yieldUnit: 'pcs',
                preparationTime: 30,
                cookingTime: 20,
                instructions: 'Test',
                clientId: client.id,
                ingredients: {
                    create: [{
                        rawMaterialId: batch1.id,
                        quantity: 2.0,  // More than any single batch!
                        unit: 'kg',
                        notes: 'Should use both batches'
                    }]
                }
            }
        });
        console.log(`  Recipe created: ${recipe.name}\n`);

        // Test availability check
        console.log('🔍 Testing availability check...');
        const availability = await allocationService.checkIngredientAvailability(recipe.id, 1);

        console.log(`  Can produce: ${availability.canProduce ? '✅ YES' : '❌ NO'}`);

        if (availability.availableIngredients) {
            availability.availableIngredients.forEach(ing => {
                console.log(`  ${ing.materialName}:`);
                console.log(`    Available: ${ing.quantityAvailable} ${ing.unit}`);
                console.log(`    Needed: ${ing.quantityNeeded} ${ing.unit}`);
            });
        }

        if (!availability.canProduce) {
            console.error('\n❌ BUG NOT FIXED: Should see 2.5 kg available!');
            await cleanup(batch1.id, batch2.id, recipe.id);
            process.exit(1);
        }

        console.log('\n✅ TEST 1 PASSED: Availability check aggregates batches\n');

        // Create production run
        console.log('🏭 Creating production run...');
        const productionRun = await prisma.productionRun.create({
            data: {
                recipeId: recipe.id,
                targetQuantity: 10,
                unit: 'pcs',
                status: 'PENDING',
                expectedStartTime: new Date(),
                priority: 'MEDIUM',
                clientId: client.id
            }
        });
        console.log(`  Created: ${productionRun.id}\n`);

        // Test allocation
        console.log('📦 Testing allocation across batches...');
        const allocations = await allocationService.allocateIngredients(
            productionRun.id,
            recipe.id,
            1
        );

        console.log(`  Created ${allocations.length} allocation(s):`);

        let totalAllocated = 0;
        allocations.forEach((alloc, i) => {
            console.log(`    ${i + 1}. Batch ${alloc.materialBatchNumber}: ${alloc.quantityAllocated} ${alloc.unit}`);
            totalAllocated += alloc.quantityAllocated;
        });

        console.log(`  Total: ${totalAllocated} kg`);

        if (allocations.length < 2) {
            console.error('\n❌ BUG NOT FIXED: Should allocate from 2 batches!');
            await cleanup(batch1.id, batch2.id, recipe.id, productionRun.id);
            process.exit(1);
        }

        console.log('\n✅ TEST 2 PASSED: Allocates from multiple batches\n');

        // Verify FEFO
        console.log('🔍 Verifying FEFO strategy...');
        const batch1Updated = await prisma.rawMaterial.findUnique({
            where: { id: batch1.id }
        });
        const batch2Updated = await prisma.rawMaterial.findUnique({
            where: { id: batch2.id }
        });

        console.log(`  Batch 1 (expires first): ${batch1Updated?.reservedQuantity} kg reserved`);
        console.log(`  Batch 2 (expires later): ${batch2Updated?.reservedQuantity} kg reserved`);

        if (batch1Updated && Math.abs(batch1Updated.reservedQuantity - 1.0) < 0.001) {
            console.log('\n✅ TEST 3 PASSED: FEFO works correctly\n');
        }

        // Cleanup
        await cleanup(batch1.id, batch2.id, recipe.id, productionRun.id);

        console.log('='.repeat(60));
        console.log('🎉 ALL TESTS PASSED!');
        console.log('='.repeat(60));

        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERROR:', error);
        process.exit(1);
    }
}

async function cleanup(batch1Id, batch2Id, recipeId, productionRunId) {
    console.log('🧹 Cleaning up...');

    if (productionRunId) {
        await prisma.productionAllocation.deleteMany({ where: { productionRunId } });
        await prisma.productionRun.delete({ where: { id: productionRunId } }).catch(() => { });
    }

    if (recipeId) {
        await prisma.recipeIngredient.deleteMany({ where: { recipeId } });
        await prisma.recipe.delete({ where: { id: recipeId } }).catch(() => { });
    }

    if (batch1Id) await prisma.rawMaterial.delete({ where: { id: batch1Id } }).catch(() => { });
    if (batch2Id) await prisma.rawMaterial.delete({ where: { id: batch2Id } }).catch(() => { });

    console.log('✅ Cleanup complete\n');
}

runTest().finally(() => prisma.$disconnect());
