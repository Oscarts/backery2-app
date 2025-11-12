import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Updating Super Admin permissions...\n');

  // Get System client
  const systemClient = await prisma.client.findUnique({
    where: { slug: 'system' },
  });

  if (!systemClient) {
    throw new Error('System client not found');
  }

  // Get Super Admin role
  const superAdminRole = await prisma.role.findFirst({
    where: {
      clientId: systemClient.id,
      name: 'Super Admin',
    },
  });

  if (!superAdminRole) {
    throw new Error('Super Admin role not found');
  }

  // Get only client management permissions
  const clientPermissions = await prisma.permission.findMany({
    where: {
      resource: 'clients',
    },
  });

  console.log(`Found ${clientPermissions.length} client management permissions`);

  // Remove all existing permissions
  await prisma.rolePermission.deleteMany({
    where: {
      roleId: superAdminRole.id,
    },
  });

  console.log('✅ Removed all existing permissions from Super Admin role');

  // Add only client management permissions
  for (const permission of clientPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
    console.log(`✅ Added permission: ${permission.resource}:${permission.action}`);
  }

  console.log('\n✨ Super Admin role updated successfully!');
  console.log('\n📝 Super Admin now has ONLY client management permissions:');
  console.log('   - clients:view');
  console.log('   - clients:create');
  console.log('   - clients:edit');
  console.log('   - clients:delete');
  console.log('\n🚫 Super Admin will NOT see:');
  console.log('   - Dashboard');
  console.log('   - Raw Materials');
  console.log('   - Recipes');
  console.log('   - Production');
  console.log('   - Customer Orders');
  console.log('   - Any tenant-specific features');
  console.log('\n🔐 Super Admin will ONLY see:');
  console.log('   - Clients menu (manage all bakery clients)');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
