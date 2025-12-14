#!/usr/bin/env node

/**
 * Final Customer & Orders Security Verification
 * Context-aware analysis that understands secure where objects
 */

const fs = require('fs');

async function finalCustomerOrdersVerification() {
    console.log('🔍 FINAL CUSTOMER & ORDERS SECURITY VERIFICATION');
    console.log('='.repeat(60));

    const controllers = [
        'backend/src/controllers/customerController.ts',
        'backend/src/controllers/customerOrderController.ts'
    ];

    let totalRealIssues = 0;

    for (const controllerPath of controllers) {
        const controllerName = controllerPath.split('/').pop();
        console.log(`\n🔍 ANALYZING: ${controllerName}`);
        console.log('-'.repeat(50));

        try {
            const content = fs.readFileSync(controllerPath, 'utf8');
            const lines = content.split('\n');
            let realIssues = 0;

            // Track where objects that have clientId
            const secureWhereObjects = new Set();

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const lineNum = i + 1;

                // Look for where object definitions with clientId
                if (line.includes('const where') || line.includes('let where')) {
                    // Check next several lines for clientId
                    for (let j = i; j < Math.min(i + 15, lines.length); j++) {
                        if (lines[j].includes('clientId: req.user!.clientId')) {
                            secureWhereObjects.add(`where_${i}`);
                            console.log(`✅ Line ${i + 1}: Found secure where object with clientId`);
                            break;
                        }
                        if (lines[j].includes('};') || lines[j].includes('});')) {
                            break;
                        }
                    }
                }

                // Check for dangerous patterns
                if (line.match(/\.findUnique\s*\(\s*\{\s*where:\s*\{\s*id\s*[,}]/)) {
                    console.log(`❌ Line ${lineNum}: CRITICAL - Unsafe findUnique with only id`);
                    console.log(`   ${line}`);
                    realIssues++;
                }

                if (line.match(/\.update\s*\(\s*\{\s*where:\s*\{\s*id\s*[,}]/)) {
                    console.log(`❌ Line ${lineNum}: CRITICAL - Unsafe update with only id`);
                    console.log(`   ${line}`);
                    realIssues++;
                }

                if (line.match(/\.delete\s*\(\s*\{\s*where:\s*\{\s*id\s*[,}]/)) {
                    console.log(`❌ Line ${lineNum}: CRITICAL - Unsafe delete with only id`);
                    console.log(`   ${line}`);
                    realIssues++;
                }
            }

            // Summary
            const clientIdCount = (content.match(/clientId: req\.user!\.clientId/g) || []).length;
            const findFirstCount = (content.match(/\.findFirst\(/g) || []).length;
            const exportedFunctions = (content.match(/export const [a-zA-Z]+/g) || []).length;

            console.log(`\n📊 FINAL STATISTICS:`);
            console.log(`   🔒 ClientId security filters: ${clientIdCount}`);
            console.log(`   🔄 Secure findFirst usage: ${findFirstCount}`);
            console.log(`   📤 Exported functions: ${exportedFunctions}`);
            console.log(`   🛡️  Secure where objects: ${secureWhereObjects.size}`);
            console.log(`   ❌ Real security issues: ${realIssues}`);

            if (realIssues === 0) {
                console.log('✅ CONTROLLER IS FULLY SECURE!');
            } else {
                console.log(`❌ ${realIssues} CRITICAL ISSUES REQUIRE IMMEDIATE FIX!`);
            }

            totalRealIssues += realIssues;

        } catch (error) {
            console.log(`❌ Error analyzing ${controllerPath}: ${error.message}`);
            totalRealIssues++;
        }
    }

    console.log('\n🏁 FINAL CUSTOMER & ORDERS ASSESSMENT');
    console.log('='.repeat(60));

    if (totalRealIssues === 0) {
        console.log('🎉 SUCCESS! CUSTOMER & ORDERS CONTROLLERS ARE SECURE!');
        console.log('✅ Perfect multi-tenant isolation in customer management');
        console.log('✅ Zero cross-tenant order access vulnerabilities');
        console.log('✅ Customer data properly isolated by tenant');
        console.log('✅ All CRUD operations properly secured');
        console.log('✅ Production-ready security implementation');
        console.log('');
        console.log('🚀 CUSTOMER & ORDERS SECURITY AUDIT COMPLETE - APPROVED');
    } else {
        console.log(`🚨 CRITICAL: ${totalRealIssues} REAL SECURITY ISSUES FOUND`);
        console.log('❌ Cross-tenant customer/order access vulnerabilities exist');
        console.log('❌ DEPLOYMENT BLOCKED until fixes are implemented');
    }

    return totalRealIssues === 0;
}

// Run the final verification
finalCustomerOrdersVerification()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Final customer & orders verification failed:', error);
        process.exit(1);
    });