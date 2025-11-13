import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createRoleTemplates() {
  console.log('🎨 Creating role templates in System client...\n');

  // Get system client
  const systemClient = await prisma.client.findUnique({
    where: { slug: 'system' },
  });

  if (!systemClient) {
    console.error('❌ System client not found!');
    return;
  }

  // Define template roles with their permissions
  const roleTemplates = [
    {
      name: 'Admin',
      description: 'Full access to all bakery operations and settings',
      permissions: [
        // Dashboard
        { resource: 'dashboard', action: 'view' },
        // Raw Materials
        { resource: 'raw-materials', action: 'view' },
        { resource: 'raw-materials', action: 'create' },
        { resource: 'raw-materials', action: 'edit' },
        { resource: 'raw-materials', action: 'delete' },
        // Finished Products
        { resource: 'finished-products', action: 'view' },
        { resource: 'finished-products', action: 'create' },
        { resource: 'finished-products', action: 'edit' },
        { resource: 'finished-products', action: 'delete' },
        // Recipes
        { resource: 'recipes', action: 'view' },
        { resource: 'recipes', action: 'create' },
        { resource: 'recipes', action: 'edit' },
        { resource: 'recipes', action: 'delete' },
        // Production
        { resource: 'production', action: 'view' },
        { resource: 'production', action: 'create' },
        { resource: 'production', action: 'edit' },
        { resource: 'production', action: 'delete' },
        // Customers
        { resource: 'customers', action: 'view' },
        { resource: 'customers', action: 'create' },
        { resource: 'customers', action: 'edit' },
        { resource: 'customers', action: 'delete' },
        // Customer Orders
        { resource: 'customer-orders', action: 'view' },
        { resource: 'customer-orders', action: 'create' },
        { resource: 'customer-orders', action: 'edit' },
        { resource: 'customer-orders', action: 'delete' },
        // Settings
        { resource: 'settings', action: 'view' },
        { resource: 'settings', action: 'edit' },
        // Users
        { resource: 'users', action: 'view' },
        { resource: 'users', action: 'create' },
        { resource: 'users', action: 'edit' },
        { resource: 'users', action: 'delete' },
        // Roles (view only for seeing dropdown)
        { resource: 'roles', action: 'view' },
        // Reports
        { resource: 'reports', action: 'view' },
      ],
    },
    {
      name: 'Sales Manager',
      description: 'Manage customers, orders, and view inventory',
      permissions: [
        // Dashboard
        { resource: 'dashboard', action: 'view' },
        // Raw Materials (view only)
        { resource: 'raw-materials', action: 'view' },
        // Finished Products (view only)
        { resource: 'finished-products', action: 'view' },
        // Recipes (view only)
        { resource: 'recipes', action: 'view' },
        // Production (view only)
        { resource: 'production', action: 'view' },
        // Customers (full access)
        { resource: 'customers', action: 'view' },
        { resource: 'customers', action: 'create' },
        { resource: 'customers', action: 'edit' },
        { resource: 'customers', action: 'delete' },
        // Customer Orders (full access)
        { resource: 'customer-orders', action: 'view' },
        { resource: 'customer-orders', action: 'create' },
        { resource: 'customer-orders', action: 'edit' },
        { resource: 'customer-orders', action: 'delete' },
        // Reports
        { resource: 'reports', action: 'view' },
      ],
    },
    {
      name: 'Inventory Manager',
      description: 'Manage raw materials and finished products inventory',
      permissions: [
        // Dashboard
        { resource: 'dashboard', action: 'view' },
        // Raw Materials (full access)
        { resource: 'raw-materials', action: 'view' },
        { resource: 'raw-materials', action: 'create' },
        { resource: 'raw-materials', action: 'edit' },
        { resource: 'raw-materials', action: 'delete' },
        // Finished Products (full access)
        { resource: 'finished-products', action: 'view' },
        { resource: 'finished-products', action: 'create' },
        { resource: 'finished-products', action: 'edit' },
        { resource: 'finished-products', action: 'delete' },
        // Recipes (view only)
        { resource: 'recipes', action: 'view' },
        // Production (view only)
        { resource: 'production', action: 'view' },
        // Reports
        { resource: 'reports', action: 'view' },
      ],
    },
    {
      name: 'Production Manager',
      description: 'Manage production, recipes, and view inventory',
      permissions: [
        // Dashboard
        { resource: 'dashboard', action: 'view' },
        // Raw Materials (view only)
        { resource: 'raw-materials', action: 'view' },
        // Finished Products (view only)
        { resource: 'finished-products', action: 'view' },
        // Recipes (full access)
        { resource: 'recipes', action: 'view' },
        { resource: 'recipes', action: 'create' },
        { resource: 'recipes', action: 'edit' },
        { resource: 'recipes', action: 'delete' },
        // Production (full access)
        { resource: 'production', action: 'view' },
        { resource: 'production', action: 'create' },
        { resource: 'production', action: 'edit' },
        { resource: 'production', action: 'delete' },
        // Reports
        { resource: 'reports', action: 'view' },
      ],
    },
  ];

  console.log(`📋 Creating ${roleTemplates.length} role templates...\n`);

  for (const template of roleTemplates) {
    // Check if template role already exists
    let role = await prisma.role.findFirst({
      where: {
        clientId: systemClient.id,
        name: template.name,
      },
    });

    if (role) {
      // Update existing role to be a template
      role = await prisma.role.update({
        where: { id: role.id },
        data: {
          description: template.description,
          isSystem: true,
        },
      });
      console.log(`🔄 Updated existing role: ${template.name}`);
      
      // Delete existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id },
      });
    } else {
      // Create new template role
      role = await prisma.role.create({
        data: {
          name: template.name,
          description: template.description,
          clientId: systemClient.id,
          isSystem: true,
        },
      });
      console.log(`✨ Created new role template: ${template.name}`);
    }

    // Add permissions
    let addedCount = 0;
    for (const permDef of template.permissions) {
      const permission = await prisma.permission.findFirst({
        where: {
          resource: permDef.resource,
          action: permDef.action,
        },
      });

      if (permission) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
        addedCount++;
      } else {
        console.warn(`   ⚠️  Permission not found: ${permDef.resource}:${permDef.action}`);
      }
    }

    console.log(`   ✅ Added ${addedCount} permissions to ${template.name}\n`);
  }

  // Summary
  console.log('\n📊 Summary:');
  const templates = await prisma.role.findMany({
    where: {
      clientId: systemClient.id,
      isSystem: true,
    },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });

  for (const template of templates) {
    console.log(`\n📦 ${template.name} (${template.permissions.length} permissions)`);
    console.log(`   ${template.description}`);
  }

  console.log('\n✅ Role templates created successfully!');
  console.log('💡 These templates will be copied to all new clients.');

  await prisma.$disconnect();
}

createRoleTemplates().catch((e) => {
  console.error('❌ Error:', e);
  process.exit(1);
});
