#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin() {
  const email = 'oscar@test.com';
  const password = process.argv[2] || 'admin123'; // Take password from command line or default

  console.log('🔐 Testing login for newly created client user');
  console.log('='.repeat(60));
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('');

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        client: true,
        customRole: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Client: ${user.client.name}`);
    console.log(`   Role: ${user.customRole?.name || 'NONE'}`);
    console.log(`   Active: ${user.isActive}`);
    console.log('');

    // Test password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (passwordMatch) {
      console.log('✅ PASSWORD MATCHES!');
      console.log('');
      console.log(`This user can log in with:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log('');
      console.log(`Permissions (${user.customRole?.permissions.length || 0}):`);
      if (user.customRole) {
        const permsByResource = {};
        user.customRole.permissions.forEach(rp => {
          const resource = rp.permission.resource;
          if (!permsByResource[resource]) {
            permsByResource[resource] = [];
          }
          permsByResource[resource].push(rp.permission.action);
        });

        Object.entries(permsByResource).forEach(([resource, actions]) => {
          console.log(`   ${resource}: ${actions.join(', ')}`);
        });
      }
    } else {
      console.log('❌ PASSWORD DOES NOT MATCH');
      console.log('');
      console.log('The password you provided does not match the stored hash.');
      console.log('Make sure you are using the same password you entered when creating the client.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
