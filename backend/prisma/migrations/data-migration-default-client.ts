/**
 * Data Migration: Create Default "System" Client and Migrate Existing Data
 * 
 * This script should be run AFTER the Prisma schema migration that adds
 * the Client, Role, Permission, and RolePermission tables.
 * 
 * Run with: npx tsx prisma/migrations/data-migration-default-client.ts
 */

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting data migration for multi-tenant setup...\n');

  try {
    // Step 1: Create default "System" client
    console.log('📦 Step 1: Creating default "System" client...');
    const systemClient = await prisma.client.upsert({
      where: { slug: 'system' },
      update: {},
      create: {
        name: 'System',
        slug: 'system',
        email: 'admin@system.local',
        isActive: true,
      },
    });
    console.log(`✅ System client created: ${systemClient.id}\n`);

    // Step 2: Create default ADMIN role for System client
    console.log('👤 Step 2: Creating default ADMIN role...');
    const adminRole = await prisma.role.upsert({
      where: { 
        clientId_name: { 
          clientId: systemClient.id, 
          name: 'Admin' 
        } 
      },
      update: {},
      create: {
        name: 'Admin',
        description: 'Full system access with all permissions',
        isSystem: true,
        clientId: systemClient.id,
      },
    });
    console.log(`✅ Admin role created: ${adminRole.id}\n`);

    // Step 3: Create default permissions
    console.log('🔐 Step 3: Creating default permissions...');
    const resources = [
      'dashboard',
      'raw-materials',
      'finished-products',
      'recipes',
      'production',
      'customers',
      'customer-orders',
      'settings',
      'users',
      'roles',
    ];
    const actions = ['view', 'create', 'edit', 'delete'];

    const permissions = [];
    for (const resource of resources) {
      for (const action of actions) {
        const permission = await prisma.permission.upsert({
          where: { 
            resource_action: { resource, action } 
          },
          update: {},
          create: {
            resource,
            action,
            description: `${action} access to ${resource}`,
          },
        });
        permissions.push(permission);
      }
    }
    console.log(`✅ Created ${permissions.length} permissions\n`);

    // Step 4: Assign all permissions to Admin role
    console.log('🔗 Step 4: Assigning all permissions to Admin role...');
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }
    console.log(`✅ Assigned ${permissions.length} permissions to Admin role\n`);

    // Step 5: Assign Admin role to existing System users without roleId
    console.log('👥 Step 5: Assigning Admin role to existing System users...');
    const usersWithoutRole = await prisma.user.findMany({
      where: { 
        clientId: systemClient.id,
        roleId: null
      },
    });

    if (usersWithoutRole.length > 0) {
      await prisma.user.updateMany({
        where: { 
          clientId: systemClient.id,
          roleId: null
        },
        data: {
          roleId: adminRole.id,
          role: UserRole.ADMIN,
        },
      });
      console.log(`✅ Assigned Admin role to ${usersWithoutRole.length} existing users\n`);
    } else {
      console.log('ℹ️  No users need role assignment\n');
    }

    // Step 6: Data already migrated by SQL migration
    console.log('📊 Step 6: Existing data already has clientId from SQL migration - skipping\n');

    console.log('\n🎉 Data migration completed successfully!\n');
    console.log('Summary:');
    console.log(`- System client: ${systemClient.name} (${systemClient.id})`);
    console.log(`- Admin role: ${adminRole.name} (${adminRole.id})`);
    console.log(`- Permissions: ${permissions.length} created`);
    console.log(`- Users updated: ${usersWithoutRole.length}`);

  } catch (error) {
    console.error('❌ Error during data migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
