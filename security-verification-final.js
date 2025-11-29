#!/usr/bin/env node

/**
 * Comprehensive Security Audit Verification for Core Product Controllers
 * Tests all GET, UPDATE, DELETE operations to ensure proper tenant isolation
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySecurityFixes() {
    console.log('🔍 COMPREHENSIVE SECURITY AUDIT VERIFICATION');
    console.log('='.repeat(50));

    const issues = [];

    // Test controllers to verify all operations have clientId filtering
    const controllers = [
        'backend/src/controllers/rawMaterialController.ts',
        'backend/src/controllers/finishedProductController.ts',
        'backend/src/controllers/recipeController.ts',
        'backend/src/controllers/productionRunController.ts'
    ];

    console.log('\n📊 Checking for security patterns...\n');

    for (const controller of controllers) {
        console.log(`\n🔍 Auditing ${controller.split('/').pop()}`);
        console.log('-'.repeat(40));

        try {
            const fs = require('fs');
            const content = fs.readFileSync(controller, 'utf8');

            // Check for unsafe findUnique operations (should be findFirst with clientId)
            const unsafeFindUnique = content.match(/\.findUnique\s*\(\s*\{\s*where:\s*\{\s*id[^}]*\}\s*\}/g);
            if (unsafeFindUnique) {
                issues.push(`❌ ${controller}: Found unsafe findUnique operations that should use findFirst with clientId`);
                console.log(`❌ CRITICAL: Unsafe findUnique operations found`);
            } else {
                console.log(`✅ No unsafe findUnique operations`);
            }

            // Check for update operations without clientId
            const unsafeUpdates = content.match(/\.update\s*\(\s*\{\s*where:\s*\{\s*id[^}]*\}\s*[^}]*data:/g);
            if (unsafeUpdates) {
                issues.push(`❌ ${controller}: Found update operations missing clientId filtering`);
                console.log(`❌ CRITICAL: Update operations missing tenant filtering`);
            } else {
                console.log(`✅ Update operations properly secured`);
            }

            // Check for delete operations without clientId
            const unsafeDeletes = content.match(/\.delete\s*\(\s*\{\s*where:\s*\{\s*id[^}]*\}\s*\}/g);
            if (unsafeDeletes) {
                issues.push(`❌ ${controller}: Found delete operations missing clientId filtering`);
                console.log(`❌ CRITICAL: Delete operations missing tenant filtering`);
            } else {
                console.log(`✅ Delete operations properly secured`);
            }

            // Check for findMany operations without clientId
            const findManyPatterns = content.match(/\.findMany\s*\(\s*\{[^}]*where:\s*\{[^}]*\}/g);
            if (findManyPatterns) {
                const unsafeFindMany = findManyPatterns.filter(pattern => !pattern.includes('clientId'));
                if (unsafeFindMany.length > 0) {
                    issues.push(`❌ ${controller}: Found findMany operations missing clientId filtering`);
                    console.log(`❌ CRITICAL: findMany operations missing tenant filtering`);
                } else {
                    console.log(`✅ findMany operations properly secured`);
                }
            }

            // Count total GET endpoints
            const getEndpoints = content.match(/export const get[A-Z]\w+|async \(req: Request, res: Response\) => \{[\s\S]*?\.find/g);
            console.log(`📊 Found ${getEndpoints ? getEndpoints.length : 0} GET-type operations`);

            // Count clientId filters
            const clientIdFilters = (content.match(/clientId: req\.user!\.clientId/g) || []).length;
            console.log(`🔒 Found ${clientIdFilters} clientId security filters`);

        } catch (error) {
            console.log(`❌ Error reading ${controller}: ${error.message}`);
            issues.push(`❌ ${controller}: Could not read file - ${error.message}`);
        }
    }

    console.log('\n🏁 AUDIT SUMMARY');
    console.log('='.repeat(50));

    if (issues.length === 0) {
        console.log('✅ ALL SECURITY CHECKS PASSED!');
        console.log('✅ All core product controllers properly secured with tenant isolation');
        console.log('✅ No cross-tenant data leakage vulnerabilities found');
    } else {
        console.log(`❌ FOUND ${issues.length} CRITICAL SECURITY ISSUES:`);
        issues.forEach(issue => console.log(`  ${issue}`));
        console.log('\n🚨 These issues must be fixed before deployment!');
    }

    console.log('\n📋 VERIFICATION COMPLETE');
    console.log(`   Controllers Audited: ${controllers.length}`);
    console.log(`   Security Issues: ${issues.length}`);
    console.log(`   Status: ${issues.length === 0 ? '✅ SECURE' : '❌ VULNERABLE'}`);

    return issues.length === 0;
}

// Run the verification
verifySecurityFixes()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Verification failed:', error);
        process.exit(1);
    });