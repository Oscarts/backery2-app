import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Adding permissions management permissions...\n');

  // Define the permissions management permissions
  const permissionsPerms = [
    {
      resource: 'permissions',
      action: 'view',
      description: 'View available permissions (Super Admin)',
    },
  ];

  // Create permissions if they don't exist
  for (const perm of permissionsPerms) {
    const existing = await prisma.permission.findUnique({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action,
        },
      },
    });

    if (!existing) {
      await prisma.permission.create({
        data: perm,
      });
      console.log(`✅ Created permission: ${perm.resource}:${perm.action}`);
    } else {
      console.log(`⏭️  Permission already exists: ${perm.resource}:${perm.action}`);
    }
  }

  // Get the System client
  const systemClient = await prisma.client.findUnique({
    where: { slug: 'system' },
  });

  if (!systemClient) {
    console.log('❌ System client not found');
    return;
  }

  // Get Super Admin role
  const superAdminRole = await prisma.role.findFirst({
    where: {
      clientId: systemClient.id,
      name: 'Super Admin',
    },
  });

  if (!superAdminRole) {
    console.log('❌ Super Admin role not found');
    return;
  }

  console.log('\n👑 Adding permissions to Super Admin role...');

  // Add permissions to Super Admin
  const newPerms = await prisma.permission.findMany({
    where: { resource: 'permissions' },
  });

  for (const perm of newPerms) {
    const existing = await prisma.rolePermission.findFirst({
      where: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
      },
    });

    if (!existing) {
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      });
      console.log(`✅ Added to Super Admin: ${perm.resource}:${perm.action}`);
    } else {
      console.log(`⏭️  Already in Super Admin: ${perm.resource}:${perm.action}`);
    }
  }

  // Get final count
  const finalPermissions = await prisma.rolePermission.count({
    where: { roleId: superAdminRole.id },
  });

  console.log(`\n✅ Done! Super Admin now has ${finalPermissions} total permissions`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
