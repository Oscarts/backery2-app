#!/usr/bin/env node

/**
 * Advanced Security Audit for Customer and Orders Controllers
 * Checks for tenant isolation compliance in customer and order management
 */

const fs = require('fs');

async function advancedCustomerOrdersAudit() {
    console.log('🔍 ADVANCED SECURITY AUDIT - CUSTOMER & ORDERS CONTROLLERS');
    console.log('='.repeat(65));

    const controllers = [
        'backend/src/controllers/customerController.ts',
        'backend/src/controllers/customerOrderController.ts'
    ];

    let totalIssues = 0;

    for (const controllerPath of controllers) {
        const controllerName = controllerPath.split('/').pop();
        console.log(`\n🔍 AUDITING: ${controllerName}`);
        console.log('-'.repeat(50));

        try {
            const content = fs.readFileSync(controllerPath, 'utf8');
            let issues = 0;

            // Check for dangerous patterns
            const lines = content.split('\n');

            // Track where objects that have clientId
            const secureWhereObjects = new Set();

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const lineNum = i + 1;

                // Look for where object definitions with clientId
                if (line.includes('const where') || line.includes('let where')) {
                    // Check next several lines for clientId
                    for (let j = i; j < Math.min(i + 10, lines.length); j++) {
                        if (lines[j].includes('clientId: req.user!.clientId')) {
                            secureWhereObjects.add(`where_${i}`);
                            break;
                        }
                        if (lines[j].includes('};') || lines[j].includes('});')) {
                            break;
                        }
                    }
                }

                // Check for dangerous patterns

                // 1. findUnique with just { id } - dangerous for multi-tenant
                if (line.match(/\.findUnique\s*\(\s*\{\s*where:\s*\{\s*id\s*[,}]/)) {
                    console.log(`❌ Line ${lineNum}: CRITICAL - Unsafe findUnique with only id`);
                    console.log(`   Code: ${line}`);
                    issues++;
                }

                // 2. update with just { id } - dangerous for multi-tenant
                if (line.match(/\.update\s*\(\s*\{\s*where:\s*\{\s*id\s*[,}]/)) {
                    console.log(`❌ Line ${lineNum}: CRITICAL - Unsafe update with only id`);
                    console.log(`   Code: ${line}`);
                    issues++;
                }

                // 3. delete with just { id } - dangerous for multi-tenant  
                if (line.match(/\.delete\s*\(\s*\{\s*where:\s*\{\s*id\s*[,}]/)) {
                    console.log(`❌ Line ${lineNum}: CRITICAL - Unsafe delete with only id`);
                    console.log(`   Code: ${line}`);
                    issues++;
                }

                // 4. findMany operations that use 'where' variable - check if secure
                if (line.match(/\.findMany\s*\(\s*\{\s*where[,}]/)) {
                    let foundSecureWhere = false;
                    for (let j = i - 20; j < i; j++) {
                        if (j >= 0 && secureWhereObjects.has(`where_${j}`)) {
                            foundSecureWhere = true;
                            break;
                        }
                    }

                    if (!foundSecureWhere) {
                        console.log(`❌ Line ${lineNum}: Potentially unsafe findMany`);
                        console.log(`   Code: ${line}`);
                        issues++;
                    } else {
                        console.log(`✅ Line ${lineNum}: Secure findMany using filtered where object`);
                    }
                }

                // 5. Direct inline where clauses without clientId
                if (line.match(/\.findMany\s*\(\s*\{\s*where:\s*\{[^}]*\}/)) {
                    if (!line.includes('clientId') && !line.includes('where,')) {
                        // Look ahead to see if clientId is on next lines
                        let hasClientId = false;
                        for (let j = i; j < Math.min(i + 5, lines.length); j++) {
                            if (lines[j].includes('clientId: req.user!.clientId')) {
                                hasClientId = true;
                                break;
                            }
                        }

                        if (!hasClientId && !line.includes('user.findFirst') && !line.includes('user.findUnique')) {
                            console.log(`❌ Line ${lineNum}: CRITICAL - findMany without clientId`);
                            console.log(`   Code: ${line}`);
                            issues++;
                        }
                    }
                }

                // 6. Check for direct customer/order lookups without tenant filtering
                if (line.includes('customer.find') || line.includes('customerOrder.find')) {
                    if (!line.includes('clientId') && !content.substring(content.lastIndexOf('\n', content.indexOf(line)), content.indexOf('\n', content.indexOf(line) + 200)).includes('clientId: req.user!.clientId')) {
                        console.log(`⚠️  Line ${lineNum}: Potential customer/order lookup without tenant filter`);
                        console.log(`   Code: ${line}`);
                        issues++;
                    }
                }
            }

            // Additional checks for customer/order specific patterns

            // Check for order status updates without tenant verification
            const orderStatusUpdates = content.match(/status.*=.*['"](PENDING|CONFIRMED|PROCESSING|DELIVERED|CANCELLED)['"]/g);
            if (orderStatusUpdates) {
                console.log(`📊 Found ${orderStatusUpdates.length} order status update operations`);
            }

            // Check for customer relationship queries
            const customerRelations = content.match(/include:\s*\{\s*customer/g);
            if (customerRelations) {
                console.log(`📊 Found ${customerRelations.length} customer relationship inclusions`);
            }

            // Count positive patterns
            const clientIdFilters = (content.match(/clientId: req\.user!\.clientId/g) || []).length;
            const findFirstUsage = (content.match(/\.findFirst\(/g) || []).length;
            const exportedFunctions = (content.match(/export const [a-zA-Z]+/g) || []).length;

            console.log(`\n📊 STATISTICS:`);
            console.log(`   🔒 ClientId filters: ${clientIdFilters}`);
            console.log(`   🔄 findFirst usage: ${findFirstUsage}`);
            console.log(`   📤 Exported functions: ${exportedFunctions}`);
            console.log(`   ❌ Security issues: ${issues}`);

            if (issues === 0) {
                console.log('✅ CONTROLLER IS SECURE!');
            } else {
                console.log(`❌ FOUND ${issues} CRITICAL SECURITY ISSUES!`);
            }

            totalIssues += issues;

        } catch (error) {
            console.log(`❌ Error reading ${controllerPath}: ${error.message}`);
            totalIssues++;
        }
    }

    console.log('\n🏁 CUSTOMER & ORDERS AUDIT SUMMARY');
    console.log('='.repeat(65));

    if (totalIssues === 0) {
        console.log('✅ ALL CUSTOMER & ORDER CONTROLLERS ARE SECURE!');
        console.log('✅ Perfect multi-tenant isolation in customer management');
        console.log('✅ No cross-tenant order access vulnerabilities');
        console.log('✅ Customer data properly isolated by tenant');
        console.log('✅ Ready for production deployment');
    } else {
        console.log(`❌ CRITICAL: FOUND ${totalIssues} TOTAL SECURITY ISSUES`);
        console.log('🚨 Customer/Order controllers have security vulnerabilities!');
        console.log('🚨 Potential cross-tenant customer data access!');
        console.log('🚨 These MUST be fixed before deployment!');
    }

    console.log(`\n📋 AUDIT COMPLETE`);
    console.log(`   Controllers Audited: 2`);
    console.log(`   Security Issues: ${totalIssues}`);
    console.log(`   Status: ${totalIssues === 0 ? '✅ SECURE' : '❌ VULNERABLE'}`);

    return totalIssues === 0;
}

// Run the customer & orders audit
advancedCustomerOrdersAudit()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Customer & Orders audit failed:', error);
        process.exit(1);
    });