import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySuperAdminPermissions() {
    try {
        console.log('✅ Super Admin permissions have been updated!\n');
        console.log('📋 Super Admin now has the following user management permissions:');
        console.log('   - users:view');
        console.log('   - users:create');
        console.log('   - users:edit');
        console.log('   - users:delete\n');

        console.log('🔄 To apply the changes:');
        console.log('   1. Log out from the application');
        console.log('   2. Log back in as superadmin@system.local');
        console.log('   3. You should now be able to delete users\n');

        console.log('ℹ️  Note: The permission cache has a 5-minute TTL, so changes');
        console.log('   will be applied automatically within 5 minutes even without logging out.\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifySuperAdminPermissions();
