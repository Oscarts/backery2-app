import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Adding Reports permissions...\n');

  // Define the reports permissions
  const reportsPermissions = [
    {
      resource: 'reports',
      action: 'view',
      description: 'View reports and analytics',
    },
  ];

  // Create permissions if they don't exist
  for (const perm of reportsPermissions) {
    const existing = await prisma.permission.findUnique({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action,
        },
      },
    });

    if (!existing) {
      const created = await prisma.permission.create({
        data: perm,
      });
      console.log(`✅ Created permission: ${perm.resource}:${perm.action}`);

      // Add to all existing Admin roles (except System/Super Admin)
      const systemClient = await prisma.client.findUnique({
        where: { slug: 'system' },
      });

      const adminRoles = await prisma.role.findMany({
        where: {
          name: 'Admin',
          clientId: {
            not: systemClient?.id,
          },
        },
      });

      console.log(`\n📦 Adding to ${adminRoles.length} bakery admin roles...`);

      for (const role of adminRoles) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: created.id,
          },
        });
        
        const client = await prisma.client.findUnique({
          where: { id: role.clientId },
        });
        
        console.log(`   ✅ Added to ${client?.name} - ${role.name}`);
      }
    } else {
      console.log(`⏭️  Permission already exists: ${perm.resource}:${perm.action}`);
    }
  }

  console.log('\n✅ Done! Reports permissions created and assigned to bakery admins');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
