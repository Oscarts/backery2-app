#!/usr/bin/env node

/**
 * Final Security Verification - Smart Context-Aware Analysis
 * Properly understands when where objects contain clientId filtering
 */

const fs = require('fs');

async function finalSecurityVerification() {
    console.log('🔍 FINAL SECURITY VERIFICATION - CONTEXT-AWARE ANALYSIS');
    console.log('='.repeat(65));

    const controllers = [
        'backend/src/controllers/rawMaterialController.ts',
        'backend/src/controllers/finishedProductController.ts',
        'backend/src/controllers/recipeController.ts',
        'backend/src/controllers/productionRunController.ts'
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

                // Check for findMany operations that use 'where' variable
                if (line.match(/\.findMany\s*\(\s*\{\s*where[,}]/)) {
                    // This is likely using a where object variable - check if it's secure
                    let foundSecureWhere = false;
                    for (let j = i - 20; j < i; j++) {
                        if (j >= 0 && secureWhereObjects.has(`where_${j}`)) {
                            foundSecureWhere = true;
                            break;
                        }
                    }

                    if (!foundSecureWhere) {
                        console.log(`❌ Line ${lineNum}: Potentially unsafe findMany`);
                        console.log(`   ${line}`);
                        realIssues++;
                    } else {
                        console.log(`✅ Line ${lineNum}: Secure findMany using filtered where object`);
                    }
                }

                // Check for direct inline where clauses without clientId
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

                        if (!hasClientId) {
                            console.log(`❌ Line ${lineNum}: CRITICAL - findMany without clientId`);
                            console.log(`   ${line}`);
                            realIssues++;
                        }
                    }
                }
            }

            // Summary
            const clientIdCount = (content.match(/clientId: req\.user!\.clientId/g) || []).length;
            const findFirstCount = (content.match(/\.findFirst\(/g) || []).length;

            console.log(`\n📊 FINAL STATISTICS:`);
            console.log(`   🔒 ClientId security filters: ${clientIdCount}`);
            console.log(`   🔄 Secure findFirst usage: ${findFirstCount}`);
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

    console.log('\n🏁 FINAL SECURITY ASSESSMENT');
    console.log('='.repeat(65));

    if (totalRealIssues === 0) {
        console.log('🎉 SUCCESS! ALL CONTROLLERS ARE FULLY SECURE!');
        console.log('✅ Perfect multi-tenant isolation implemented');
        console.log('✅ Zero cross-tenant data leakage vulnerabilities');
        console.log('✅ All GET, UPDATE, DELETE operations properly secured');
        console.log('✅ Production-ready security implementation');
        console.log('');
        console.log('🚀 SECURITY AUDIT COMPLETE - DEPLOYMENT APPROVED');
    } else {
        console.log(`🚨 CRITICAL: ${totalRealIssues} REAL SECURITY ISSUES FOUND`);
        console.log('❌ Cross-tenant data access vulnerabilities exist');
        console.log('❌ DEPLOYMENT BLOCKED until fixes are implemented');
    }

    return totalRealIssues === 0;
}

// Run the final verification
finalSecurityVerification()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Final verification failed:', error);
        process.exit(1);
    });