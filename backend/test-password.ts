import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testPassword() {
    try {
        console.log('🔐 Testing password for superadmin@system.local\n');

        const user = await prisma.user.findUnique({
            where: { email: 'superadmin@system.local' },
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log(`User ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Password Hash: ${user.passwordHash}\n`);

        const testPassword = 'admin123';
        console.log(`Testing password: "${testPassword}"\n`);

        const isValid = await bcrypt.compare(testPassword, user.passwordHash);

        if (isValid) {
            console.log('✅ Password is VALID - bcrypt.compare returned true');
        } else {
            console.log('❌ Password is INVALID - bcrypt.compare returned false');

            // Try to hash the password and compare
            console.log('\n🔄 Generating new hash for comparison...');
            const newHash = await bcrypt.hash(testPassword, 10);
            console.log(`New hash: ${newHash}`);

            const testNewHash = await bcrypt.compare(testPassword, newHash);
            console.log(`New hash validation: ${testNewHash ? '✅ VALID' : '❌ INVALID'}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testPassword();
