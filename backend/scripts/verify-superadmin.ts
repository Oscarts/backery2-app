import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const system = await prisma.client.findFirst({
    where: { slug: 'system' },
    include: {
      roles: {
        where: { name: 'Super Admin' },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (system && system.roles.length > 0) {
    const role = system.roles[0];
    console.log(`👑 Super Admin Permissions (${role.permissions.length}):\n`);
    
    role.permissions.forEach(rp => {
      console.log(`   ✅ ${rp.permission.resource}:${rp.permission.action}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
