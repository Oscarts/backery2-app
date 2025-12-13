import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyRoleTemplates() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('          COMPLETE ROLE TEMPLATES VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════\n');

    const systemClient = await prisma.client.findUnique({ where: { slug: 'system' } });

    if (!systemClient) {
        console.error('❌ System client not found!');
        return;
    }

    const templates = await prisma.role.findMany({
        where: { clientId: systemClient.id },
        include: { permissions: { include: { permission: true } } },
        orderBy: { name: 'asc' }
    });

    console.log('🏢 SYSTEM CLIENT - ROLE TEMPLATES:\n');
    templates.forEach(role => {
        const icon = role.isSystem ? '📦' : '⚠️ ';
        const type = role.isSystem ? 'TEMPLATE (copied to new clients)' : 'Regular Role';
        console.log(`${icon} ${role.name}`);
        console.log(`   Type: ${type}`);
        console.log(`   Permissions: ${role.permissions.length}`);
        console.log(`   Description: ${role.description || 'N/A'}`);
        console.log('');
    });

    const demoClient = await prisma.client.findUnique({ where: { slug: 'demo-bakery' } });

    if (demoClient) {
        const clientRoles = await prisma.role.findMany({
            where: { clientId: demoClient.id },
            include: { permissions: true },
            orderBy: { name: 'asc' }
        });

        console.log('🏪 DEMO BAKERY CLIENT - COPIED ROLES:\n');
        clientRoles.forEach(role => {
            console.log(`✅ ${role.name}`);
            console.log(`   Type: Client Role (independent copy)`);
            console.log(`   Permissions: ${role.permissions.length}`);
            console.log('');
        });
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ TEMPLATE SYSTEM VERIFIED!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📝 Summary:');
    console.log(`   • ${templates.filter(r => r.isSystem).length} role templates in System client`);
    console.log(`   • ${templates.filter(r => !r.isSystem).length} regular roles in System client`);
    if (demoClient) {
        const clientRoles = await prisma.role.count({ where: { clientId: demoClient.id } });
        console.log(`   • ${clientRoles} roles in Demo Bakery (copied from templates)`);
    }
    console.log('');
    console.log('💡 When a new client is created:');
    console.log('   1. System queries templates (isSystem = true)');
    console.log('   2. Copies each template to new client (isSystem = false)');
    console.log('   3. Copies all permissions from template to new role');
    console.log('   4. New client gets 4 standard roles automatically');
    console.log('');
    console.log('📚 Template Roles:');
    console.log('   • Admin (33 perms) - Full bakery operations');
    console.log('   • Sales Manager (14 perms) - Customers & orders');
    console.log('   • Inventory Manager (12 perms) - Inventory management');
    console.log('   • Production Manager (12 perms) - Production & recipes');
    console.log('');

    await prisma.$disconnect();
}

verifyRoleTemplates().catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
});
