import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing admin permissions - removing client management from non-Super Admin roles...\n');

  // Get the System client
  const systemClient = await prisma.client.findUnique({
    where: { slug: 'system' },
  });

  if (!systemClient) {
    console.log('❌ System client not found');
    return;
  }

  // Get all client management permissions
  const clientPermissions = await prisma.permission.findMany({
    where: {
      resource: 'clients',
    },
  });

  console.log(`Found ${clientPermissions.length} client management permissions\n`);

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
      
      for (const clientPermission of clientPermissions) {
        // Check if this role has this client management permission
        const hasPermission = role.permissions.some(
          (rp) => rp.permissionId === clientPermission.id
        );
        
        if (hasPermission) {
          // Remove the permission
          await prisma.rolePermission.deleteMany({
            where: {
              roleId: role.id,
              permissionId: clientPermission.id,
            },
          });
          
          console.log(`     ❌ Removed: ${clientPermission.resource}:${clientPermission.action}`);
          removedCount++;
          totalRemoved++;
        }
      }
      
      if (removedCount === 0) {
        console.log(`     ✅ No client management permissions found`);
      }
    }
    console.log('');
  }

  console.log(`\n✅ Done! Removed ${totalRemoved} client management permissions from regular admin roles`);
  console.log('\n💡 Client management permissions are now exclusive to Super Admin role only');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
