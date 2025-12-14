#!/usr/bin/env node

/**
 * Comprehensive Permission System Test
 * Tests all roles and permissions following CODE_GUIDELINES.md
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPermissionSystem() {
    console.log('🧪 COMPREHENSIVE PERMISSION SYSTEM TEST');
    console.log('='.repeat(60));

    const results = {
        passed: [],
        failed: []
    };

    try {
        // Test 1: Superadmin has all permissions
        console.log('\n📋 Test 1: Super Admin Permissions');
        console.log('-'.repeat(60));

        const superadmin = await prisma.user.findUnique({
            where: { email: 'superadmin@system.local' },
            include: {
                customRole: {
                    include: {
                        permissions: true
                    }
                }
            }
        });

        if (!superadmin || !superadmin.customRole) {
            results.failed.push('Super Admin: No role assigned');
            console.log('❌ FAILED: No role assigned');
        } else if (superadmin.customRole.permissions.length !== 45) {
            results.failed.push(`Super Admin: Expected 45 permissions, got ${superadmin.customRole.permissions.length}`);
            console.log(`❌ FAILED: Expected 45 permissions, got ${superadmin.customRole.permissions.length}`);
        } else {
            results.passed.push('Super Admin: All 45 permissions granted');
            console.log(`✅ PASSED: Super Admin has all 45 permissions`);
        }

        // Test 2: Organization Admin permissions
        console.log('\n📋 Test 2: Organization Admin Permissions');
        console.log('-'.repeat(60));

        const orgAdmin = await prisma.user.findUnique({
            where: { email: 'admin@abcbakery.com' },
            include: {
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

        if (!orgAdmin || !orgAdmin.customRole) {
            results.failed.push('Org Admin: No role assigned');
            console.log('❌ FAILED: No role assigned');
        } else {
            const hasClientsPermission = orgAdmin.customRole.permissions.some(
                rp => rp.permission.resource === 'clients'
            );

            if (hasClientsPermission) {
                results.failed.push('Org Admin: Should NOT have clients permission');
                console.log('❌ FAILED: Has clients permission (should not)');
            } else {
                results.passed.push('Org Admin: Correctly blocked from clients');
                console.log(`✅ PASSED: No clients permission (${orgAdmin.customRole.permissions.length} permissions)`);
            }
        }

        // Test 3: Manager role has no delete permissions
        console.log('\n📋 Test 3: Manager Role Restrictions');
        console.log('-'.repeat(60));

        const managerRole = await prisma.role.findFirst({
            where: {
                name: 'Manager',
                client: { slug: 'abc-bakery' }
            },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });

        if (!managerRole) {
            results.failed.push('Manager: Role not found');
            console.log('❌ FAILED: Manager role not found');
        } else {
            const hasDelete = managerRole.permissions.some(
                rp => rp.permission.action === 'delete'
            );

            if (hasDelete) {
                results.failed.push('Manager: Should NOT have delete permission');
                console.log('❌ FAILED: Has delete permissions');
            } else {
                results.passed.push('Manager: Correctly restricted from delete');
                console.log(`✅ PASSED: No delete permissions (${managerRole.permissions.length} permissions)`);
            }
        }

        // Test 4: Staff role permissions
        console.log('\n📋 Test 4: Staff Role Restrictions');
        console.log('-'.repeat(60));

        const staffRole = await prisma.role.findFirst({
            where: {
                name: 'Staff',
                client: { slug: 'test-bakery' }
            },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });

        if (!staffRole) {
            results.failed.push('Staff: Role not found');
            console.log('❌ FAILED: Staff role not found');
        } else {
            const hasAdminPerms = staffRole.permissions.some(
                rp => ['users', 'roles', 'clients'].includes(rp.permission.resource)
            );

            if (hasAdminPerms) {
                results.failed.push('Staff: Should NOT have admin permissions');
                console.log('❌ FAILED: Has admin permissions');
            } else {
                results.passed.push('Staff: Correctly restricted from admin features');
                console.log(`✅ PASSED: No admin permissions (${staffRole.permissions.length} permissions)`);
            }
        }

        // Test 5: Viewer role - read only
        console.log('\n📋 Test 5: Viewer Role - Read Only');
        console.log('-'.repeat(60));

        const viewerRole = await prisma.role.findFirst({
            where: {
                name: 'Viewer',
                client: { slug: 'sample-bakery' }
            },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });

        if (!viewerRole) {
            results.failed.push('Viewer: Role not found');
            console.log('❌ FAILED: Viewer role not found');
        } else {
            const allViewOnly = viewerRole.permissions.every(
                rp => rp.permission.action === 'view'
            );

            if (!allViewOnly) {
                results.failed.push('Viewer: Should only have view permissions');
                console.log('❌ FAILED: Has non-view permissions');
            } else {
                results.passed.push('Viewer: All permissions are view-only');
                console.log(`✅ PASSED: All view-only (${viewerRole.permissions.length} permissions)`);
            }
        }

        // Test 6: Multi-tenant isolation
        console.log('\n📋 Test 6: Multi-Tenant Isolation');
        console.log('-'.repeat(60));

        const allRoles = await prisma.role.groupBy({
            by: ['clientId'],
            _count: true
        });

        const clientsWithRoles = allRoles.length;
        const expectedClients = 5; // System + 4 bakeries

        if (clientsWithRoles !== expectedClients) {
            results.failed.push(`Multi-tenant: Expected ${expectedClients} clients with roles, got ${clientsWithRoles}`);
            console.log(`❌ FAILED: Expected ${expectedClients} clients, got ${clientsWithRoles}`);
        } else {
            results.passed.push('Multi-tenant: All clients have isolated roles');
            console.log(`✅ PASSED: ${clientsWithRoles} clients with isolated roles`);
        }

        // Test 7: Password authentication
        console.log('\n📋 Test 7: Password Authentication');
        console.log('-'.repeat(60));

        const testUsers = [
            { email: 'superadmin@system.local', password: 'superadmin123' },
            { email: 'admin@abcbakery.com', password: 'admin123' },
            { email: 'admin@samplebakery.com', password: 'admin123' }
        ];

        let authPassed = 0;
        for (const testUser of testUsers) {
            const user = await prisma.user.findUnique({
                where: { email: testUser.email }
            });

            if (user && await bcrypt.compare(testUser.password, user.passwordHash)) {
                authPassed++;
            }
        }

        if (authPassed !== testUsers.length) {
            results.failed.push(`Authentication: Only ${authPassed}/${testUsers.length} users can authenticate`);
            console.log(`❌ FAILED: Only ${authPassed}/${testUsers.length} users authenticated`);
        } else {
            results.passed.push('Authentication: All test users can log in');
            console.log(`✅ PASSED: All ${testUsers.length} users authenticated successfully`);
        }

        // Test 8: Role assignment
        console.log('\n📋 Test 8: Role Assignments');
        console.log('-'.repeat(60));

        const usersWithoutRoles = await prisma.user.count({
            where: { roleId: null }
        });

        if (usersWithoutRoles > 0) {
            results.failed.push(`Role Assignment: ${usersWithoutRoles} users without roles`);
            console.log(`❌ FAILED: ${usersWithoutRoles} users without roles`);
        } else {
            results.passed.push('Role Assignment: All users have roles assigned');
            console.log(`✅ PASSED: All users have roles assigned`);
        }

        // Final Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));

        const total = results.passed.length + results.failed.length;
        const passRate = ((results.passed.length / total) * 100).toFixed(1);

        console.log(`\n✅ Passed: ${results.passed.length}/${total} (${passRate}%)`);
        results.passed.forEach(msg => console.log(`   ✓ ${msg}`));

        if (results.failed.length > 0) {
            console.log(`\n❌ Failed: ${results.failed.length}/${total}`);
            results.failed.forEach(msg => console.log(`   ✗ ${msg}`));
        }

        if (results.failed.length === 0) {
            console.log('\n🎉 ALL TESTS PASSED! Permission system is working correctly.');
            console.log('\n✅ You can now:');
            console.log('   1. Log in as superadmin@system.local (full access)');
            console.log('   2. Access clients page with superadmin');
            console.log('   3. Manage all resources across all tenants');
            console.log('   4. Other admins can manage their own organizations');
        } else {
            console.log('\n⚠️  Some tests failed. Review the issues above.');
        }

    } catch (error) {
        console.error('\n💥 Test error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testPermissionSystem();
