import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'admin@test.com';

  console.log(`🔍 Searching for user: ${email}\n`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      client: true,
      customRole: true
    }
  });

  if (user) {
    console.log('✅ User found:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Client: ${user.client?.name} (${user.clientId})`);
    console.log(`   Role: ${user.customRole?.name || user.role || 'N/A'}`);
    console.log(`   Active: ${user.isActive}`);
  } else {
    console.log('❌ User not found');

    // Search all users
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    console.log('\n📋 All users:');
    allUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.firstName} ${u.lastName}) - Active: ${u.isActive}`);
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
