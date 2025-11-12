#!/usr/bin/env ts-node

/**
 * Create New Client Script
 * 
 * Usage:
 *   npm run create-client
 *   or
 *   npx ts-node scripts/create-client.ts
 * 
 * This script creates a new bakery client with:
 * - Client/organization setup
 * - Default Admin role with all permissions
 * - Initial admin user
 * - Subscription plan and user limits
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function createClient() {
  console.log('\n🏢 Create New Bakery Client\n');
  console.log('='.repeat(50));
  console.log('\n');

  try {
    // Collect client information
    const name = await question('Client Name (e.g., "Boulangerie Artisan"): ');
    if (!name) {
      console.error('❌ Client name is required');
      process.exit(1);
    }

    const slug = await question(
      `Slug (URL-friendly, e.g., "boulangerie-artisan") [${name.toLowerCase().replace(/\s+/g, '-')}]: `
    ) || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const email = await question('Client Email (optional): ') || null;
    const phone = await question('Client Phone (optional): ') || null;
    const address = await question('Client Address (optional): ') || null;

    console.log('\n📊 Subscription Plan:');
    console.log('1. TRIAL (5 users, trial period)');
    console.log('2. FREE (5 users, forever)');
    console.log('3. STARTER (5 users, €50/month)');
    console.log('4. PROFESSIONAL (20 users, €150/month)');
    console.log('5. ENTERPRISE (unlimited users, custom pricing)');
    
    const planChoice = await question('Select plan [1-5] (default: 1): ') || '1';
    const planMap: Record<string, { plan: string; maxUsers: number }> = {
      '1': { plan: 'TRIAL', maxUsers: 5 },
      '2': { plan: 'FREE', maxUsers: 5 },
      '3': { plan: 'STARTER', maxUsers: 5 },
      '4': { plan: 'PROFESSIONAL', maxUsers: 20 },
      '5': { plan: 'ENTERPRISE', maxUsers: 999 },
    };
    
    const selectedPlan = planMap[planChoice] || planMap['1'];

    // Admin user information
    console.log('\n👤 Admin User:');
    const adminEmail = await question('Admin Email: ');
    if (!adminEmail || !adminEmail.includes('@')) {
      console.error('❌ Valid admin email is required');
      process.exit(1);
    }

    const adminPassword = await question('Admin Password: ');
    if (!adminPassword || adminPassword.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    const adminFirstName = await question('Admin First Name: ');
    const adminLastName = await question('Admin Last Name: ');

    console.log('\n📝 Summary:');
    console.log('─'.repeat(50));
    console.log(`Client: ${name}`);
    console.log(`Slug: ${slug}`);
    console.log(`Plan: ${selectedPlan.plan} (${selectedPlan.maxUsers} users)`);
    console.log(`Admin: ${adminFirstName} ${adminLastName} <${adminEmail}>`);
    console.log('─'.repeat(50));

    const confirm = await question('\nCreate this client? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('❌ Cancelled');
      process.exit(0);
    }

    console.log('\n⏳ Creating client...\n');

    // Check if slug or email already exists
    const existing = await prisma.client.findFirst({
      where: {
        OR: [{ slug }, { name }],
      },
    });

    if (existing) {
      console.error('❌ Client with this name or slug already exists');
      process.exit(1);
    }

    // Check if admin email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      console.error('❌ User with this email already exists');
      process.exit(1);
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        name,
        slug,
        email,
        phone,
        address,
        isActive: true,
        subscriptionPlan: selectedPlan.plan as any,
        maxUsers: selectedPlan.maxUsers,
        subscriptionStatus: selectedPlan.plan === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
        trialEndsAt: selectedPlan.plan === 'TRIAL' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          : null,
      },
    });

    console.log(`✅ Client created: ${client.name} (${client.id})`);

    // Get all permissions
    const permissions = await prisma.permission.findMany();
    console.log(`📋 Found ${permissions.length} permissions`);

    // Create Admin role
    const adminRole = await prisma.role.create({
      data: {
        name: 'Admin',
        description: 'Full access to all features',
        isSystem: true,
        clientId: client.id,
        permissions: {
          create: permissions.map((permission) => ({
            permissionId: permission.id,
          })),
        },
      },
    });

    console.log(`✅ Admin role created with ${permissions.length} permissions`);

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: adminFirstName,
        lastName: adminLastName,
        roleId: adminRole.id,
        clientId: client.id,
        isActive: true,
      },
    });

    console.log(`✅ Admin user created: ${adminUser.email}`);

    console.log('\n🎉 Success! Client created successfully!\n');
    console.log('Login credentials:');
    console.log('─'.repeat(50));
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('─'.repeat(50));
    console.log(`\n🔗 URL: http://localhost:3002/login\n`);

  } catch (error) {
    console.error('\n❌ Error creating client:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the script
createClient();
