#!/usr/bin/env node

/**
 * Create missing role templates in System client
 * Following CODE_GUIDELINES.md and ROLE_TEMPLATE_SYSTEM_COMPLETE.md
 * 
 * Standard templates:
 * 1. Admin (33 permissions) - Full bakery operations
 * 2. Sales Manager (14 permissions) - Customers and orders
 * 3. Inventory Manager (12 permissions) - Inventory management
 * 4. Production Manager (12 permissions) - Production and recipes
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMissingTemplates() {
    console.log('🎨 CREATING MISSING ROLE TEMPLATES');
    console.log('='.repeat(60));
    
    try {
        // Get System client
        const systemClient = await prisma.client.findFirst({
            where: { slug: 'system' }
        });
        
        if (!systemClient) {
            console.log('❌ System client not found');
            return;
        }
        
        console.log(`✅ Found System client: ${systemClient.name}`);
        
        // Define template roles with their permissions
        const roleTemplates = [
            {
                name: 'Admin',
                description: 'Full access to all bakery operations and settings',
                permissions: [
                    // Dashboard
                    { resource: 'dashboard', action: 'view' },
                    // Raw Materials
                    { resource: 'raw-materials', action: 'view' },
                    { resource: 'raw-materials', action: 'create' },
                    { resource: 'raw-materials', action: 'edit' },
                    { resource: 'raw-materials', action: 'delete' },
                    // Finished Products
                    { resource: 'finished-products', action: 'view' },
                    { resource: 'finished-products', action: 'create' },
                    { resource: 'finished-products', action: 'edit' },
                    { resource: 'finished-products', action: 'delete' },
                    // Recipes
                    { resource: 'recipes', action: 'view' },
                    { resource: 'recipes', action: 'create' },
                    { resource: 'recipes', action: 'edit' },
                    { resource: 'recipes', action: 'delete' },
                    // Production
                    { resource: 'production', action: 'view' },
                    { resource: 'production', action: 'create' },
                    { resource: 'production', action: 'edit' },
                    { resource: 'production', action: 'delete' },
                    // Customers
                    { resource: 'customers', action: 'view' },
                    { resource: 'customers', action: 'create' },
                    { resource: 'customers', action: 'edit' },
                    { resource: 'customers', action: 'delete' },
                    // Customer Orders
                    { resource: 'customer-orders', action: 'view' },
                    { resource: 'customer-orders', action: 'create' },
                    { resource: 'customer-orders', action: 'edit' },
                    { resource: 'customer-orders', action: 'delete' },
                    // Settings
                    { resource: 'settings', action: 'view' },
                    { resource: 'settings', action: 'edit' },
                    // Users
                    { resource: 'users', action: 'view' },
                    { resource: 'users', action: 'create' },
                    { resource: 'users', action: 'edit' },
                    { resource: 'users', action: 'delete' },
                    // Roles (view only for seeing dropdown)
                    { resource: 'roles', action: 'view' },
                    // Reports
                    { resource: 'reports', action: 'view' },
                ],
            },
            {
                name: 'Sales Manager',
                description: 'Manage customers, orders, and view inventory',
                permissions: [
                    // Dashboard
                    { resource: 'dashboard', action: 'view' },
                    // Raw Materials (view only)
                    { resource: 'raw-materials', action: 'view' },
                    // Finished Products (view only)
                    { resource: 'finished-products', action: 'view' },
                    // Recipes (view only)
                    { resource: 'recipes', action: 'view' },
                    // Production (view only)
                    { resource: 'production', action: 'view' },
                    // Customers (full access)
                    { resource: 'customers', action: 'view' },
                    { resource: 'customers', action: 'create' },
                    { resource: 'customers', action: 'edit' },
                    { resource: 'customers', action: 'delete' },
                    // Customer Orders (full access)
                    { resource: 'customer-orders', action: 'view' },
                    { resource: 'customer-orders', action: 'create' },
                    { resource: 'customer-orders', action: 'edit' },
                    { resource: 'customer-orders', action: 'delete' },
                    // Reports
                    { resource: 'reports', action: 'view' },
                ],
            },
            {
                name: 'Inventory Manager',
                description: 'Manage raw materials and finished products inventory',
                permissions: [
                    // Dashboard
                    { resource: 'dashboard', action: 'view' },
                    // Raw Materials (full access)
                    { resource: 'raw-materials', action: 'view' },
                    { resource: 'raw-materials', action: 'create' },
                    { resource: 'raw-materials', action: 'edit' },
                    { resource: 'raw-materials', action: 'delete' },
                    // Finished Products (full access)
                    { resource: 'finished-products', action: 'view' },
                    { resource: 'finished-products', action: 'create' },
                    { resource: 'finished-products', action: 'edit' },
                    { resource: 'finished-products', action: 'delete' },
                    // Recipes (view only)
                    { resource: 'recipes', action: 'view' },
                    // Production (view only)
                    { resource: 'production', action: 'view' },
                    // Reports
                    { resource: 'reports', action: 'view' },
                ],
            },
            {
                name: 'Production Manager',
                description: 'Manage production, recipes, and view inventory',
                permissions: [
                    // Dashboard
                    { resource: 'dashboard', action: 'view' },
                    // Raw Materials (view only)
                    { resource: 'raw-materials', action: 'view' },
                    // Finished Products (view only)
                    { resource: 'finished-products', action: 'view' },
                    // Recipes (full access)
                    { resource: 'recipes', action: 'view' },
                    { resource: 'recipes', action: 'create' },
                    { resource: 'recipes', action: 'edit' },
                    { resource: 'recipes', action: 'delete' },
                    // Production (full access)
                    { resource: 'production', action: 'view' },
                    { resource: 'production', action: 'create' },
                    { resource: 'production', action: 'edit' },
                    { resource: 'production', action: 'delete' },
                    // Reports
                    { resource: 'reports', action: 'view' },
                ],
            },
        ];
        
        console.log(`\n📋 Processing ${roleTemplates.length} role templates...\n`);
        
        let created = 0;
        let updated = 0;
        let skipped = 0;
        
        for (const template of roleTemplates) {
            // Check if template already exists
            const existingRole = await prisma.role.findFirst({
                where: {
                    name: template.name,
                    clientId: systemClient.id
                },
                include: {
                    permissions: true
                }
            });
            
            if (existingRole && existingRole.permissions.length === template.permissions.length) {
                console.log(`⏭️  ${template.name}: Already exists with ${template.permissions.length} permissions`);
                skipped++;
                continue;
            }
            
            // Create or update role
            let role;
            if (existingRole) {
                // Delete old permissions
                await prisma.rolePermission.deleteMany({
                    where: { roleId: existingRole.id }
                });
                role = existingRole;
                console.log(`🔄 ${template.name}: Updating...`);
            } else {
                role = await prisma.role.create({
                    data: {
                        name: template.name,
                        description: template.description,
                        clientId: systemClient.id,
                        isSystem: true // Mark as template
                    }
                });
                console.log(`✨ ${template.name}: Creating...`);
            }
            
            // Create/find permissions and assign to role
            for (const perm of template.permissions) {
                let permission = await prisma.permission.findFirst({
                    where: {
                        resource: perm.resource,
                        action: perm.action
                    }
                });
                
                if (!permission) {
                    permission = await prisma.permission.create({
                        data: {
                            resource: perm.resource,
                            action: perm.action,
                            description: `${perm.action} ${perm.resource}`
                        }
                    });
                }
                
                await prisma.rolePermission.create({
                    data: {
                        roleId: role.id,
                        permissionId: permission.id
                    }
                });
            }
            
            if (existingRole) {
                updated++;
                console.log(`   ✅ Updated with ${template.permissions.length} permissions`);
            } else {
                created++;
                console.log(`   ✅ Created with ${template.permissions.length} permissions`);
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY:');
        console.log(`   ✨ Created: ${created} templates`);
        console.log(`   🔄 Updated: ${updated} templates`);
        console.log(`   ⏭️  Skipped: ${skipped} templates (already correct)`);
        
        // Show final state
        const allTemplates = await prisma.role.findMany({
            where: {
                clientId: systemClient.id,
                isSystem: true
            },
            include: {
                permissions: true
            },
            orderBy: { name: 'asc' }
        });
        
        console.log('\n✅ ROLE TEMPLATES IN SYSTEM CLIENT:');
        console.log('='.repeat(60));
        allTemplates.forEach(role => {
            console.log(`   ${role.name}: ${role.permissions.length} permissions`);
        });
        
        console.log('\n💡 These templates will be automatically copied to new clients.');
        console.log('💡 Existing clients are not affected - they keep their current roles.');
        
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createMissingTemplates()
    .then(() => {
        console.log('\n✅ Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
