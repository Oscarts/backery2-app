#!/usr/bin/env ts-node

/**
 * Quick Create Client Script (Non-Interactive)
 * 
 * Usage:
 *   cd backend
 *   npx tsx scripts/quick-create-client.ts "Boulangerie Artisan" admin@boulangerie.com "Pierre Durand"
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function quickCreateClient() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('\n📖 Usage:');
    console.log('  npx tsx scripts/quick-create-client.ts "Client Name" "admin@email.com" "First Last" [PLAN] [PASSWORD]');
    console.log('\nExample:');
    console.log('  npx tsx scripts/quick-create-client.ts "Boulangerie Artisan" "admin@boulangerie.com" "Pierre Durand" PROFESSIONAL password123\n');
    console.log('Plans: TRIAL (default), FREE, STARTER, PROFESSIONAL, ENTERPRISE');
    process.exit(1);
  }

  const name = args[0];
  const email = args[1];
  const fullName = args[2];
  const plan = (args[3] || 'PROFESSIONAL').toUpperCase();
  const password = args[4] || 'password123';

  const [firstName, ...lastNameParts] = fullName.split(' ');
  const lastName = lastNameParts.join(' ') || firstName;

  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const planLimits: Record<string, number> = {
    TRIAL: 5,
    FREE: 5,
    STARTER: 5,
    PROFESSIONAL: 20,
    ENTERPRISE: 999,
  };

  const maxUsers = planLimits[plan] || 20;

  console.log('\n🏢 Creating Client...\n');
  console.log(`Name: ${name}`);
  console.log(`Slug: ${slug}`);
  console.log(`Plan: ${plan} (${maxUsers} users max)`);
  console.log(`Admin: ${firstName} ${lastName} <${email}>`);
  console.log('');

  try {
    // Check existing
    const existing = await prisma.client.findFirst({
      where: { OR: [{ slug }, { name }] },
    });

    if (existing) {
      console.error('❌ Client already exists');
      process.exit(1);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.error('❌ Email already in use');
      process.exit(1);
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        name,
        slug,
        isActive: true,
        subscriptionPlan: plan as any,
        maxUsers,
        subscriptionStatus: plan === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
        trialEndsAt: plan === 'TRIAL' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      },
    });

    console.log(`✅ Client created: ${client.id}`);

    // Get permissions
    const permissions = await prisma.permission.findMany();
    console.log(`📋 ${permissions.length} permissions found`);

    // Create Admin role
    const adminRole = await prisma.role.create({
      data: {
        name: 'Admin',
        description: 'Full access to all features',
        isSystem: true,
        clientId: client.id,
        permissions: {
          create: permissions.map((p: any) => ({
            permissionId: p.id,
          })),
        },
      },
    });

    console.log(`✅ Admin role created`);

    // Create admin user
    const passwordHash = await bcrypt.hash(password, 10);
    const adminUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        roleId: adminRole.id,
        clientId: client.id,
        isActive: true,
      },
    });

    console.log(`✅ Admin user created`);
    console.log('\n🎉 Success!\n');
    console.log('Login Credentials:');
    console.log('─'.repeat(50));
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('─'.repeat(50));
    console.log(`\n🔗 http://localhost:3002/login\n`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

quickCreateClient();
