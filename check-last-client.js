#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLastClient() {
  const client = await prisma.client.findFirst({
    where: { slug: { not: 'system' } },
    orderBy: { createdAt: 'desc' },
    include: {
      users: {
        include: {
          customRole: {
            select: { name: true, permissions: { include: { permission: true } } }
          }
        }
      },
      roles: {
        include: {
          _count: { select: { permissions: true } }
        }
      }
    }
  });

  if (!client) {
    console.log('No clients found (except system)');
  } else {
    console.log('Last Created Client:');
    console.log('='.repeat(60));
    console.log(`Name: ${client.name}`);
    console.log(`Slug: ${client.slug}`);
    console.log(`Created: ${client.createdAt}`);
    console.log(`\nRoles (${client.roles.length}):`);
    client.roles.forEach(r => console.log(`  - ${r.name}: ${r._count.permissions} perms`));
    console.log(`\nUsers (${client.users.length}):`);
    client.users.forEach(u => {
      console.log(`  - ${u.email}`);
      console.log(`    Role: ${u.customRole?.name || 'NONE'}`);
      console.log(`    Password hash exists: ${!!u.passwordHash}`);
      console.log(`    Active: ${u.isActive}`);
    });
  }

  await prisma.$disconnect();
}

checkLastClient();
