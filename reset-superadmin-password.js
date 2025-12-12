const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

(async () => {
  const hash = await bcrypt.hash('superadmin123', 10);
  await prisma.user.updateMany({
    where: { email: 'superadmin@system.local' },
    data: { passwordHash: hash }
  });
  console.log('✅ Password reset for superadmin@system.local');
  await prisma.$disconnect();
})();
