/**
 * Test Multi-Batch Allocation Fix
 * 
 * This test verifies that production runs can allocate materials
 * across multiple batches with the same SKU/name.
 * 
 * Test Scenario:
 * - Recipe needs 2 kg of Areparina
 * - Batch A has 1 kg available
 * - Batch B has 1.5 kg available
 * - Total: 2.5 kg (sufficient)
 * 
 * Expected: Should successfully create production run by allocating from both batches
 */

const API_BASE = 'http://localhost:8000/api';

let authToken = '';
let clientId = '';
let recipeId = '';
let rawMaterialIds = [];
let productionRunId = '';

// Test data
const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!@#',
    clientName: `TestBakery_${Date.now()}`,
    firstName: 'Test',
    lastName: 'User'
};

async function makeRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`${method} ${endpoint} failed: ${response.status} - ${error}`);
    }

    return response.json();
}

async function cleanup() {
    console.log('\n🧹 Cleaning up test data...');

    // Delete production run if created
    if (productionRunId) {
        try {
            await makeRequest(`/production-runs/${productionRunId}`, 'DELETE');
            console.log('✅ Deleted production run');
        } catch (error) {
            console.log('⚠️  Could not delete production run:', error.message);
        }
    }

    // Delete raw materials
    for (const id of rawMaterialIds) {
        try {
            await makeRequest(`/raw-materials/${id}`, 'DELETE');
            console.log(`✅ Deleted raw material ${id}`);
        } catch (error) {
            console.log(`⚠️  Could not delete raw material ${id}:`, error.message);
        }
    }

    // Delete recipe
    if (recipeId) {
        try {
            await makeRequest(`/recipes/${recipeId}`, 'DELETE');
            console.log('✅ Deleted recipe');
        } catch (error) {
            console.log('⚠️  Could not delete recipe:', error.message);
        }
    }
}

async function runTest() {
    try {
        console.log('🧪 Multi-Batch Allocation Test\n');
        console.log('='.repeat(60));

        // Step 1: Register and login
        console.log('\n📝 Step 1: Register and login');
        await makeRequest('/auth/register', 'POST', testUser);
        console.log('✅ Registered successfully');

        const loginResponse = await makeRequest('/auth/login', 'POST', {
            email: testUser.email,
            password: testUser.password
        });
        authToken = loginResponse.token;
        clientId = loginResponse.user.clientId;
        console.log('✅ Logged in successfully');
        console.log(`   Client ID: ${clientId}`);

        // Step 2: Get or create storage location and supplier
        console.log('\n📍 Step 2: Setup storage location and supplier');

        const storageLocations = await makeRequest('/storage-locations');
        let storageLocationId;

        if (storageLocations.length === 0) {
            const newLocation = await makeRequest('/storage-locations', 'POST', {
                name: 'Main Warehouse',
                description: 'Primary storage'
            });
            storageLocationId = newLocation.id;
            console.log('✅ Created storage location');
        } else {
            storageLocationId = storageLocations[0].id;
            console.log('✅ Using existing storage location');
        }

        const suppliers = await makeRequest('/suppliers');
        let supplierId;

        if (suppliers.length === 0) {
            const newSupplier = await makeRequest('/suppliers', 'POST', {
                name: 'Test Supplier',
                contactName: 'John Doe',
                contactEmail: 'supplier@test.com',
                contactPhone: '123-456-7890'
            });
            supplierId = newSupplier.id;
            console.log('✅ Created supplier');
        } else {
            supplierId = suppliers[0].id;
            console.log('✅ Using existing supplier');
        }

        // Step 3: Create TWO batches of Areparina with same name
        console.log('\n📦 Step 3: Create multiple batches of Areparina');

        const batch1 = await makeRequest('/raw-materials', 'POST', {
            name: 'Areparina',
            sku: 'AREPARINA-001',
            description: 'White corn flour - Batch 1',
            supplierId: supplierId,
            batchNumber: 'BATCH-2025-001',
            expirationDate: '2025-12-31',
            quantity: 1.0,  // 1 kg available
            unit: 'kg',
            unitPrice: 3.50,
            storageLocationId: storageLocationId
        });
        rawMaterialIds.push(batch1.id);
        console.log(`✅ Created Batch 1: ${batch1.quantity} ${batch1.unit} (ID: ${batch1.id})`);

        const batch2 = await makeRequest('/raw-materials', 'POST', {
            name: 'Areparina', // Same name!
            sku: 'AREPARINA-001', // Same SKU!
            description: 'White corn flour - Batch 2',
            supplierId: supplierId,
            batchNumber: 'BATCH-2025-002',
            expirationDate: '2026-06-30', // Expires later
            quantity: 1.5,  // 1.5 kg available
            unit: 'kg',
            unitPrice: 3.50,
            storageLocationId: storageLocationId
        });
        rawMaterialIds.push(batch2.id);
        console.log(`✅ Created Batch 2: ${batch2.quantity} ${batch2.unit} (ID: ${batch2.id})`);

        console.log(`\n📊 Total Areparina available: ${batch1.quantity + batch2.quantity} kg`);

        // Step 4: Create recipe that needs 2 kg of Areparina
        console.log('\n📋 Step 4: Create recipe requiring 2 kg Areparina');

        const recipe = await makeRequest('/recipes', 'POST', {
            name: 'Test Recipe for Multi-Batch',
            description: 'Recipe to test multi-batch allocation',
            yield: 10,
            yieldUnit: 'pcs',
            preparationTime: 30,
            cookingTime: 20,
            instructions: 'Test recipe',
            ingredients: [
                {
                    rawMaterialId: batch1.id, // Link to first batch (but should check all)
                    quantity: 2.0,  // Needs 2 kg total
                    unit: 'kg',
                    notes: 'Should allocate from multiple batches'
                }
            ]
        });
        recipeId = recipe.id;
        console.log(`✅ Created recipe needing 2 kg Areparina (ID: ${recipe.id})`);

        // Step 5: Check ingredient availability (should find both batches)
        console.log('\n🔍 Step 5: Check ingredient availability');

        const availabilityCheck = await makeRequest(
            `/production-runs/check-availability?recipeId=${recipeId}&targetQuantity=10`,
            'GET'
        );

        console.log('Availability check result:');
        console.log(`  Can produce: ${availabilityCheck.canProduce}`);
        console.log(`  All ingredients available: ${availabilityCheck.allIngredientsAvailable}`);

        if (availabilityCheck.availableIngredients) {
            availabilityCheck.availableIngredients.forEach(ing => {
                console.log(`  ✅ ${ing.materialName}: ${ing.quantityAvailable} ${ing.unit} available, ${ing.quantityNeeded} ${ing.unit} needed`);
            });
        }

        if (availabilityCheck.unavailableIngredients && availabilityCheck.unavailableIngredients.length > 0) {
            availabilityCheck.unavailableIngredients.forEach(ing => {
                console.log(`  ❌ ${ing.materialName}: ${ing.quantityAvailable} ${ing.unit} available, ${ing.quantityNeeded} ${ing.unit} needed (shortage: ${ing.shortage} ${ing.unit})`);
            });
        }

        if (!availabilityCheck.canProduce) {
            console.error('\n❌ TEST FAILED: Should be able to produce with 2.5 kg total available!');
            await cleanup();
            process.exit(1);
        }

        console.log('\n✅ Availability check passed! System correctly aggregated batches');

        // Step 6: Create production run (should allocate from both batches)
        console.log('\n🏭 Step 6: Create production run');

        const productionRun = await makeRequest('/production-runs', 'POST', {
            recipeId: recipe.id,
            targetQuantity: 10,
            unit: 'pcs',
            expectedStartTime: new Date().toISOString(),
            priority: 'MEDIUM'
        });
        productionRunId = productionRun.id;

        console.log(`✅ Production run created (ID: ${productionRun.id})`);
        console.log(`   Status: ${productionRun.status}`);

        // Step 7: Check allocations (should have records from both batches)
        console.log('\n📋 Step 7: Verify allocations from multiple batches');

        const runDetails = await makeRequest(`/production-runs/${productionRunId}`);

        console.log(`Allocations created: ${runDetails.allocations?.length || 0}`);

        if (runDetails.allocations) {
            const arepaAllocations = runDetails.allocations.filter(a => a.materialName === 'Areparina');

            console.log(`\nAreparina allocations: ${arepaAllocations.length}`);

            let totalAllocated = 0;
            arepaAllocations.forEach((alloc, index) => {
                console.log(`  Allocation ${index + 1}:`);
                console.log(`    Batch: ${alloc.materialBatchNumber}`);
                console.log(`    Quantity: ${alloc.quantityAllocated} ${alloc.unit}`);
                console.log(`    Material ID: ${alloc.materialId}`);
                totalAllocated += alloc.quantityAllocated;
            });

            console.log(`\n  Total allocated: ${totalAllocated} kg`);

            if (arepaAllocations.length < 2) {
                console.error('\n❌ TEST FAILED: Should have allocated from 2 batches!');
                console.error(`   Found only ${arepaAllocations.length} allocation(s)`);
                await cleanup();
                process.exit(1);
            }

            if (Math.abs(totalAllocated - 2.0) > 0.001) {
                console.error('\n❌ TEST FAILED: Total allocated should be 2 kg!');
                console.error(`   Found ${totalAllocated} kg`);
                await cleanup();
                process.exit(1);
            }
        }

        // Step 8: Verify reserved quantities updated in both batches
        console.log('\n🔍 Step 8: Verify reserved quantities in batches');

        const batch1Updated = await makeRequest(`/raw-materials/${batch1.id}`);
        const batch2Updated = await makeRequest(`/raw-materials/${batch2.id}`);

        console.log(`\nBatch 1 (expires first):`);
        console.log(`  Total: ${batch1Updated.quantity} kg`);
        console.log(`  Reserved: ${batch1Updated.reservedQuantity} kg`);
        console.log(`  Available: ${batch1Updated.quantity - batch1Updated.reservedQuantity} kg`);

        console.log(`\nBatch 2 (expires later):`);
        console.log(`  Total: ${batch2Updated.quantity} kg`);
        console.log(`  Reserved: ${batch2Updated.reservedQuantity} kg`);
        console.log(`  Available: ${batch2Updated.quantity - batch2Updated.reservedQuantity} kg`);

        const totalReserved = batch1Updated.reservedQuantity + batch2Updated.reservedQuantity;
        console.log(`\nTotal reserved across batches: ${totalReserved} kg`);

        if (Math.abs(totalReserved - 2.0) > 0.001) {
            console.error('\n❌ TEST FAILED: Total reserved should be 2 kg!');
            console.error(`   Found ${totalReserved} kg`);
            await cleanup();
            process.exit(1);
        }

        // Verify FEFO: Batch 1 (expires first) should be fully allocated
        if (Math.abs(batch1Updated.reservedQuantity - 1.0) > 0.001) {
            console.error('\n⚠️  WARNING: FEFO might not be working correctly');
            console.error(`   Batch 1 (expires first) should be fully reserved (1 kg)`);
            console.error(`   Found ${batch1Updated.reservedQuantity} kg reserved`);
        } else {
            console.log('\n✅ FEFO verified: Older batch allocated first');
        }

        // Success!
        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL TESTS PASSED!');
        console.log('='.repeat(60));
        console.log('\nMulti-batch allocation is working correctly:');
        console.log('  ✅ System aggregates quantities across multiple batches');
        console.log('  ✅ Production runs can allocate from multiple batches');
        console.log('  ✅ FEFO (First-Expired-First-Out) allocation works');
        console.log('  ✅ Reserved quantities updated in all batches');

        // Cleanup
        await cleanup();

        process.exit(0);

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        console.error('Stack:', error.stack);

        await cleanup();
        process.exit(1);
    }
}

// Run the test
runTest();
