const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    // Find Super Admin user
    const superAdmin = await prisma.user.findFirst({
      where: {
        email: 'superadmin@system.local'
      },
      include: {
        client: true,
        customRole: true
      }
    });

    if (!superAdmin) {
      console.log('❌ Super Admin user not found!');
      console.log('\nCreating Super Admin user...');

      // Find System client and Super Admin role
      const systemClient = await prisma.client.findFirst({
        where: { name: 'System' }
      });

      const superAdminRole = await prisma.role.findFirst({
        where: {
          name: 'Super Admin',
          isSystem: true
        }
      });

      if (!systemClient || !superAdminRole) {
        console.log('❌ System client or Super Admin role not found');
        return;
      }

      // Create Super Admin user
      const hashedPassword = await bcrypt.hash('superadmin123', 10);
      const newSuperAdmin = await prisma.user.create({
        data: {
          email: 'superadmin@system.local',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          clientId: systemClient.id,
          roleId: superAdminRole.id,
          isActive: true
        }
      });

      console.log('✅ Super Admin user created successfully');
      console.log(`   Email: ${newSuperAdmin.email}`);
      console.log(`   Password: superadmin123`);
    } else {
      console.log('✅ Super Admin user found');
      console.log(`   Email: ${superAdmin.email}`);
      console.log(`   Role ID: ${superAdmin.roleId}`);
      console.log(`   Client: ${superAdmin.client.name}`);
      console.log(`   Active: ${superAdmin.isActive}`);

      // Test password
      const passwordMatch = await bcrypt.compare('superadmin123', superAdmin.password);
      console.log(`   Password 'superadmin123' matches: ${passwordMatch}`);

      if (!passwordMatch) {
        console.log('\n🔧 Resetting password to: superadmin123');
        const hashedPassword = await bcrypt.hash('superadmin123', 10);
        await prisma.user.update({
          where: { id: superAdmin.id },
          data: { password: hashedPassword }
        });
        console.log('✅ Password reset successfully');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin();
