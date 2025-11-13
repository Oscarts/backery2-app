import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Removing role management permissions from regular admin roles...\n');

  // Get the System client
  const systemClient = await prisma.client.findUnique({
    where: { slug: 'system' },
  });

  if (!systemClient) {
    console.log('❌ System client not found');
    return;
  }

  // Get all role management permissions
  const rolePermissions = await prisma.permission.findMany({
    where: {
      resource: 'roles',
    },
  });

  console.log(`Found ${rolePermissions.length} role management permissions\n`);

  // Get all clients except System
  const regularClients = await prisma.client.findMany({
    where: {
      id: {
        not: systemClient.id,
      },
    },
    include: {
      roles: {
        include: {
          permissions: true,
        },
      },
    },
  });

  console.log(`Found ${regularClients.length} regular clients\n`);

  let totalRemoved = 0;

  for (const client of regularClients) {
    console.log(`📦 Client: ${client.name}`);
    
    for (const role of client.roles) {
      console.log(`  👥 Role: ${role.name}`);
      
      let removedCount = 0;
      
      for (const rolePermission of rolePermissions) {
        // Check if this role has this role management permission
        const hasPermission = role.permissions.some(
          (rp) => rp.permissionId === rolePermission.id
        );
        
        if (hasPermission) {
          // Remove the permission
          await prisma.rolePermission.deleteMany({
            where: {
              roleId: role.id,
              permissionId: rolePermission.id,
            },
          });
          
          console.log(`     ❌ Removed: ${rolePermission.resource}:${rolePermission.action}`);
          removedCount++;
          totalRemoved++;
        }
      }
      
      if (removedCount === 0) {
        console.log(`     ✅ No role management permissions found`);
      }
    }
    console.log('');
  }

  console.log(`\n✅ Done! Removed ${totalRemoved} role management permissions from regular admin roles`);
  console.log('\n💡 Role management permissions are now exclusive to Super Admin only');
  console.log('   Regular bakery admins can manage users but not modify roles/permissions');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
