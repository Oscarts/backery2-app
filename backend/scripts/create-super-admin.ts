import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('👑 Creating Super Admin user...\n');

  const email = 'superadmin@system.local';
  const password = 'admin123';
  const firstName = 'Super';
  const lastName = 'Admin';

  // Get System client
  const systemClient = await prisma.client.findUnique({
    where: { slug: 'system' },
  });

  if (!systemClient) {
    throw new Error('System client not found');
  }

  // Get Super Admin role
  const superAdminRole = await prisma.role.findFirst({
    where: {
      clientId: systemClient.id,
      name: 'Super Admin',
    },
  });

  if (!superAdminRole) {
    throw new Error('Super Admin role not found. Run add-client-permissions.ts first.');
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log('⏭️  Super Admin user already exists');
    console.log(`Email: ${email}`);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      isActive: true,
      client: {
        connect: { id: systemClient.id },
      },
      customRole: {
        connect: { id: superAdminRole.id },
      },
    },
  });

  console.log('✅ Super Admin user created!\n');
  console.log('──────────────────────────────────────────────────');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Client: ${systemClient.name} (${systemClient.slug})`);
  console.log(`Role: Super Admin (44 permissions)`);
  console.log('──────────────────────────────────────────────────');
  console.log('\n🔗 Login at: http://localhost:3002/login');
  console.log('\n📝 This user has access to:');
  console.log('   - All regular features');
  console.log('   - Client management (create, view, edit, delete clients)');
  console.log('   - Subscription plan management');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
