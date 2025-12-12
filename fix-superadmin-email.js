const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  await prisma.user.updateMany({
    where: { email: { contains: 'superadmin@system.local', mode: 'insensitive' } },
    data: { email: 'superadmin@system.local' }
  });
  console.log('✅ Super Admin email set to lowercase');
  await prisma.$disconnect();
})();
