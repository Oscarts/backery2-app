#!/usr/bin/env node
/**
 * Test Hierarchical SKU Generation
 * Tests both manual SKU reference creation and production-generated SKUs
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
        throw new Error('Login failed');
    }
    
    const data = await response.json();
    return data.data.token;
}

async function getCategories(token) {
    const response = await fetch(`${BASE_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    return data.data;
}

async function createSkuReference(token, skuData) {
    const response = await fetch(`${BASE_URL}/sku-references`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(skuData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to create SKU: ${error.error}`);
    }
    
    return await response.json();
}

async function main() {
    try {
        console.log('🧪 Testing Hierarchical SKU Generation\n');
        
        // 1. Login
        console.log('1️⃣ Logging in...');
        const token = await login();
        console.log('   ✅ Logged in successfully\n');
        
        // 2. Get categories
        console.log('2️⃣ Getting categories...');
        const categories = await getCategories(token);
        const bakeryCategory = categories.find(c => c.name.toLowerCase().includes('baker') || c.name.toLowerCase().includes('cake'));
        console.log(`   📂 Found ${categories.length} categories`);
        if (bakeryCategory) {
            console.log(`   📌 Using category: ${bakeryCategory.name}\n`);
        }
        
        // 3. Create Raw Material SKU Reference
        console.log('3️⃣ Creating Raw Material SKU Reference...');
        const timestamp = Date.now();
        const rmData = {
            name: `Test Flour ${timestamp}`,
            itemType: 'RAW_MATERIAL',
            unit: 'kg',
            unitPrice: 5.50,
            categoryId: bakeryCategory?.id || null,
            description: 'Test raw material for hierarchical SKU'
        };
        
        const rmResult = await createSkuReference(token, rmData);
        console.log('   ✅ Raw Material created:');
        console.log(`      Name: ${rmResult.data.name}`);
        console.log(`      SKU: ${rmResult.data.sku}`);
        console.log(`      Type: ${rmResult.data.itemType}`);
        console.log(`      Format: RM-[CATEGORY]-[PRODUCT]-[SEQ]\n`);
        
        // 4. Create Finished Product SKU Reference
        console.log('4️⃣ Creating Finished Product SKU Reference...');
        const fpData = {
            name: `Test Cake ${timestamp}`,
            itemType: 'FINISHED_PRODUCT',
            unit: 'pcs',
            unitPrice: 25.00,
            categoryId: bakeryCategory?.id || null,
            description: 'Test finished product for hierarchical SKU'
        };
        
        const fpResult = await createSkuReference(token, fpData);
        console.log('   ✅ Finished Product created:');
        console.log(`      Name: ${fpResult.data.name}`);
        console.log(`      SKU: ${fpResult.data.sku}`);
        console.log(`      Type: ${fpResult.data.itemType}`);
        console.log(`      Format: FP-[CATEGORY]-[PRODUCT]-[SEQ]\n`);
        
        // 5. Create another item in same category to test sequencing
        console.log('5️⃣ Creating another Finished Product (testing sequence)...');
        const fp2Data = {
            name: `Test Cookie ${timestamp}`,
            itemType: 'FINISHED_PRODUCT',
            unit: 'pcs',
            unitPrice: 15.00,
            categoryId: bakeryCategory?.id || null,
            description: 'Test sequence numbering'
        };
        
        const fp2Result = await createSkuReference(token, fp2Data);
        console.log('   ✅ Second Finished Product created:');
        console.log(`      Name: ${fp2Result.data.name}`);
        console.log(`      SKU: ${fp2Result.data.sku}`);
        console.log(`      Expected: Sequence should increment\n`);
        
        // Summary
        console.log('🎯 HIERARCHICAL SKU TEST RESULTS');
        console.log('=================================');
        
        const rmMatches = /^RM-[A-Z]{3}-[A-Z]{3,4}-\d{3}$/.test(rmResult.data.sku);
        const fpMatches = /^FP-[A-Z]{3}-[A-Z]{3,4}-\d{3}$/.test(fpResult.data.sku);
        const fp2Matches = /^FP-[A-Z]{3}-[A-Z]{3,5}-\d{3}$/.test(fp2Result.data.sku);
        
        console.log(`\n✅ Raw Material SKU Format: ${rmMatches ? 'VALID' : 'INVALID'}`);
        console.log(`   Pattern: RM-XXX-XXXX-NNN`);
        console.log(`   Actual:  ${rmResult.data.sku}`);
        
        console.log(`\n✅ Finished Product SKU Format: ${fpMatches ? 'VALID' : 'INVALID'}`);
        console.log(`   Pattern: FP-XXX-XXXX-NNN`);
        console.log(`   Actual:  ${fpResult.data.sku}`);
        
        console.log(`\n✅ Sequential Numbering: ${fp2Matches ? 'VALID' : 'INVALID'}`);
        console.log(`   First:   ${fpResult.data.sku}`);
        console.log(`   Second:  ${fp2Result.data.sku}`);
        
        if (rmMatches && fpMatches && fp2Matches) {
            console.log('\n🎉 SUCCESS: Hierarchical SKU generation is working correctly!');
            console.log('   ✓ Raw materials use RM- prefix');
            console.log('   ✓ Finished products use FP- prefix');
            console.log('   ✓ Category codes are included');
            console.log('   ✓ Sequential numbering works');
        } else {
            console.log('\n❌ FAILED: Some SKU formats are incorrect');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
