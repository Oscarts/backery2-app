#!/usr/bin/env node

/**
 * Debug Data Access Issue - Check authentication and data filtering
 * This script helps diagnose why data isn't showing after security updates
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDataAccess() {
    console.log('🔍 DEBUGGING DATA ACCESS ISSUES');
    console.log('='.repeat(50));

    try {
        // 1. Check if there are users in the database
        const userCount = await prisma.user.count();
        console.log(`\n📊 Total users in database: ${userCount}`);

        if (userCount === 0) {
            console.log('❌ NO USERS FOUND - This might be the issue!');
            console.log('💡 You may need to run database seeding');
            return;
        }

        // 2. Check user data and clientIds
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                clientId: true,
                client: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            take: 5
        });

        console.log('\n👥 Sample users:');
        users.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.email} (clientId: ${user.clientId})`);
            console.log(`      Client: ${user.client?.name || 'NO CLIENT!'}`);
        });

        // 3. Check data in each controller's main table
        const tables = [
            { name: 'customers', model: prisma.customer },
            { name: 'customer orders', model: prisma.customerOrder },
            { name: 'raw materials', model: prisma.rawMaterial },
            { name: 'finished products', model: prisma.finishedProduct },
            { name: 'recipes', model: prisma.recipe },
            { name: 'production runs', model: prisma.productionRun }
        ];

        console.log('\n📊 DATA DISTRIBUTION BY CLIENT:');

        for (const table of tables) {
            try {
                const totalCount = await table.model.count();
                console.log(`\n${table.name.toUpperCase()}:`);
                console.log(`   Total records: ${totalCount}`);

                if (totalCount > 0) {
                    // Group by clientId
                    const clientDistribution = await table.model.groupBy({
                        by: ['clientId'],
                        _count: {
                            id: true
                        }
                    });

                    console.log('   Distribution by client:');
                    for (const dist of clientDistribution) {
                        const client = await prisma.client.findUnique({
                            where: { id: dist.clientId },
                            select: { name: true }
                        });
                        console.log(`     ${client?.name || 'Unknown'} (${dist.clientId}): ${dist._count.id} records`);
                    }
                } else {
                    console.log('   ❌ NO RECORDS FOUND');
                }
            } catch (error) {
                console.log(`   ❌ Error checking ${table.name}: ${error.message}`);
            }
        }

        // 4. Check if there are any records without clientId (null values)
        console.log('\n🚨 CHECKING FOR RECORDS WITHOUT clientId:');

        for (const table of tables) {
            try {
                const nullClientIdCount = await table.model.count({
                    where: {
                        clientId: null
                    }
                });

                if (nullClientIdCount > 0) {
                    console.log(`   ❌ ${table.name}: ${nullClientIdCount} records have NULL clientId!`);
                } else {
                    console.log(`   ✅ ${table.name}: All records have valid clientId`);
                }
            } catch (error) {
                console.log(`   ⚠️  ${table.name}: Could not check - ${error.message}`);
            }
        }

        // 5. Test a sample query with clientId filtering
        console.log('\n🧪 TESTING SAMPLE QUERIES:');

        if (users.length > 0) {
            const sampleClientId = users[0].clientId;
            console.log(`   Testing with clientId: ${sampleClientId}`);

            try {
                const customerCount = await prisma.customer.count({
                    where: { clientId: sampleClientId }
                });
                console.log(`   ✅ Customers for this client: ${customerCount}`);

                const orderCount = await prisma.customerOrder.count({
                    where: { clientId: sampleClientId }
                });
                console.log(`   ✅ Orders for this client: ${orderCount}`);

                const materialCount = await prisma.rawMaterial.count({
                    where: { clientId: sampleClientId }
                });
                console.log(`   ✅ Raw materials for this client: ${materialCount}`);

            } catch (error) {
                console.log(`   ❌ Error testing queries: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('💥 Debug failed:', error);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the debug
debugDataAccess()
    .then(() => {
        console.log('\n🏁 DEBUG COMPLETE');
    })
    .catch(error => {
        console.error('💥 Debug script failed:', error);
        process.exit(1);
    });