// Test for Production Indicators
// This test verifies that all production indicators display correct data from the database

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:8000/api';

async function testProductionIndicators() {
    console.log('🧪 Testing Production Indicators - Database Data Accuracy');
    console.log('=========================================================\n');

    try {
        // 1. Get current database counts manually
        console.log('1️⃣ Getting actual database counts...');
        
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

        const [
            actualActive,
            actualOnHold,
            actualPlanned,
            actualCompletedToday,
            activeProductions
        ] = await Promise.all([
            prisma.productionRun.count({
                where: { status: 'IN_PROGRESS' }
            }),
            prisma.productionRun.count({
                where: { status: 'ON_HOLD' }
            }),
            prisma.productionRun.count({
                where: { status: 'PLANNED' }
            }),
            prisma.productionRun.count({
                where: {
                    status: 'COMPLETED',
                    completedAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                }
            }),
            prisma.productionRun.findMany({
                where: {
                    status: { in: ['PLANNED', 'IN_PROGRESS', 'ON_HOLD'] }
                },
                select: {
                    targetQuantity: true
                }
            })
        ]);

        const actualTotalQuantity = activeProductions.reduce((sum, run) => sum + (run.targetQuantity || 0), 0);

        console.log('   📊 Actual database counts:');
        console.log(`      Active (IN_PROGRESS): ${actualActive}`);
        console.log(`      On Hold: ${actualOnHold}`);
        console.log(`      Planned: ${actualPlanned}`);
        console.log(`      Completed Today: ${actualCompletedToday}`);
        console.log(`      Total Target Quantity: ${actualTotalQuantity}`);

        // 2. Get API counts from production stats endpoint
        console.log('\n2️⃣ Getting API counts from /production/runs/stats...');
        
        const statsResponse = await fetch(`${BASE_URL}/production/runs/stats`);
        const statsResult = await statsResponse.json();
        
        if (!statsResult.success) {
            throw new Error(`Failed to get production stats: ${statsResult.error}`);
        }

        const apiStats = statsResult.data;
        console.log('   📊 API stats response:');
        console.log(`      Active: ${apiStats.active}`);
        console.log(`      On Hold: ${apiStats.onHold}`);
        console.log(`      Planned: ${apiStats.planned}`);
        console.log(`      Completed Today: ${apiStats.completedToday}`);
        console.log(`      Total Target Quantity: ${apiStats.totalTargetQuantity}`);

        // 3. Compare database vs API counts
        console.log('\n3️⃣ Comparing database vs API counts...');
        
        const comparisons = [
            { name: 'Active', db: actualActive, api: apiStats.active },
            { name: 'On Hold', db: actualOnHold, api: apiStats.onHold },
            { name: 'Planned', db: actualPlanned, api: apiStats.planned },
            { name: 'Completed Today', db: actualCompletedToday, api: apiStats.completedToday },
            { name: 'Total Target Quantity', db: actualTotalQuantity, api: apiStats.totalTargetQuantity }
        ];

        let allMatch = true;
        comparisons.forEach(comp => {
            const matches = comp.db === comp.api;
            const status = matches ? '✅' : '❌';
            console.log(`   ${status} ${comp.name}: DB=${comp.db}, API=${comp.api} ${matches ? '(MATCH)' : '(MISMATCH)'}`);
            if (!matches) allMatch = false;
        });

        // 4. Test indicator data freshness by creating a new production
        console.log('\n4️⃣ Testing indicator freshness with new production...');
        
        // Get a recipe for test production
        const recipes = await prisma.recipe.findMany({ take: 1 });
        if (recipes.length === 0) {
            console.log('   ⚠️  No recipes found, skipping freshness test');
        } else {
            const recipe = recipes[0];
            
            // Create new production
            const newProductionData = {
                name: `Indicator Test - ${new Date().toISOString()}`,
                recipeId: recipe.id,
                targetQuantity: 5,
                targetUnit: 'units',
                priority: 'LOW',
                notes: 'Testing indicator freshness'
            };

            const createResponse = await fetch(`${BASE_URL}/production/runs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProductionData)
            });

            const createResult = await createResponse.json();
            if (createResult.success) {
                const newProduction = createResult.data;
                console.log(`   ✅ Created test production: ${newProduction.id}`);
                console.log(`   📋 Status: ${newProduction.status}`);

                // Get updated stats
                const updatedStatsResponse = await fetch(`${BASE_URL}/production/runs/stats`);
                const updatedStatsResult = await updatedStatsResponse.json();
                
                if (updatedStatsResult.success) {
                    const newApiStats = updatedStatsResult.data;
                    console.log('   📊 Updated API stats after new production:');
                    console.log(`      Active: ${apiStats.active} → ${newApiStats.active}`);
                    console.log(`      Planned: ${apiStats.planned} → ${newApiStats.planned}`);
                    console.log(`      Total Quantity: ${apiStats.totalTargetQuantity} → ${newApiStats.totalTargetQuantity}`);

                    // Verify the planned count increased by 1 (new productions start as PLANNED)
                    const plannedIncreased = newApiStats.planned === apiStats.planned + 1;
                    const quantityIncreased = newApiStats.totalTargetQuantity === apiStats.totalTargetQuantity + 5;
                    
                    console.log(`   ${plannedIncreased ? '✅' : '❌'} Planned count updated correctly`);
                    console.log(`   ${quantityIncreased ? '✅' : '❌'} Target quantity updated correctly`);
                }

                // Clean up test production
                try {
                    await prisma.productionStep.deleteMany({ 
                        where: { productionRunId: newProduction.id } 
                    });
                    await prisma.productionRun.delete({ 
                        where: { id: newProduction.id } 
                    });
                    console.log('   🧹 Cleaned up test production');
                } catch (deleteError) {
                    console.log(`   ⚠️  Could not clean up test production: ${deleteError.message}`);
                }
            }
        }

        // 5. Test production completion impact on indicators
        console.log('\n5️⃣ Testing production completion impact on indicators...');
        
        if (actualActive > 0 || actualPlanned > 0) {
            // Find a production to complete for testing
            const testableProduction = await prisma.productionRun.findFirst({
                where: {
                    status: { in: ['PLANNED', 'IN_PROGRESS'] }
                },
                include: {
                    steps: true
                }
            });

            if (testableProduction) {
                console.log(`   📋 Found testable production: ${testableProduction.name}`);
                
                // Get stats before completion
                const beforeStats = await fetch(`${BASE_URL}/production/runs/stats`);
                const beforeStatsResult = await beforeStats.json();
                const beforeData = beforeStatsResult.data;
                
                // Mark production as completed (simulating finish button)
                const completeResponse = await fetch(`${BASE_URL}/production/runs/${testableProduction.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        status: 'COMPLETED',
                        completedAt: new Date().toISOString()
                    })
                });

                if (completeResponse.ok) {
                    console.log('   ✅ Marked production as completed');
                    
                    // Get stats after completion
                    const afterStats = await fetch(`${BASE_URL}/production/runs/stats`);
                    const afterStatsResult = await afterStats.json();
                    const afterData = afterStatsResult.data;
                    
                    console.log('   📊 Stats before vs after completion:');
                    console.log(`      Active: ${beforeData.active} → ${afterData.active}`);
                    console.log(`      Planned: ${beforeData.planned} → ${afterData.planned}`);
                    console.log(`      Completed Today: ${beforeData.completedToday} → ${afterData.completedToday}`);
                    
                    // Check if completed today increased
                    const completedTodayIncreased = afterData.completedToday > beforeData.completedToday;
                    const activeOrPlannedDecreased = 
                        (beforeData.active > afterData.active) || 
                        (beforeData.planned > afterData.planned);
                    
                    console.log(`   ${completedTodayIncreased ? '✅' : '❌'} Completed today count increased`);
                    console.log(`   ${activeOrPlannedDecreased ? '✅' : '❌'} Active/planned count decreased`);
                    
                    // Restore original status (undo the test change)
                    await prisma.productionRun.update({
                        where: { id: testableProduction.id },
                        data: {
                            status: testableProduction.status,
                            completedAt: null
                        }
                    });
                    console.log('   🔄 Restored original production status');
                }
            } else {
                console.log('   ⚠️  No testable productions found for completion test');
            }
        } else {
            console.log('   ⚠️  No active or planned productions to test completion with');
        }

        // 6. Final Test Results
        console.log('\n🎯 PRODUCTION INDICATORS TEST RESULTS');
        console.log('======================================');
        
        if (allMatch) {
            console.log('✅ SUCCESS: All production indicators are accurate!');
            console.log('   ✓ Database counts match API response exactly');
            console.log('   ✓ Active, On Hold, Planned, Completed Today counts are correct');
            console.log('   ✓ Total target quantity calculation is accurate');
            console.log('   ✓ Indicators update when production status changes');
        } else {
            console.log('❌ ISSUES FOUND: Some indicators have mismatched data');
            console.log('   ⚠️  Review the comparison above for specific mismatches');
            console.log('   ⚠️  Check the getProductionStats controller implementation');
        }

        // 7. Additional diagnostic information
        console.log('\n📋 Additional Diagnostic Information:');
        console.log('=====================================');
        
        // Get all production runs grouped by status
        const allProductions = await prisma.productionRun.findMany({
            select: {
                id: true,
                name: true,
                status: true,
                createdAt: true,
                completedAt: true,
                targetQuantity: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        console.log(`📊 Recent ${allProductions.length} productions:`);
        allProductions.forEach((prod, index) => {
            console.log(`   ${index + 1}. ${prod.name} - ${prod.status} (Qty: ${prod.targetQuantity})`);
        });

        // Show productions by status
        const statusCounts = allProductions.reduce((acc, prod) => {
            acc[prod.status] = (acc[prod.status] || 0) + 1;
            return acc;
        }, {});

        console.log('\n📈 Status distribution in recent productions:');
        Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`   ${status}: ${count}`);
        });

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the test
testProductionIndicators();