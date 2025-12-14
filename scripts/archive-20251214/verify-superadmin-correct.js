#!/usr/bin/env node

/**
 * Verify Super Admin has correct permissions following CODE_GUIDELINES.md
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySuperAdmin() {
    console.log('🔍 VERIFYING SUPER ADMIN PERMISSIONS');
    console.log('='.repeat(60));

    try {
        // Get superadmin user
        const superadmin = await prisma.user.findUnique({
            where: { email: 'superadmin@system.local' },
            include: {
                client: true,
                customRole: {
                    include: {
                        permissions: {
                            include: { permission: true }
                        }
                    }
                }
            }
        });

        if (!superadmin) {
            console.log('❌ Superadmin user not found');
            return;
        }

        console.log('✅ Super Admin User Found:');
        console.log(`   Email: ${superadmin.email}`);
        console.log(`   Client: ${superadmin.client.name}`);
        console.log(`   Role: ${superadmin.customRole?.name || 'NONE'}`);

        if (!superadmin.customRole) {
            console.log('\n❌ ERROR: Superadmin has no role assigned!');
            return;
        }

        const permissions = superadmin.customRole.permissions.map(rp =>
            `${rp.permission.resource}:${rp.permission.action}`
        );

        console.log(`\n📊 Current Permissions: ${permissions.length}`);

        // Expected permissions
        const expectedPermissions = [
            'clients:view',
            'clients:create',
            'clients:edit',
            'clients:delete',
            'roles:view',
            'roles:create',
            'roles:edit',
            'roles:delete',
            'permissions:view'
        ];

        console.log('\n✅ Expected Permissions (9):');
        expectedPermissions.forEach(p => {
            const has = permissions.includes(p);
            console.log(`   ${has ? '✅' : '❌'} ${p}`);
        });

        // Check for WRONG permissions (bakery operations)
        const wrongPermissions = permissions.filter(p =>
            !expectedPermissions.includes(p)
        );

        if (wrongPermissions.length > 0) {
            console.log('\n❌ INCORRECT PERMISSIONS FOUND:');
            wrongPermissions.forEach(p => console.log(`   ❌ ${p}`));
        }

        // Final verdict
        const hasAllCorrect = expectedPermissions.every(p => permissions.includes(p));
        const hasNoWrong = wrongPermissions.length === 0;
        const hasCorrectCount = permissions.length === 9;

        console.log('\n' + '='.repeat(60));
        if (hasAllCorrect && hasNoWrong && hasCorrectCount) {
            console.log('✅ VERIFICATION PASSED!');
            console.log('Super Admin has exactly the correct 9 permissions.');
            console.log('\nSuper Admin can manage:');
            console.log('   ✅ Clients (create/manage bakery clients)');
            console.log('   ✅ Roles (create/edit role templates)');
            console.log('   ✅ Permissions (view available permissions)');
            console.log('\nSuper Admin CANNOT access:');
            console.log('   ❌ Bakery operations (raw-materials, recipes, production)');
            console.log('   ❌ Customer data');
            console.log('   ❌ Dashboard/Reports');
        } else {
            console.log('❌ VERIFICATION FAILED!');
            if (!hasCorrectCount) {
                console.log(`   Expected 9 permissions, got ${permissions.length}`);
            }
            if (!hasAllCorrect) {
                console.log('   Missing some required permissions');
            }
            if (!hasNoWrong) {
                console.log(`   Has ${wrongPermissions.length} incorrect permissions`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

verifySuperAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
