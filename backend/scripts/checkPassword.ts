import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        const email = 'admin@abcbakery.com';
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.error('User not found:', email);
            process.exit(1);
        }

        console.log('User id:', user.id);
        console.log('Email:', user.email);
        console.log('Password hash:', user.passwordHash);

        const ok = await bcrypt.compare('password123', user.passwordHash);
        console.log('bcrypt compare result for password123:', ok);
    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
