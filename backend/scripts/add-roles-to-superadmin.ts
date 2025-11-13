import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('👑 Adding role management permissions to Super Admin...\n');

  // Get System client
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

  // Get role management permissions
  const rolePermissions = await prisma.permission.findMany({
    where: { resource: 'roles' },
  });

  console.log(`Found ${rolePermissions.length} role management permissions\n`);

  // Add each role permission to Super Admin
  let addedCount = 0;
  for (const perm of rolePermissions) {
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
      console.log(`✅ Added: ${perm.resource}:${perm.action}`);
      addedCount++;
    } else {
      console.log(`⏭️  Already exists: ${perm.resource}:${perm.action}`);
    }
  }

  // Get final count
  const finalPermissions = await prisma.rolePermission.count({
    where: { roleId: superAdminRole.id },
  });

  console.log(`\n✅ Done! Added ${addedCount} role management permissions`);
  console.log(`👑 Super Admin now has ${finalPermissions} total permissions (clients + roles)`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
