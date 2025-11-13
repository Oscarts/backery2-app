import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncExistingClientsWithTemplates() {
  console.log('🔄 Syncing existing clients with role templates...\n');

  // Get System client
  const systemClient = await prisma.client.findUnique({
    where: { slug: 'system' },
  });

  if (!systemClient) {
    console.error('❌ System client not found!');
    return;
  }

  // Get all role templates
  const roleTemplates = await prisma.role.findMany({
    where: {
      clientId: systemClient.id,
      isSystem: true,
      name: { not: 'Super Admin' },
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  console.log(`📋 Found ${roleTemplates.length} role templates:\n`);
  for (const template of roleTemplates) {
    console.log(`   - ${template.name} (${template.permissions.length} permissions)`);
  }

  // Get all clients except System
  const clients = await prisma.client.findMany({
    where: {
      id: { not: systemClient.id },
    },
    include: {
      roles: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  console.log(`\n🏢 Found ${clients.length} clients to sync\n`);

  for (const client of clients) {
    console.log(`\n📦 ${client.name}:`);

    for (const template of roleTemplates) {
      // Check if client already has this role
      let existingRole = client.roles.find((r) => r.name === template.name);

      if (existingRole) {
        // Update existing role's permissions to match template
        console.log(`   🔄 Updating ${template.name}...`);

        // Delete all existing permissions
        await prisma.rolePermission.deleteMany({
          where: { roleId: existingRole.id },
        });

        // Add template permissions
        for (const rp of template.permissions) {
          await prisma.rolePermission.create({
            data: {
              roleId: existingRole.id,
              permissionId: rp.permission.id,
            },
          });
        }

        // Update description
        await prisma.role.update({
          where: { id: existingRole.id },
          data: { description: template.description },
        });

        console.log(`      ✅ Updated with ${template.permissions.length} permissions`);
      } else {
        // Create new role from template
        console.log(`   ✨ Creating ${template.name}...`);

        const newRole = await prisma.role.create({
          data: {
            name: template.name,
            description: template.description,
            isSystem: false,
            clientId: client.id,
            permissions: {
              create: template.permissions.map((rp: any) => ({
                permissionId: rp.permission.id,
              })),
            },
          },
        });

        console.log(`      ✅ Created with ${template.permissions.length} permissions`);
      }
    }

    // Summary for this client
    const updatedClient = await prisma.client.findUnique({
      where: { id: client.id },
      include: {
        roles: {
          include: {
            _count: {
              select: { permissions: true },
            },
          },
        },
      },
    });

    console.log(`\n   📊 ${client.name} now has ${updatedClient?.roles.length} roles:`);
    updatedClient?.roles.forEach((role) => {
      console.log(`      - ${role.name} (${role._count.permissions} permissions)`);
    });
  }

  console.log('\n\n✅ All clients synced with role templates!');
  console.log('💡 New clients will automatically get these roles on creation.\n');

  await prisma.$disconnect();
}

syncExistingClientsWithTemplates().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
