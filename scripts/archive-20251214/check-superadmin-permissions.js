#!/usr/bin/env node

/**
 * Check current state of superadmin permissions
 * Following CODE_GUIDELINES.md - verify current state first
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSuperadminState() {
    console.log('🔍 CHECKING SUPERADMIN STATE');
    console.log('='.repeat(60));

    try {
        // 1. Check superadmin user
        const superadmin = await prisma.user.findUnique({
            where: { email: 'superadmin@system.local' },
            include: {
                client: true,
                customRole: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            }
        });

        if (!superadmin) {
            console.log('❌ Superadmin user not found');
            return;
        }

        console.log('\n📧 Superadmin User:');
        console.log(`   Email: ${superadmin.email}`);
        console.log(`   Role: ${superadmin.role}`);
        console.log(`   RoleId: ${superadmin.roleId || 'NULL'}`);
        console.log(`   Client: ${superadmin.client.name}`);
        console.log(`   CustomRole: ${superadmin.customRole ? superadmin.customRole.name : 'NULL'}`);

        if (superadmin.customRole) {
            console.log('\n🔑 Current Permissions:');
            superadmin.customRole.permissions.forEach(rp => {
                console.log(`   - ${rp.permission.resource}:${rp.permission.action}`);
            });
        } else {
            console.log('\n⚠️  NO CUSTOM ROLE - User has no permissions!');
        }

        // 2. Check available permissions
        const allPermissions = await prisma.permission.findMany({
            orderBy: [
                { resource: 'asc' },
                { action: 'asc' }
            ]
        });

        console.log('\n📋 Available Permissions in System:');
        const byResource = {};
        allPermissions.forEach(p => {
            if (!byResource[p.resource]) byResource[p.resource] = [];
            byResource[p.resource].push(p.action);
        });

        Object.keys(byResource).sort().forEach(resource => {
            console.log(`   ${resource}: ${byResource[resource].join(', ')}`);
        });

        // 3. Check existing roles
        const roles = await prisma.role.findMany({
            where: { clientId: superadmin.clientId },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });

        console.log(`\n👥 Existing Roles for ${superadmin.client.name}:`);
        if (roles.length === 0) {
            console.log('   No roles found');
        } else {
            roles.forEach(role => {
                console.log(`   - ${role.name} (${role.permissions.length} permissions)`);
            });
        }

        // 4. Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 DIAGNOSIS:');
        console.log('='.repeat(60));

        if (!superadmin.roleId) {
            console.log('❌ PROBLEM: Superadmin has no roleId');
            console.log('   This means they have zero permissions');
            console.log('\n💡 SOLUTION NEEDED:');
            console.log('   1. Create a "Super Admin" role with all permissions');
            console.log('   2. Assign this role to superadmin@system.local');
        } else if (superadmin.customRole && superadmin.customRole.permissions.length === 0) {
            console.log('❌ PROBLEM: Superadmin role has no permissions');
            console.log('\n💡 SOLUTION NEEDED:');
            console.log('   1. Add permissions to the existing role');
        } else if (superadmin.customRole) {
            console.log('✅ Superadmin has a role with permissions');
            const hasClientsView = superadmin.customRole.permissions.some(
                rp => rp.permission.resource === 'clients' && rp.permission.action === 'view'
            );
            if (!hasClientsView) {
                console.log('❌ PROBLEM: Missing clients:view permission');
                console.log('\n💡 SOLUTION NEEDED:');
                console.log('   1. Add clients:view permission to role');
            }
        }

    } catch (error) {
        console.error('💥 Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkSuperadminState();
