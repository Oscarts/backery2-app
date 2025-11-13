import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Adding API Test permissions...\n');

  // Define the API test permissions
  const apiTestPermissions = [
    {
      resource: 'api-test',
      action: 'view',
      description: 'Access API testing tools (for testing/development)',
    },
  ];

  // Create permissions if they don't exist
  for (const perm of apiTestPermissions) {
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
      console.log(`   Description: ${perm.description}`);
    } else {
      console.log(`⏭️  Permission already exists: ${perm.resource}:${perm.action}`);
    }
  }

  console.log('\n✅ Done! API Test permission created');
  console.log('💡 You can now assign this to specific roles for testing purposes');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
