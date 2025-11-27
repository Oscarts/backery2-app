import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testEmailLookup() {
    try {
        const testEmails = [
            'superadmin@system.local',
            'SUPERADMIN@SYSTEM.LOCAL',
            'SuperAdmin@System.Local',
        ];

        for (const email of testEmails) {
            console.log(`\n🔍 Testing email: "${email}"`);
            console.log(`   Lowercase: "${email.toLowerCase()}"`);

            const user = await prisma.user.findUnique({
                where: { email: email.toLowerCase() },
            });

            if (user) {
                console.log(`   ✅ Found: ${user.id} - ${user.email}`);
            } else {
                console.log(`   ❌ Not found`);
            }
        }

        // Check all user emails
        console.log('\n\n📋 All users in database:');
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
            },
        });

        allUsers.forEach(u => {
            console.log(`   - ${u.email} (${u.firstName} ${u.lastName}) - ID: ${u.id.substring(0, 10)}...`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testEmailLookup();
