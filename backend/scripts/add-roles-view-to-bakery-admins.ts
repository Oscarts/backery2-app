import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addRolesViewToBakeryAdmins() {
  console.log('🔍 Adding roles:view permission to bakery admins...\n');

  // Get system client (Super Admin tenant)
  const systemClient = await prisma.client.findUnique({
    where: { slug: 'system' },
  });

  if (!systemClient) {
    console.error('❌ System client not found!');
    return;
  }

  // Get roles:view permission
  const rolesViewPerm = await prisma.permission.findFirst({
    where: {
      resource: 'roles',
      action: 'view',
    },
  });

  if (!rolesViewPerm) {
    console.error('❌ roles:view permission not found!');
    return;
  }

  // Get all clients except system
  const clients = await prisma.client.findMany({
    where: {
      id: { not: systemClient.id },
    },
    include: {
      roles: {
        where: { name: 'Admin' },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  console.log(`📦 Found ${clients.length} bakery clients\n`);

  for (const client of clients) {
    if (client.roles.length === 0) {
      console.log(`⚠️  ${client.name}: No Admin role found`);
      continue;
    }

    const adminRole = client.roles[0];
    
    // Check if already has roles:view
    const hasRolesView = adminRole.permissions.some(
      (rp) => rp.permission.resource === 'roles' && rp.permission.action === 'view'
    );

    if (hasRolesView) {
      console.log(`✅ ${client.name}: Admin already has roles:view`);
    } else {
      // Add roles:view permission
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: rolesViewPerm.id,
        },
      });
      console.log(`✨ ${client.name}: Added roles:view to Admin`);
    }
  }

  console.log('\n✅ Done! Bakery admins can now view roles.');
  await prisma.$disconnect();
}

addRolesViewToBakeryAdmins().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
