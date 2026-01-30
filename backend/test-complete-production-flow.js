#!/usr/bin/env node
/**
 * Complete Production Flow Test: SKU Mapping Creation
 * Tests the full production workflow with proper step completion
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

    const result = await response.json();
    if (!result.success) {
        throw new Error(`Login failed: ${result.error}`);
    }

    return result.data.token;
}

async function testCompleteProductionFlow() {
    console.log('🧪 Testing Complete Production Flow with SKU Mapping\n');

    try {
        // 1. Login
        console.log('1️⃣ Logging in...');
        const token = await login();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        console.log('   ✅ Logged in successfully');

        // 2. Get existing SKU references count
        console.log('\n2️⃣ Checking existing SKU references...');
        const beforeResponse = await fetch(`${BASE_URL}/sku-references`, { headers });
        const beforeData = await beforeResponse.json();
        
        const beforeFinishedCount = beforeData.data?.filter(sku => sku.itemType === 'FINISHED_PRODUCT')?.length || 0;
        console.log(`   🎯 Existing finished product SKUs: ${beforeFinishedCount}`);

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
                name: `Complete SKU Test - ${Date.now()}`,
                recipeId: recipe.id,
                targetQuantity: 2,
                targetUnit: 'pcs'
            })
        });

        const runResult = await createRunResponse.json();
        if (!runResult.success) {
            throw new Error(`Failed to create production run: ${runResult.error}`);
        }

        const productionRun = runResult.data;
        console.log(`   ✅ Created production run: ${productionRun.name}`);

        // 5. Get production steps
        console.log('\n5️⃣ Getting production steps...');
        const stepsResponse = await fetch(`${BASE_URL}/production/runs/${productionRun.id}`, { headers });
        const stepsData = await stepsResponse.json();
        
        const steps = stepsData.data?.steps || [];
        console.log(`   📋 Found ${steps.length} steps to complete`);

        // 6. Complete all steps
        console.log('\n6️⃣ Completing all production steps...');
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            console.log(`   Step ${i + 1}/${steps.length}: ${step.name}`);
            
            // Start the step first
            const startStepResponse = await fetch(`${BASE_URL}/production/steps/${step.id}/start`, {
                method: 'POST',
                headers,
                body: JSON.stringify({})
            });

            const startResult = await startStepResponse.json();
            if (!startResult.success) {
                throw new Error(`Failed to start step: ${startResult.error}`);
            }

            console.log(`   🏃 Step started: ${step.name}`);
            
            // Complete the step
            const completeStepResponse = await fetch(`${BASE_URL}/production/steps/${step.id}/complete`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    actualMinutes: step.estimatedMinutes || 30,
                    notes: `Completed automatically for SKU test`,
                    yieldQuantity: i === steps.length - 1 ? 2 : undefined // Set final quantity on last step
                })
            });

            const stepResult = await completeStepResponse.json();
            if (!stepResult.success) {
                throw new Error(`Failed to complete step: ${stepResult.error}`);
            }

            console.log(`   ✅ Step completed: ${step.name}`);
            
            // Check if production was completed automatically after last step
            if (stepResult.data.productionCompleted) {
                console.log(`   🎉 Production automatically completed!`);
                if (stepResult.data.finishedProduct) {
                    console.log(`   📦 Finished product: ${stepResult.data.finishedProduct.name}`);
                    console.log(`   🏷️ SKU: ${stepResult.data.finishedProduct.sku}`);
                    console.log(`   🔗 SKU Reference ID: ${stepResult.data.finishedProduct.skuReferenceId || 'NULL'}`);
                    break; // Production is done
                }
            }
        }

        // 7. Manually complete production (since auto-completion is disabled)
        console.log('\n7️⃣ Manually completing production run...');
        const completeProductionResponse = await fetch(`${BASE_URL}/production/runs/${productionRun.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                status: 'COMPLETED',
                completedAt: new Date().toISOString(),
                finalQuantity: 2
            })
        });

        const completeProductionResult = await completeProductionResponse.json();
        if (!completeProductionResult.success) {
            throw new Error(`Failed to complete production: ${completeProductionResult.error}`);
        }

        console.log(`   ✅ Production completed: ${completeProductionResult.data.status}`);
        
        if (completeProductionResult.data.finishedProduct) {
            console.log(`   📦 Finished product: ${completeProductionResult.data.finishedProduct.name}`);
            console.log(`   🏷️ SKU: ${completeProductionResult.data.finishedProduct.sku}`);
            console.log(`   🔗 SKU Reference ID: ${completeProductionResult.data.finishedProduct.skuReferenceId || 'NULL'}`);
        }

        // 8. Check final production status
        console.log('\n7️⃣ Checking final production status...');
        const finalResponse = await fetch(`${BASE_URL}/production/runs/${productionRun.id}`, { headers });
        const finalData = await finalResponse.json();
        
        console.log(`   📊 Final status: ${finalData.data.status}`);

        // 9. Check SKU references after production
        console.log('\n8️⃣ Checking SKU references after production...');
        const afterResponse = await fetch(`${BASE_URL}/sku-references`, { headers });
        const afterData = await afterResponse.json();
        
        const afterFinishedCount = afterData.data?.filter(sku => sku.itemType === 'FINISHED_PRODUCT')?.length || 0;
        console.log(`   🎯 Finished product SKUs: ${afterFinishedCount} (was ${beforeFinishedCount})`);

        const skuMappingCreated = afterFinishedCount > beforeFinishedCount;
        
        if (skuMappingCreated) {
            console.log(`   ✅ SKU mapping created! (+${afterFinishedCount - beforeFinishedCount})`);
            
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
                console.log(`      ID: ${mapping.id}`);
                console.log(`      Items: ${mapping._count?.finishedProducts || 0} finished products`);
            }
        }

        // 9. Get detailed SKU mapping to verify unit field
        console.log('\n9️⃣ Checking SKU mapping unit field...');
        const skuResponse = await fetch(`${BASE_URL}/sku-references`, { headers });
        const skuData = await skuResponse.json();
        
        if (skuData.success && skuData.data) {
            const finishedProductSku = skuData.data.find(sku => 
                sku.itemType === 'FINISHED_PRODUCT' && sku.name === recipe.name
            );
            
            if (finishedProductSku) {
                console.log('   📋 Detailed SKU mapping:');
                console.log(`      Name: ${finishedProductSku.name}`);
                console.log(`      SKU: ${finishedProductSku.sku}`);
                console.log(`      Type: ${finishedProductSku.itemType}`);
                console.log(`      Unit: ${finishedProductSku.unit || 'NOT SET'}`);
                console.log(`      Description: ${finishedProductSku.description || 'None'}`);
                
                if (finishedProductSku.unit) {
                    console.log(`   ✅ SUCCESS: Unit field is properly set!`);
                    hasCreatedMapping = true;
                } else {
                    console.log(`   ❌ ISSUE: Unit field is missing from SKU mapping`);
                }
            }
        }

        // 1️⃣0️⃣ Check finished products inventory
        console.log('\n1️⃣0️⃣ Checking finished products inventory...');
        const inventoryResponse = await fetch(`${BASE_URL}/finished-products`, { headers });
        const inventoryData = await inventoryResponse.json();
        
        const recentProducts = inventoryData.data?.filter(fp => 
            fp.createdAt > new Date(Date.now() - 5 * 60 * 1000).toISOString()
        ) || [];
        
        console.log(`   📦 Recent finished products: ${recentProducts.length}`);
        recentProducts.forEach(fp => {
            console.log(`      - ${fp.name}: ${fp.quantity} ${fp.unit} (SKU: ${fp.sku})`);
            console.log(`        SKU Ref ID: ${fp.skuReferenceId || 'NULL'}`);
        });

        // 11. Results Summary
        console.log('\n🎯 TEST RESULTS SUMMARY');
        console.log('=======================');
        
        const finishedProductCreated = recentProducts.length > 0;
        const finishedProductHasSkuRef = recentProducts.some(fp => fp.skuReferenceId);
        
        // Check if SKU mapping exists with unit
        let skuMappingHasUnit = false;
        if (skuData.success && skuData.data) {
            const finishedProductSku = skuData.data.find(sku => 
                sku.itemType === 'FINISHED_PRODUCT' && sku.name === recipe.name
            );
            skuMappingHasUnit = finishedProductSku && !!finishedProductSku.unit;
        }
        
        if (skuMappingHasUnit && finishedProductCreated && finishedProductHasSkuRef) {
            console.log('✅ SUCCESS: Complete production flow with SKU mapping works!');
            console.log('   ✓ All production steps completed successfully');
            console.log('   ✓ Finished product created in inventory');
            console.log('   ✓ SkuMapping record exists with FINISHED_PRODUCT type');
            console.log('   ✓ SkuMapping has proper unit field set');
            console.log('   ✓ Finished product linked to SKU mapping');
            console.log('   ✓ SKU appears in SKU Reference page data');
            console.log('\n🎉 ISSUE FIXED: Finished products have proper SKU references with units!');
        } else {
            console.log('❌ FAILED: Some part of the flow is broken');
            if (!finishedProductCreated) {
                console.log('   ✗ No finished product was created');
            }
            if (!skuMappingHasUnit) {
                console.log('   ✗ SKU mapping missing or unit field not set');
            }
            if (!finishedProductHasSkuRef) {
                console.log('   ✗ Finished product not linked to SKU mapping');
            }
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testCompleteProductionFlow()
        .then(() => {
            console.log('\n✅ Complete production flow test finished');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Test failed:', error);
            process.exit(1);
        });
}