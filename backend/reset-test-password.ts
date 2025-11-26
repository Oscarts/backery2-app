import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@test.com';
  const newPassword = 'password123';
  
  // Hash the new password
  const passwordHash = await bcrypt.hash(newPassword, 10);
  
  // Update the user
  const updated = await prisma.user.update({
    where: { email },
    data: { passwordHash },
    select: {
      email: true,
      firstName: true,
      lastName: true
    }
  });
  
  console.log(`\n✅ Password reset successfully for ${updated.firstName} ${updated.lastName} (${updated.email})`);
  console.log(`🔑 New password: ${newPassword}\n`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
