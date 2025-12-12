const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'oscar@test.com' },
      include: {
        client: true
      }
    });

    if (user) {
      console.log('User found:', user.email);
      console.log('User active:', user.isActive);
      console.log('Client:', user.client.name);
      console.log('Client active:', user.client.isActive);
      console.log('Password hash exists:', !!user.passwordHash);
      console.log('Hash starts with:', user.passwordHash.substring(0, 7));

      const isValid = await bcrypt.compare('password123', user.passwordHash);
      console.log('\nPassword "password123" is valid:', isValid);

      if (!isValid) {
        // Try testing the hash directly
        const testHash = await bcrypt.hash('password123', 10);
        console.log('\nNew hash for comparison:', testHash.substring(0, 7));
      }
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
