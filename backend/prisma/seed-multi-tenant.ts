/**
 * Multi-Tenant Seed Data
 * 
 * This script creates sample multi-tenant data including:
 * - 2 demo clients (ABC Bakery, XYZ Chocolatier)
 * - Custom roles with specific permissions
 * - Sample users with different access levels
 * 
 * Run AFTER the main seed.ts and data migration
 * Command: npx tsx prisma/seed-multi-tenant.ts
 */

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting multi-tenant seed...\n');

  try {
    // Get the System client (should already exist from data migration)
    const systemClient = await prisma.client.findUnique({
      where: { slug: 'system' },
    });

    if (!systemClient) {
      throw new Error('System client not found. Run data migration first.');
    }

    // Create ABC Bakery client
    console.log('🏢 Creating ABC Bakery client...');
    const abcBakery = await prisma.client.upsert({
      where: { slug: 'abc-bakery' },
      update: {},
      create: {
        name: 'ABC Bakery',
        slug: 'abc-bakery',
        email: 'contact@abcbakery.com',
        phone: '+33 1 23 45 67 89',
        address: '123 Rue de la Boulangerie, 75001 Paris, France',
        isActive: true,
      },
    });
    console.log(`✅ ABC Bakery created: ${abcBakery.id}\n`);

    // Create XYZ Chocolatier client
    console.log('🍫 Creating XYZ Chocolatier client...');
    const xyzChocolatier = await prisma.client.upsert({
      where: { slug: 'xyz-chocolatier' },
      update: {},
      create: {
        name: 'XYZ Chocolatier',
        slug: 'xyz-chocolatier',
        email: 'info@xyzchocolatier.com',
        phone: '+33 1 98 76 54 32',
        address: '456 Avenue du Chocolat, 75002 Paris, France',
        isActive: true,
      },
    });
    console.log(`✅ XYZ Chocolatier created: ${xyzChocolatier.id}\n`);

    // Get all permissions
    const allPermissions = await prisma.permission.findMany();

    // Create roles for ABC Bakery
    console.log('👥 Creating roles for ABC Bakery...');

    // ABC Admin Role
    const abcAdminRole = await prisma.role.upsert({
      where: { clientId_name: { clientId: abcBakery.id, name: 'Admin' } },
      update: {},
      create: {
        name: 'Admin',
        description: 'Full access to all features',
        isSystem: true,
        clientId: abcBakery.id,
      },
    });

    // Assign all permissions to ABC Admin
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: abcAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: abcAdminRole.id,
          permissionId: permission.id,
        },
      });
    }

    // ABC Inventory Manager Role
    const abcInventoryRole = await prisma.role.upsert({
      where: { clientId_name: { clientId: abcBakery.id, name: 'Inventory Manager' } },
      update: {},
      create: {
        name: 'Inventory Manager',
        description: 'Access to inventory and production only',
        isSystem: false,
        clientId: abcBakery.id,
      },
    });

    // Assign specific permissions to Inventory Manager
    const inventoryResources = ['dashboard', 'raw-materials', 'finished-products', 'recipes', 'production'];
    for (const permission of allPermissions) {
      if (inventoryResources.includes(permission.resource)) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: abcInventoryRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: abcInventoryRole.id,
            permissionId: permission.id,
          },
        });
      }
    }

    // ABC Sales Manager Role
    const abcSalesRole = await prisma.role.upsert({
      where: { clientId_name: { clientId: abcBakery.id, name: 'Sales Manager' } },
      update: {},
      create: {
        name: 'Sales Manager',
        description: 'Access to customers and orders only',
        isSystem: false,
        clientId: abcBakery.id,
      },
    });

    // Assign specific permissions to Sales Manager
    const salesResources = ['dashboard', 'finished-products', 'customers', 'customer-orders'];
    for (const permission of allPermissions) {
      if (salesResources.includes(permission.resource)) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: abcSalesRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: abcSalesRole.id,
            permissionId: permission.id,
          },
        });
      }
    }

    console.log('✅ ABC Bakery roles created\n');

    // Create roles for XYZ Chocolatier
    console.log('👥 Creating roles for XYZ Chocolatier...');

    // XYZ Admin Role
    const xyzAdminRole = await prisma.role.upsert({
      where: { clientId_name: { clientId: xyzChocolatier.id, name: 'Admin' } },
      update: {},
      create: {
        name: 'Admin',
        description: 'Full access to all features',
        isSystem: true,
        clientId: xyzChocolatier.id,
      },
    });

    // Assign all permissions to XYZ Admin
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: xyzAdminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: xyzAdminRole.id,
          permissionId: permission.id,
        },
      });
    }

    // XYZ Production Staff Role
    const xyzProductionRole = await prisma.role.upsert({
      where: { clientId_name: { clientId: xyzChocolatier.id, name: 'Production Staff' } },
      update: {},
      create: {
        name: 'Production Staff',
        description: 'Access to production and recipes only',
        isSystem: false,
        clientId: xyzChocolatier.id,
      },
    });

    // Assign specific permissions to Production Staff
    const productionResources = ['dashboard', 'production', 'recipes'];
    for (const permission of allPermissions) {
      if (productionResources.includes(permission.resource)) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: xyzProductionRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: xyzProductionRole.id,
            permissionId: permission.id,
          },
        });
      }
    }

    console.log('✅ XYZ Chocolatier roles created\n');

    // Create sample users
    console.log('👤 Creating sample users...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // ABC Bakery Users
    await prisma.user.upsert({
      where: { email: 'admin@abcbakery.com' },
      update: {},
      create: {
        email: 'admin@abcbakery.com',
        passwordHash: hashedPassword,
        firstName: 'John',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        clientId: abcBakery.id,
        roleId: abcAdminRole.id,
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { email: 'inventory@abcbakery.com' },
      update: {},
      create: {
        email: 'inventory@abcbakery.com',
        passwordHash: hashedPassword,
        firstName: 'Marie',
        lastName: 'Inventory',
        role: UserRole.CUSTOM,
        clientId: abcBakery.id,
        roleId: abcInventoryRole.id,
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { email: 'sales@abcbakery.com' },
      update: {},
      create: {
        email: 'sales@abcbakery.com',
        passwordHash: hashedPassword,
        firstName: 'Pierre',
        lastName: 'Sales',
        role: UserRole.CUSTOM,
        clientId: abcBakery.id,
        roleId: abcSalesRole.id,
        isActive: true,
      },
    });

    // XYZ Chocolatier Users
    await prisma.user.upsert({
      where: { email: 'admin@xyzchocolatier.com' },
      update: {},
      create: {
        email: 'admin@xyzchocolatier.com',
        passwordHash: hashedPassword,
        firstName: 'Sophie',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        clientId: xyzChocolatier.id,
        roleId: xyzAdminRole.id,
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { email: 'production@xyzchocolatier.com' },
      update: {},
      create: {
        email: 'production@xyzchocolatier.com',
        passwordHash: hashedPassword,
        firstName: 'Lucas',
        lastName: 'Production',
        role: UserRole.CUSTOM,
        clientId: xyzChocolatier.id,
        roleId: xyzProductionRole.id,
        isActive: true,
      },
    });

    console.log('✅ Sample users created\n');

    console.log('🎉 Multi-tenant seed completed successfully!\n');
    console.log('Sample Login Credentials (password for all: password123):');
    console.log('\nABC Bakery:');
    console.log('  Admin: admin@abcbakery.com');
    console.log('  Inventory Manager: inventory@abcbakery.com');
    console.log('  Sales Manager: sales@abcbakery.com');
    console.log('\nXYZ Chocolatier:');
    console.log('  Admin: admin@xyzchocolatier.com');
    console.log('  Production Staff: production@xyzchocolatier.com\n');

  } catch (error) {
    console.error('❌ Error during multi-tenant seed:', error);
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
