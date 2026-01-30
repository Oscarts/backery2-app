#!/usr/bin/env node
/**
 * API Test: SKU Mapping Creation from Production Runs
 * Tests the production completion API endpoint to verify SKU mapping creation
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:8000/api';

async function login() {
    const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@demobakery.com',
            password: 'admin123'
        })
    });

    if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error(`Login failed: ${result.error}`);
    }

    return result.data.token;
}

async function testProductionSkuMapping() {
    console.log('🧪 Testing SKU Mapping Creation from Production API\n');

    try {
        // 1. Login
        console.log('1️⃣ Logging in...');
        const token = await login();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        console.log('   ✅ Logged in successfully');

        // 2. Get SKU references before production
        console.log('\n2️⃣ Checking existing SKU references...');
        const beforeResponse = await fetch(`${BASE_URL}/sku-references`, { headers });
        const beforeData = await beforeResponse.json();
        
        const beforeCount = beforeData.data?.length || 0;
        const beforeFinishedCount = beforeData.data?.filter(sku => sku.itemType === 'FINISHED_PRODUCT')?.length || 0;
        
        console.log(`   📊 Total SKU references: ${beforeCount}`);
        console.log(`   🎯 Finished product SKUs: ${beforeFinishedCount}`);

        // 3. Get an existing recipe
        console.log('\n3️⃣ Finding existing recipe...');
        const recipesResponse = await fetch(`${BASE_URL}/recipes`, { headers });
        const recipesData = await recipesResponse.json();
        
        if (!recipesData.success || !recipesData.data?.length) {
            throw new Error('No recipes found. Please create a recipe first.');
        }

        const recipe = recipesData.data[0];
        console.log(`   ✅ Using recipe: ${recipe.name}`);

        // 4. Create production run
        console.log('\n4️⃣ Creating production run...');
        const createRunResponse = await fetch(`${BASE_URL}/production/runs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: `Test SKU Mapping - ${Date.now()}`,
                recipeId: recipe.id,
                targetQuantity: 3,
                targetUnit: 'pcs'
            })
        });

        const runResult = await createRunResponse.json();
        if (!runResult.success) {
            throw new Error(`Failed to create production run: ${runResult.error}`);
        }

        const productionRun = runResult.data;
        console.log(`   ✅ Created production run: ${productionRun.name}`);

        // 5. Complete the production run
        console.log('\n5️⃣ Completing production run...');
        const completeResponse = await fetch(`${BASE_URL}/production/runs/${productionRun.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                status: 'COMPLETED',
                completedAt: new Date().toISOString(),
                finalQuantity: 3
            })
        });

        const completeResult = await completeResponse.json();
        if (!completeResult.success) {
            throw new Error(`Failed to complete production: ${completeResult.error}`);
        }

        console.log(`   ✅ Production completed: ${completeResult.data.status}`);
        
        if (completeResult.data.finishedProduct) {
            console.log(`   📦 Finished product: ${completeResult.data.finishedProduct.name}`);
            console.log(`   🏷️ SKU: ${completeResult.data.finishedProduct.sku}`);
            console.log(`   🔗 SKU Reference ID: ${completeResult.data.finishedProduct.skuReferenceId || 'NULL'}`);
        }

        // 6. Check SKU references after production
        console.log('\n6️⃣ Checking SKU references after production...');
        const afterResponse = await fetch(`${BASE_URL}/sku-references`, { headers });
        const afterData = await afterResponse.json();
        
        const afterCount = afterData.data?.length || 0;
        const afterFinishedCount = afterData.data?.filter(sku => sku.itemType === 'FINISHED_PRODUCT')?.length || 0;
        
        console.log(`   📊 Total SKU references: ${afterCount} (was ${beforeCount})`);
        console.log(`   🎯 Finished product SKUs: ${afterFinishedCount} (was ${beforeFinishedCount})`);

        const skuMappingCreated = afterFinishedCount > beforeFinishedCount;
        
        if (skuMappingCreated) {
            console.log(`   ✅ SKU mapping created! (+${afterFinishedCount - beforeFinishedCount})`);
            
            // Find the new mapping
            const newSkuMappings = afterData.data.filter(sku => 
                sku.itemType === 'FINISHED_PRODUCT' && 
                sku.name === recipe.name
            );
            
            if (newSkuMappings.length > 0) {
                const mapping = newSkuMappings[0];
                console.log(`   📋 New SKU mapping:`);
                console.log(`      Name: ${mapping.name}`);
                console.log(`      SKU: ${mapping.sku}`);
                console.log(`      Type: ${mapping.itemType}`);
                console.log(`      Items: ${mapping._count?.finishedProducts || 0} finished products`);
            }
        } else {
            console.log(`   ❌ No SKU mapping was created`);
        }

        // 7. Clean up
        console.log('\n7️⃣ Cleaning up...');
        if (completeResult.data.finishedProduct) {
            const deleteResponse = await fetch(`${BASE_URL}/finished-products/${completeResult.data.finishedProduct.id}`, {
                method: 'DELETE',
                headers
            });
            
            if (deleteResponse.ok) {
                console.log('   🧹 Finished product cleaned up');
            }
        }

        // 8. Results Summary
        console.log('\n🎯 TEST RESULTS SUMMARY');
        console.log('=======================');
        
        if (skuMappingCreated) {
            console.log('✅ SUCCESS: Production runs now create SKU mappings!');
            console.log('   ✓ SkuMapping records appear in SKU Reference page');
            console.log('   ✓ Item type correctly set to FINISHED_PRODUCT');
            console.log('   ✓ Users can now see finished product SKUs in SKU Reference page');
        } else {
            console.log('❌ FAILED: SKU mapping not created');
            console.log('   ✗ Production completion did not create SkuMapping record');
            console.log('   ✗ Finished products from production will not appear in SKU Reference page');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testProductionSkuMapping()
        .then(() => {
            console.log('\n✅ API test completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ API test failed:', error);
            process.exit(1);
        });
}