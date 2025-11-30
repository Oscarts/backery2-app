#!/usr/bin/env node

/**
 * Quick Verification - Permission System Ready
 * Checks if everything is set up correctly for production
 * Following CODE_GUIDELINES.md
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickVerification() {
    console.log('⚡ QUICK VERIFICATION - PERMISSION SYSTEM');
    console.log('='.repeat(60));

    const checks = [];

    try {
        // Check 1: Super Admin exists and has role
        const superadmin = await prisma.user.findUnique({
            where: { email: 'superadmin@system.local' },
            include: { customRole: { include: { permissions: true } } }
        });

        checks.push({
            name: 'Super Admin Setup',
            pass: superadmin && superadmin.roleId && superadmin.customRole.permissions.length === 45,
            details: superadmin ? `${superadmin.customRole.permissions.length} permissions` : 'Not found'
        });

        // Check 2: All clients have standard roles
        const clients = await prisma.client.count();
        const roles = await prisma.role.count();
        const expectedRoles = (clients - 1) * 4 + 1; // 4 roles per client (except System has 1)

        checks.push({
            name: 'Standard Roles Created',
            pass: roles >= expectedRoles,
            details: `${roles} roles for ${clients} clients`
        });

        // Check 3: All users have roles
        const usersWithoutRoles = await prisma.user.count({ where: { roleId: null } });

        checks.push({
            name: 'All Users Have Roles',
            pass: usersWithoutRoles === 0,
            details: usersWithoutRoles === 0 ? 'All assigned' : `${usersWithoutRoles} missing`
        });

        // Check 4: Permissions exist
        const permissions = await prisma.permission.count();

        checks.push({
            name: 'Permissions Created',
            pass: permissions === 45,
            details: `${permissions}/45 permissions`
        });

        // Check 5: Multi-tenant data isolation
        const clientData = await prisma.client.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        roles: true,
                        categories: true
                    }
                }
            }
        });

        const allHaveData = clientData.every(c => c._count.users > 0 && c._count.roles > 0);

        checks.push({
            name: 'Multi-Tenant Data',
            pass: allHaveData,
            details: `${clientData.length} clients with data`
        });

        // Display results
        console.log('\n📋 Verification Checks:\n');

        checks.forEach((check, i) => {
            const icon = check.pass ? '✅' : '❌';
            console.log(`${icon} ${check.name}`);
            console.log(`   ${check.details}\n`);
        });

        const allPassed = checks.every(c => c.pass);

        console.log('='.repeat(60));

        if (allPassed) {
            console.log('✅ ALL CHECKS PASSED - SYSTEM READY!\n');
            console.log('🎯 Next Steps:');
            console.log('   1. Start dev server: npm run dev');
            console.log('   2. Run API tests: node test-api-permissions.js');
            console.log('   3. Login as: superadmin@system.local / superadmin123');
            console.log('   4. Access clients page - should work now!\n');
            console.log('📊 Available Users:');

            const users = await prisma.user.findMany({
                include: { customRole: true, client: true }
            });

            users.forEach(u => {
                console.log(`   • ${u.email}`);
                console.log(`     → ${u.customRole?.name || 'NO ROLE'} @ ${u.client.name}`);
            });

        } else {
            console.log('⚠️  SOME CHECKS FAILED\n');
            console.log('Run setup scripts:');
            console.log('   node setup-superadmin-role.js');
            console.log('   node setup-saas-roles.js\n');
        }

    } catch (error) {
        console.error('💥 Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

quickVerification();
