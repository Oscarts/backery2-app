import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@test.com';
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log('❌ User not found:', email);
        process.exit(1);
    }

    console.log('\n📧 Email:', user.email);
    console.log('👤 Name:', user.firstName, user.lastName);
    console.log('🏢 Client ID:', user.clientId);
    console.log('✅ Active:', user.isActive);

    const isValid = await bcrypt.compare('password123', user.passwordHash);
    console.log('\n🔑 Password "password123" is valid:', isValid ? '✅ YES' : '❌ NO');

    if (!isValid) {
        console.log('\n⚠️  Note: This user exists but password123 does not work.');
        console.log('The user may have been created with a different password.');
    }

    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
