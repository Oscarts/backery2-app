#!/usr/bin/env node

/**
 * Test script to verify production database login credentials
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function testLogin() {
    console.log('\n🧪 Testing Production Login Credentials\n');

    try {
        // Test superadmin
        console.log('1️⃣  Testing superadmin@system.local...');
        const superAdmin = await prisma.user.findUnique({
            where: { email: 'superadmin@system.local' },
            include: { client: true, role: true }
        });

        if (!superAdmin) {
            console.log('   ❌ User not found!');
        } else {
            console.log('   ✅ User found');
            console.log('   • Client:', superAdmin.client.name);
            console.log('   • Role:', superAdmin.role?.name || 'N/A');
            console.log('   • Active:', superAdmin.isActive);

            const passwordValid = await bcrypt.compare('super123', superAdmin.passwordHash);
            console.log('   • Password "super123":', passwordValid ? '✅ VALID' : '❌ INVALID');
        }

        // Test bakery admin
        console.log('\n2️⃣  Testing admin@demobakery.com...');
        const bakeryAdmin = await prisma.user.findUnique({
            where: { email: 'admin@demobakery.com' },
            include: { client: true, role: true }
        });

        if (!bakeryAdmin) {
            console.log('   ❌ User not found!');
        } else {
            console.log('   ✅ User found');
            console.log('   • Client:', bakeryAdmin.client.name);
            console.log('   • Role:', bakeryAdmin.role?.name || 'N/A');
            console.log('   • Active:', bakeryAdmin.isActive);

            const passwordValid = await bcrypt.compare('admin123', bakeryAdmin.passwordHash);
            console.log('   • Password "admin123":', passwordValid ? '✅ VALID' : '❌ INVALID');
        }

        console.log('\n✅ Test completed!\n');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin();
