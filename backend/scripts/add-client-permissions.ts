import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Adding client management permissions...\n');

  // Define the client management permissions
  const clientPermissions = [
    {
      resource: 'clients',
      action: 'create',
      description: 'Create new clients (Super Admin)',
    },
    {
      resource: 'clients',
      action: 'read',
      description: 'View client information (Super Admin)',
    },
    {
      resource: 'clients',
      action: 'update',
      description: 'Update client settings and subscription (Super Admin)',
    },
    {
      resource: 'clients',
      action: 'delete',
      description: 'Delete clients (Super Admin)',
    },
  ];

  // Create permissions if they don't exist
  for (const perm of clientPermissions) {
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

  // Find or create Super Admin role in System client
  let superAdminRole = await prisma.role.findFirst({
    where: {
      clientId: systemClient.id,
      name: 'Super Admin',
    },
  });

  if (!superAdminRole) {
    console.log('\n👑 Creating Super Admin role...');
    
    // Get all permissions including the new ones
    const allPermissions = await prisma.permission.findMany();
    
    superAdminRole = await prisma.role.create({
      data: {
        name: 'Super Admin',
        description: 'System administrator with access to all features including client management',
        isSystem: true,
        clientId: systemClient.id,
      },
    });

    // Assign all permissions to Super Admin
    for (const permission of allPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: permission.id,
        },
      });
    }
    
    console.log(`✅ Super Admin role created with ${allPermissions.length} permissions`);
  } else {
    console.log('\n👑 Super Admin role already exists');
    
    // Add only the new client permissions to existing Super Admin role
    const newPermissions = await prisma.permission.findMany({
      where: {
        resource: 'clients',
      },
    });

    for (const permission of newPermissions) {
      const existing = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        },
      });

      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        });
        console.log(`✅ Added ${permission.name} to Super Admin role`);
      }
    }
  }

  console.log('\n✨ Client management permissions setup complete!');
  console.log('\n📝 Notes:');
  console.log('   - Client management permissions are for Super Admins only');
  console.log('   - These permissions grant access to /api/admin/clients endpoints');
  console.log('   - Regular tenant admins do NOT have these permissions');
  console.log('   - To create a super admin user, assign them to the Super Admin role in the System client');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
