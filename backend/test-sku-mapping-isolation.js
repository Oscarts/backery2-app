/**
 * Test suite for SKU Mapping Multi-Tenant Isolation
 * 
 * This test verifies that SKU mappings are properly isolated by clientId,
 * preventing cross-tenant data access.
 * 
 * Run with: node backend/test-sku-mapping-isolation.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// Test data
let client1, client2, user1, user2, token1, token2;

async function setup() {
    console.log('🔧 Setting up test data...\n');

    const timestamp = Date.now();

    // Create two test clients
    client1 = await prisma.client.create({
        data: {
            name: `Test Bakery 1 ${timestamp}`,
            slug: 'test-bakery-1-' + timestamp,
            email: `test1-${timestamp}@bakery.com`,
        },
    });

    client2 = await prisma.client.create({
        data: {
            name: `Test Bakery 2 ${timestamp}`,
            slug: 'test-bakery-2-' + timestamp,
            email: `test2-${timestamp}@bakery.com`,
        },
    });

    console.log(`✅ Created Client 1: ${client1.name} (${client1.id})`);
    console.log(`✅ Created Client 2: ${client2.name} (${client2.id})\n`);

    // Create roles for both clients
    const role1 = await prisma.role.create({
        data: {
            name: 'Admin',
            clientId: client1.id,
            isSystem: true,
        },
    });

    const role2 = await prisma.role.create({
        data: {
            name: 'Admin',
            clientId: client2.id,
            isSystem: true,
        },
    });

    // Create users for both clients
    const hashedPassword = await bcrypt.hash('password123', 10);

    user1 = await prisma.user.create({
        data: {
            email: `user1-${timestamp}@bakery1.com`,
            passwordHash: hashedPassword,
            firstName: 'User',
            lastName: 'One',
            clientId: client1.id,
            roleId: role1.id,
        },
    });

    user2 = await prisma.user.create({
        data: {
            email: `user2-${timestamp}@bakery2.com`,
            passwordHash: hashedPassword,
            firstName: 'User',
            lastName: 'Two',
            clientId: client2.id,
            roleId: role2.id,
        },
    });

    // Generate JWT tokens
    token1 = jwt.sign(
        { id: user1.id, email: user1.email, clientId: client1.id },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    token2 = jwt.sign(
        { id: user2.id, email: user2.email, clientId: client2.id },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    console.log(`✅ Created User 1 for Client 1`);
    console.log(`✅ Created User 2 for Client 2\n`);
}

async function cleanup() {
    console.log('\n🧹 Cleaning up test data...\n');

    // Delete in correct order due to foreign key constraints
    if (user1) {
        await prisma.user.delete({ where: { id: user1.id } }).catch(() => { });
    }
    if (user2) {
        await prisma.user.delete({ where: { id: user2.id } }).catch(() => { });
    }

    // Delete SKU mappings (will cascade with client deletion, but being explicit)
    await prisma.skuMapping.deleteMany({
        where: {
            OR: [
                { clientId: client1?.id },
                { clientId: client2?.id },
            ],
        },
    });

    // Delete clients (will cascade delete roles, etc.)
    if (client1) {
        await prisma.client.delete({ where: { id: client1.id } }).catch(() => { });
    }
    if (client2) {
        await prisma.client.delete({ where: { id: client2.id } }).catch(() => { });
    }

    console.log('✅ Cleanup completed\n');
}

async function testSkuMappingIsolation() {
    console.log('📝 Test 1: SKU Mappings are isolated by clientId\n');

    // Create SKU mappings for both clients with same name
    const mapping1 = await prisma.skuMapping.create({
        data: {
            name: 'Chocolate Chips',
            sku: 'CHOCOLATE-CHIPS-1',
            clientId: client1.id,
            category: 'Raw Materials',
        },
    });

    const mapping2 = await prisma.skuMapping.create({
        data: {
            name: 'Chocolate Chips',
            sku: 'CHOCOLATE-CHIPS-2',
            clientId: client2.id,
            category: 'Raw Materials',
        },
    });

    console.log(`✅ Created SKU mapping for Client 1: ${mapping1.name} -> ${mapping1.sku}`);
    console.log(`✅ Created SKU mapping for Client 2: ${mapping2.name} -> ${mapping2.sku}\n`);

    // Test: Client 1 should only see their own mapping
    const client1Mappings = await prisma.skuMapping.findMany({
        where: { clientId: client1.id },
    });

    console.log(`📊 Client 1 sees ${client1Mappings.length} mapping(s)`);
    if (client1Mappings.length !== 1) {
        throw new Error(`❌ FAIL: Client 1 should see exactly 1 mapping, but saw ${client1Mappings.length}`);
    }
    if (client1Mappings[0].sku !== 'CHOCOLATE-CHIPS-1') {
        throw new Error(`❌ FAIL: Client 1 should see their own SKU, but saw ${client1Mappings[0].sku}`);
    }
    console.log(`✅ PASS: Client 1 can only see their own mapping\n`);

    // Test: Client 2 should only see their own mapping
    const client2Mappings = await prisma.skuMapping.findMany({
        where: { clientId: client2.id },
    });

    console.log(`📊 Client 2 sees ${client2Mappings.length} mapping(s)`);
    if (client2Mappings.length !== 1) {
        throw new Error(`❌ FAIL: Client 2 should see exactly 1 mapping, but saw ${client2Mappings.length}`);
    }
    if (client2Mappings[0].sku !== 'CHOCOLATE-CHIPS-2') {
        throw new Error(`❌ FAIL: Client 2 should see their own SKU, but saw ${client2Mappings[0].sku}`);
    }
    console.log(`✅ PASS: Client 2 can only see their own mapping\n`);

    // Test: Verify unique constraints are per-client (same name, different clients should work)
    console.log(`✅ PASS: Same SKU name allowed across different clients\n`);
}

async function testUniqueConstraints() {
    console.log('📝 Test 2: Unique constraints are per-client\n');

    // Test: Cannot create duplicate name within same client
    try {
        await prisma.skuMapping.create({
            data: {
                name: 'Chocolate Chips',
                sku: 'DIFFERENT-SKU',
                clientId: client1.id,
            },
        });
        throw new Error('❌ FAIL: Should not allow duplicate name within same client');
    } catch (error) {
        if (error.code === 'P2002') {
            console.log('✅ PASS: Cannot create duplicate name within same client\n');
        } else {
            throw error;
        }
    }

    // Test: Can create same name in different client (already tested above)
    const client2MappingsCount = await prisma.skuMapping.count({
        where: { clientId: client2.id, name: 'Chocolate Chips' },
    });
    if (client2MappingsCount !== 1) {
        throw new Error('❌ FAIL: Should allow same name in different client');
    }
    console.log('✅ PASS: Can create same name in different client\n');
}

async function testCascadeDelete() {
    console.log('📝 Test 3: SKU Mappings cascade delete with client\n');

    // Create a temporary client with SKU mappings
    const tempClient = await prisma.client.create({
        data: {
            name: 'Temp Bakery',
            slug: 'temp-bakery-' + Date.now(),
        },
    });

    await prisma.skuMapping.create({
        data: {
            name: 'Temp Product',
            sku: 'TEMP-SKU',
            clientId: tempClient.id,
        },
    });

    const beforeCount = await prisma.skuMapping.count({
        where: { clientId: tempClient.id },
    });
    console.log(`📊 Created ${beforeCount} SKU mapping(s) for temp client`);

    // Delete the client
    await prisma.client.delete({ where: { id: tempClient.id } });

    // Verify SKU mappings were deleted
    const afterCount = await prisma.skuMapping.count({
        where: { clientId: tempClient.id },
    });

    if (afterCount !== 0) {
        throw new Error(`❌ FAIL: SKU mappings should be deleted with client, but ${afterCount} remain`);
    }
    console.log('✅ PASS: SKU mappings cascade delete with client\n');
}

async function testSkuServiceFunctions() {
    console.log('📝 Test 4: Direct database queries respect clientId\n');

    // Test: Query all SKU mappings for each client
    const client1All = await prisma.skuMapping.findMany({
        where: { clientId: client1.id },
    });
    const client2All = await prisma.skuMapping.findMany({
        where: { clientId: client2.id },
    });

    console.log(`📊 Client 1 has ${client1All.length} SKU mapping(s)`);
    console.log(`📊 Client 2 has ${client2All.length} SKU mapping(s)`);

    if (client1All.some(m => m.clientId === client2.id)) {
        throw new Error('❌ FAIL: Client 1 query returned Client 2 data');
    }
    if (client2All.some(m => m.clientId === client1.id)) {
        throw new Error('❌ FAIL: Client 2 query returned Client 1 data');
    }

    console.log('✅ PASS: Database queries respect clientId filter\n');

    // Test: Create new mapping with clientId
    const newMapping = await prisma.skuMapping.create({
        data: {
            name: 'New Test Product',
            sku: 'NEW-TEST-PRODUCT',
            clientId: client1.id,
        },
    });

    if (newMapping.clientId !== client1.id) {
        throw new Error('❌ FAIL: New mapping has wrong clientId');
    }
    console.log('✅ PASS: New mappings are created with correct clientId\n');

    // Test: Delete mapping filters by clientId
    await prisma.skuMapping.deleteMany({
        where: { name: 'New Test Product', clientId: client1.id },
    });

    const deletedMapping = await prisma.skuMapping.findFirst({
        where: { name: 'New Test Product' },
    });
    if (deletedMapping) {
        throw new Error('❌ FAIL: Mapping was not deleted');
    }
    console.log('✅ PASS: Deletion respects clientId filter\n');
}

async function runTests() {
    try {
        await setup();

        await testSkuMappingIsolation();
        await testUniqueConstraints();
        await testCascadeDelete();
        await testSkuServiceFunctions();

        console.log('🎉 All tests passed!\n');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await cleanup();
        await prisma.$disconnect();
    }
}

// Run tests
if (require.main === module) {
    runTests();
}

module.exports = { runTests };
