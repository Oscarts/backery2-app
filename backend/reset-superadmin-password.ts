import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'superadmin@system.local';
    const newPassword = 'admin123';

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the user
    const updated = await prisma.user.update({
        where: { email },
        data: { passwordHash },
        select: {
            email: true,
            firstName: true,
            lastName: true,
            role: true
        }
    });

    console.log(`\n✅ Password reset successfully for ${updated.firstName} ${updated.lastName} (${updated.email})`);
    console.log(`🔑 New password: ${newPassword}`);
    console.log(`👤 Role: ${updated.role}\n`);

    await prisma.$disconnect();
}

main().catch(console.error);
