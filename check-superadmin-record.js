const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const user = await prisma.user.findFirst({
    where: { email: 'superadmin@system.local' },
    include: { client: true, customRole: true }
  });
  console.log(user);
  await prisma.$disconnect();
})();
