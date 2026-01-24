import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Creates Super Admin role in System client with platform management permissions.
 * Also creates the superadmin@system.local user.
 */
async function createSuperAdminRole(systemClientId: string) {
  console.log('\n👑 Creating Super Admin role...');

  const superAdminPermissions = [
    { resource: 'clients', action: 'view' },
    { resource: 'clients', action: 'create' },
    { resource: 'clients', action: 'edit' },
    { resource: 'clients', action: 'delete' },
    { resource: 'users', action: 'view' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'edit' },
    { resource: 'users', action: 'delete' },
    { resource: 'roles', action: 'view' },
    { resource: 'roles', action: 'create' },
    { resource: 'roles', action: 'edit' },
    { resource: 'roles', action: 'delete' },
    { resource: 'permissions', action: 'view' },
    { resource: 'settings', action: 'view' },
    { resource: 'settings', action: 'edit' },
  ];

  // Create Super Admin role
  let superAdminRole = await prisma.role.findFirst({
    where: {
      clientId: systemClientId,
      name: 'Super Admin',
    },
  });

  if (superAdminRole) {
    // Clear old permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: superAdminRole.id },
    });
  } else {
    superAdminRole = await prisma.role.create({
      data: {
        name: 'Super Admin',
        description: 'Platform administrator - manages clients, users, and roles across the entire system',
        clientId: systemClientId,
        isSystem: true,
      },
    });
  }

  // Add permissions
  let addedCount = 0;
  for (const permDef of superAdminPermissions) {
    let permission = await prisma.permission.findFirst({
      where: {
        resource: permDef.resource,
        action: permDef.action,
      },
    });

    if (!permission) {
      permission = await prisma.permission.create({
        data: {
          resource: permDef.resource,
          action: permDef.action,
          description: `${permDef.action} ${permDef.resource}`,
        },
      });
    }

    await prisma.rolePermission.create({
      data: {
        roleId: superAdminRole.id,
        permissionId: permission.id,
      },
    });
    addedCount++;
  }

  console.log(`   ✅ Super Admin role: ${addedCount} permissions`);

  // Create superadmin user
  console.log('👤 Creating superadmin user...');
  const superAdminUser = await prisma.user.create({
    data: {
      email: 'superadmin@system.local',
      passwordHash: await bcrypt.hash('super123', 12),
      firstName: 'Super',
      lastName: 'Admin',
      role: 'ADMIN',
      roleId: superAdminRole.id,
      clientId: systemClientId,
      isActive: true,
    },
  });
  console.log('✅ Created superadmin@system.local (Super Admin role)');
}

/**
 * Creates role templates in System client.
 * These templates are copied to all new clients automatically.
 * 
 * Template Roles:
 * - Admin (33 permissions): Full bakery operations
 * - Sales Manager (14 permissions): Customers & orders
 * - Inventory Manager (12 permissions): Inventory management
 * - Production Manager (12 permissions): Production & recipes
 */
async function createRoleTemplates(systemClientId: string) {
  console.log('\n🎨 Creating role templates in System client...');

  // Define template roles with their permissions
  const roleTemplates = [
    {
      name: 'Admin',
      description: 'Full access to all bakery operations and settings',
      permissions: [
        { resource: 'dashboard', action: 'view' },
        { resource: 'raw-materials', action: 'view' },
        { resource: 'raw-materials', action: 'create' },
        { resource: 'raw-materials', action: 'edit' },
        { resource: 'raw-materials', action: 'delete' },
        { resource: 'finished-products', action: 'view' },
        { resource: 'finished-products', action: 'create' },
        { resource: 'finished-products', action: 'edit' },
        { resource: 'finished-products', action: 'delete' },
        { resource: 'recipes', action: 'view' },
        { resource: 'recipes', action: 'create' },
        { resource: 'recipes', action: 'edit' },
        { resource: 'recipes', action: 'delete' },
        { resource: 'production', action: 'view' },
        { resource: 'production', action: 'create' },
        { resource: 'production', action: 'edit' },
        { resource: 'production', action: 'delete' },
        { resource: 'customers', action: 'view' },
        { resource: 'customers', action: 'create' },
        { resource: 'customers', action: 'edit' },
        { resource: 'customers', action: 'delete' },
        { resource: 'customer-orders', action: 'view' },
        { resource: 'customer-orders', action: 'create' },
        { resource: 'customer-orders', action: 'edit' },
        { resource: 'customer-orders', action: 'delete' },
        { resource: 'settings', action: 'view' },
        { resource: 'settings', action: 'edit' },
        { resource: 'users', action: 'view' },
        { resource: 'users', action: 'create' },
        { resource: 'users', action: 'edit' },
        { resource: 'users', action: 'delete' },
        { resource: 'roles', action: 'view' },
        { resource: 'reports', action: 'view' },
      ],
    },
    {
      name: 'Sales Manager',
      description: 'Manage customers, orders, and view inventory',
      permissions: [
        { resource: 'dashboard', action: 'view' },
        { resource: 'raw-materials', action: 'view' },
        { resource: 'finished-products', action: 'view' },
        { resource: 'recipes', action: 'view' },
        { resource: 'production', action: 'view' },
        { resource: 'customers', action: 'view' },
        { resource: 'customers', action: 'create' },
        { resource: 'customers', action: 'edit' },
        { resource: 'customers', action: 'delete' },
        { resource: 'customer-orders', action: 'view' },
        { resource: 'customer-orders', action: 'create' },
        { resource: 'customer-orders', action: 'edit' },
        { resource: 'customer-orders', action: 'delete' },
        { resource: 'reports', action: 'view' },
      ],
    },
    {
      name: 'Inventory Manager',
      description: 'Manage raw materials and finished products inventory',
      permissions: [
        { resource: 'dashboard', action: 'view' },
        { resource: 'raw-materials', action: 'view' },
        { resource: 'raw-materials', action: 'create' },
        { resource: 'raw-materials', action: 'edit' },
        { resource: 'raw-materials', action: 'delete' },
        { resource: 'finished-products', action: 'view' },
        { resource: 'finished-products', action: 'create' },
        { resource: 'finished-products', action: 'edit' },
        { resource: 'finished-products', action: 'delete' },
        { resource: 'recipes', action: 'view' },
        { resource: 'production', action: 'view' },
        { resource: 'reports', action: 'view' },
      ],
    },
    {
      name: 'Production Manager',
      description: 'Manage production, recipes, and view inventory',
      permissions: [
        { resource: 'dashboard', action: 'view' },
        { resource: 'raw-materials', action: 'view' },
        { resource: 'finished-products', action: 'view' },
        { resource: 'recipes', action: 'view' },
        { resource: 'recipes', action: 'create' },
        { resource: 'recipes', action: 'edit' },
        { resource: 'recipes', action: 'delete' },
        { resource: 'production', action: 'view' },
        { resource: 'production', action: 'create' },
        { resource: 'production', action: 'edit' },
        { resource: 'production', action: 'delete' },
        { resource: 'reports', action: 'view' },
      ],
    },
  ];

  for (const template of roleTemplates) {
    // Check if template role already exists
    let role = await prisma.role.findFirst({
      where: {
        clientId: systemClientId,
        name: template.name,
      },
    });

    if (role) {
      // Update existing role to be a template
      await prisma.role.update({
        where: { id: role.id },
        data: {
          description: template.description,
          isSystem: true,
        },
      });
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
          clientId: systemClientId,
          isSystem: true,
        },
      });
    }

    // Add permissions
    let addedCount = 0;
    for (const permDef of template.permissions) {
      // Find or create permission
      let permission = await prisma.permission.findFirst({
        where: {
          resource: permDef.resource,
          action: permDef.action,
        },
      });

      if (!permission) {
        // Create permission if it doesn't exist
        permission = await prisma.permission.create({
          data: {
            resource: permDef.resource,
            action: permDef.action,
            description: `${permDef.action} ${permDef.resource}`,
          },
        });
      }

      // Link permission to role
      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
      addedCount++;
    }

    console.log(`   ✅ ${template.name}: ${addedCount} permissions`);
  }

  console.log('✅ Role templates created in System client');
}

/**
 * SAFETY CHECK: Prevent accidental data loss
 * This seed script WIPES ALL DATA - use with caution!
 */
async function confirmDataWipe(): Promise<boolean> {
  const dbUrl = process.env.DATABASE_URL || '';
  const isProduction = dbUrl.includes('neon.tech') || dbUrl.includes('railway') || dbUrl.includes('render');
  const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

  // Allow automatic seeding in production/CI environments
  if (process.env.CI === 'true' || process.env.RAILWAY_ENVIRONMENT || process.env.RENDER) {
    console.log('🤖 CI/Production environment detected - proceeding automatically');
    return true;
  }

  // Skip confirmation for development (set SKIP_CONFIRM=true in .env for faster workflow)
  if (process.env.SKIP_CONFIRM === 'true') {
    console.log('⚡ SKIP_CONFIRM=true - proceeding automatically');
    return true;
  }

  // Force confirmation flag
  if (process.argv.includes('--force') || process.argv.includes('-f')) {
    console.log('⚠️  --force flag detected - skipping confirmation');
    return true;
  }

  // For localhost, require explicit confirmation
  if (isLocalhost) {
    console.log('\n⚠️  ═══════════════════════════════════════════════════════════');
    console.log('⚠️  WARNING: You are about to DELETE ALL DATA in your database!');
    console.log('⚠️  Database:', dbUrl.split('@')[1]?.split('?')[0] || 'local');
    console.log('⚠️  ═══════════════════════════════════════════════════════════');
    console.log('⚠️  TIP: Add SKIP_CONFIRM=true to .env to skip this prompt\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Type "DELETE ALL DATA" to confirm: ', (answer) => {
        rl.close();
        if (answer === 'DELETE ALL DATA') {
          console.log('✅ Confirmed - proceeding with seed\n');
          resolve(true);
        } else {
          console.log('❌ Cancelled - your data is safe');
          resolve(false);
        }
      });
    });
  }

  return true;
}

async function main() {
  console.log('🌱 Starting seed...');

  // SAFETY CHECK
  const confirmed = await confirmDataWipe();
  if (!confirmed) {
    console.log('\n✋ Seed cancelled - no changes made');
    process.exit(0);
  }

  // Delete existing data in reverse order (to respect foreign keys)
  console.log('🗑️  Cleaning existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.customerOrder.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.productionStep.deleteMany();
  await prisma.productionRun.deleteMany();
  await prisma.recipeIngredient.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.finishedProduct.deleteMany();
  await prisma.rawMaterial.deleteMany();
  await prisma.qualityStatus.deleteMany();
  await prisma.storageLocation.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.category.deleteMany();
  await prisma.client.deleteMany();
  console.log('✅ Cleaned existing data');

  // Create System client for Super Admin (platform management)
  console.log('🏢 Creating System client...');
  const systemClient = await prisma.client.create({
    data: {
      name: 'System',
      email: 'system@rapidpro.local',
      subscriptionPlan: 'ENTERPRISE',
      slug: 'system',
      isActive: true,
    }
  });
  console.log('✅ Created System client:', systemClient.id);

  // Create role templates in System client (will be copied to new clients)
  await createRoleTemplates(systemClient.id);

  // Create Super Admin role and user
  await createSuperAdminRole(systemClient.id);

  // Create Demo Bakery client (for bakery operations)
  console.log('🏢 Creating Demo Bakery client...');
  const client = await prisma.client.create({
    data: {
      name: 'Demo Bakery',
      email: 'admin@demobakery.com',
      subscriptionPlan: 'TRIAL',
      slug: 'demo-bakery'
    }
  });
  console.log('✅ Created Demo Bakery client:', client.id);

  // Copy role templates from System client to Demo Bakery
  console.log('\n📋 Copying role templates to Demo Bakery...');
  const roleTemplates = await prisma.role.findMany({
    where: {
      clientId: systemClient.id,
      isSystem: true,
      NOT: { name: 'Super Admin' }, // Don't copy Super Admin role
    },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });

  for (const template of roleTemplates) {
    // Create role copy for this client
    const newRole = await prisma.role.create({
      data: {
        name: template.name,
        description: template.description,
        isSystem: false, // Client role, not template
        clientId: client.id,
      },
    });

    // Copy all permissions
    for (const rp of template.permissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: newRole.id,
          permissionId: rp.permission.id,
        },
      });
    }

    console.log(`   ✅ Copied role: ${template.name} (${template.permissions.length} permissions)`);
  }
  console.log('✅ Role templates copied to Demo Bakery');

  // Get the Admin role for this client
  const adminRole = await prisma.role.findFirst({
    where: {
      clientId: client.id,
      name: 'Admin',
    },
  });

  if (!adminRole) {
    throw new Error('Admin role not found for Demo Bakery client');
  }

  // Create bakery admin user (for bakery operations)
  console.log('👤 Creating bakery admin user...');
  const testUser = await prisma.user.create({
    data: {
      email: 'admin@demobakery.com',
      passwordHash: '$2a$12$rFp1Y7/yQv99sRnLbyPqDeQzqQRrvrs6upuDvn9KI7rzAWOtL769m', // hashed version of 'admin123'
      firstName: 'Demo',
      lastName: 'Admin',
      role: 'ADMIN',
      roleId: adminRole.id, // Assign Admin role from templates
      clientId: client.id,
      isActive: true
    }
  });
  console.log('✅ Created test user:', testUser.email, '(Role: Admin)');

  // Create categories
  const categories = await Promise.all([
    // Raw Material Categories
    prisma.category.create({
      data: { name: 'Flour', type: 'RAW_MATERIAL', description: 'Various types of flour', clientId: client.id }
    }),
    prisma.category.create({
      data: { name: 'Sugar', type: 'RAW_MATERIAL', description: 'Sweeteners and sugars', clientId: client.id }
    }),
    prisma.category.create({
      data: { name: 'Dairy', type: 'RAW_MATERIAL', description: 'Milk, butter, cream', clientId: client.id }
    }),
    prisma.category.create({
      data: { name: 'Ingredients', type: 'RAW_MATERIAL', description: 'General baking ingredients', clientId: client.id }
    }),

    // Finished Product Categories
    prisma.category.create({
      data: { name: 'Breads', type: 'FINISHED_PRODUCT', description: 'All types of bread', clientId: client.id }
    }),
    prisma.category.create({
      data: { name: 'Pastries', type: 'FINISHED_PRODUCT', description: 'Croissants, danishes, etc.', clientId: client.id }
    }),
    prisma.category.create({
      data: { name: 'Cakes', type: 'FINISHED_PRODUCT', description: 'Cakes and layer cakes', clientId: client.id }
    }),

    // Recipe Categories
    prisma.category.create({
      data: { name: 'Baking', type: 'RECIPE', description: 'Baked goods recipes', clientId: client.id }
    })
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Premium Flour Co.',
        contactInfo: { email: 'contact@premiumflour.com', phone: '+1-555-0101' },
        address: '123 Mill St, Wheat Valley, CA 90210',
        isActive: true,
        clientId: client.id
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Sweet Supply Inc.',
        contactInfo: { email: 'info@sweetsupply.com', phone: '+1-555-0202' },
        address: '456 Sugar Ave, Sweettown, TX 75001',
        isActive: true,
        clientId: client.id
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Dairy Fresh Ltd.',
        contactInfo: { email: 'sales@dairyfresh.com', phone: '+1-555-0303' },
        address: '789 Cream Blvd, Milktown, WI 53001',
        isActive: true,
        clientId: client.id
      }
    })
  ]);

  console.log(`✅ Created ${suppliers.length} suppliers`);

  // Create storage locations
  const storageLocations = await Promise.all([
    prisma.storageLocation.create({
      data: {
        name: 'Dry Storage A',
        type: 'Dry',
        description: 'Temperature controlled dry storage',
        capacity: '500kg',
        clientId: client.id
      }
    }),
    prisma.storageLocation.create({
      data: {
        name: 'Refrigerator B',
        type: 'Cold',
        description: 'Refrigerated storage 2-4°C',
        capacity: '200kg',
        clientId: client.id
      }
    }),
    prisma.storageLocation.create({
      data: {
        name: 'Freezer C',
        type: 'Frozen',
        description: 'Frozen storage -18°C',
        capacity: '150kg',
        clientId: client.id
      }
    }),
    prisma.storageLocation.create({
      data: {
        name: 'Production Area',
        type: 'Work',
        description: 'Active production workspace',
        capacity: '50kg',
        clientId: client.id
      }
    })
  ]);

  console.log(`✅ Created ${storageLocations.length} storage locations`);

  // Create standard units (comprehensive list for bakery operations)
  console.log('📏 Creating standard units...');
  const units = await Promise.all([
    // Weight units (metric)
    prisma.unit.create({
      data: { name: 'Kilogram', symbol: 'kg', category: 'weight', description: 'Standard unit of mass (1000g)' }
    }),
    prisma.unit.create({
      data: { name: 'Gram', symbol: 'g', category: 'weight', description: 'Small unit of mass' }
    }),
    prisma.unit.create({
      data: { name: 'Milligram', symbol: 'mg', category: 'weight', description: 'Tiny unit of mass (for spices)' }
    }),

    // Weight units (imperial)
    prisma.unit.create({
      data: { name: 'Pound', symbol: 'lb', category: 'weight', description: 'Imperial unit of mass (16 oz)' }
    }),
    prisma.unit.create({
      data: { name: 'Ounce', symbol: 'oz', category: 'weight', description: 'Small imperial unit of mass' }
    }),

    // Volume units (metric)
    prisma.unit.create({
      data: { name: 'Liter', symbol: 'L', category: 'volume', description: 'Standard unit of volume (1000ml)' }
    }),
    prisma.unit.create({
      data: { name: 'Milliliter', symbol: 'ml', category: 'volume', description: 'Small unit of volume' }
    }),
    prisma.unit.create({
      data: { name: 'Deciliter', symbol: 'dl', category: 'volume', description: 'Metric volume (100ml)' }
    }),

    // Volume units (cooking)
    prisma.unit.create({
      data: { name: 'Cup', symbol: 'cup', category: 'volume', description: 'Cooking measurement (~240ml)' }
    }),
    prisma.unit.create({
      data: { name: 'Tablespoon', symbol: 'tbsp', category: 'volume', description: 'Small cooking measurement (~15ml)' }
    }),
    prisma.unit.create({
      data: { name: 'Teaspoon', symbol: 'tsp', category: 'volume', description: 'Smallest cooking measurement (~5ml)' }
    }),

    // Volume units (imperial)
    prisma.unit.create({
      data: { name: 'Gallon', symbol: 'gal', category: 'volume', description: 'Large imperial volume (~3.79L)' }
    }),
    prisma.unit.create({
      data: { name: 'Quart', symbol: 'qt', category: 'volume', description: 'Imperial volume (~0.95L)' }
    }),
    prisma.unit.create({
      data: { name: 'Pint', symbol: 'pt', category: 'volume', description: 'Imperial volume (~0.47L)' }
    }),
    prisma.unit.create({
      data: { name: 'Fluid Ounce', symbol: 'fl oz', category: 'volume', description: 'Small imperial volume (~30ml)' }
    }),

    // Count units
    prisma.unit.create({
      data: { name: 'Piece', symbol: 'pcs', category: 'count', description: 'Individual items' }
    }),
    prisma.unit.create({
      data: { name: 'Dozen', symbol: 'dz', category: 'count', description: 'Group of 12 items' }
    }),
    prisma.unit.create({
      data: { name: 'Package', symbol: 'pkg', category: 'count', description: 'Packaged items' }
    }),
    prisma.unit.create({
      data: { name: 'Box', symbol: 'box', category: 'count', description: 'Boxed items' }
    }),
    prisma.unit.create({
      data: { name: 'Bag', symbol: 'bag', category: 'count', description: 'Bagged items' }
    }),
    prisma.unit.create({
      data: { name: 'Unit', symbol: 'unit', category: 'count', description: 'Generic unit' }
    })
  ]);

  console.log(`✅ Created ${units.length} standard units (weight: ${units.filter(u => u.category === 'weight').length}, volume: ${units.filter(u => u.category === 'volume').length}, count: ${units.filter(u => u.category === 'count').length})`);

  // Create quality statuses
  const qualityStatuses = await Promise.all([
    prisma.qualityStatus.create({
      data: {
        name: 'Good',
        description: 'Good quality, ready for use',
        color: '#4CAF50',
        clientId: client.id
      }
    }),
    prisma.qualityStatus.create({
      data: {
        name: 'Acceptable',
        description: 'Acceptable quality with minor issues',
        color: '#FF9800',
        clientId: client.id
      }
    }),
    prisma.qualityStatus.create({
      data: {
        name: 'Poor',
        description: 'Poor quality, needs inspection',
        color: '#F44336',
        clientId: client.id
      }
    })
  ]);

  console.log(`✅ Created ${qualityStatuses.length} quality statuses`);

  // Create recipes
  const recipes = await Promise.all([
    prisma.recipe.create({
      data: {
        name: 'Basic Bread Dough Recipe',
        description: 'Standard bread dough for various bread types',
        categoryId: categories[7].id, // Recipe category (Baking)
        yieldQuantity: 10,
        yieldUnit: 'kg',
        prepTime: 45,
        instructions: JSON.stringify([
          'Mix flour, water, yeast, and salt',
          'Knead for 10 minutes',
          'First rise: 1 hour',
          'Shape and second rise: 30 minutes'
        ]),
        // Production fields
        emoji: '🍞',
        difficulty: 'MEDIUM',
        estimatedTotalTime: 135, // 45 min prep + 90 min rise times
        equipmentRequired: [
          'Stand mixer or mixing bowl',
          'Kitchen scale',
          'Proofing baskets',
          'Oven with steam capability'
        ],
        clientId: client.id
      }
    }),
    prisma.recipe.create({
      data: {
        name: 'Vanilla Pastry Cream Recipe',
        description: 'Classic pastry cream for various applications',
        categoryId: categories[7].id, // Recipe category (Baking)
        yieldQuantity: 5,
        yieldUnit: 'L',
        prepTime: 30,
        instructions: JSON.stringify([
          'Heat milk with vanilla',
          'Whisk egg yolks with sugar',
          'Temper and cook until thick',
          'Strain and cool'
        ]),
        // Production fields
        emoji: '🍰',
        difficulty: 'EASY',
        estimatedTotalTime: 45, // 30 min prep + 15 min cooling
        equipmentRequired: [
          'Heavy-bottom saucepan',
          'Whisk',
          'Strainer',
          'Digital thermometer'
        ],
        clientId: client.id
      }
    })
  ]);

  console.log(`✅ Created ${recipes.length} recipes`);

  // Create some raw materials
  const rawMaterials = await Promise.all([
    prisma.rawMaterial.create({
      data: {
        name: 'Bread Flour',
        description: 'High protein bread flour',
        categoryId: categories[0].id, // Flour category
        supplierId: suppliers[0].id,
        batchNumber: 'BF2024001',
        purchaseDate: new Date('2024-08-01'),
        expirationDate: new Date('2025-02-01'),
        quantity: 50,
        unit: 'kg',
        unitPrice: 2.50,
        reorderLevel: 10,
        storageLocationId: storageLocations[0].id,
        qualityStatusId: qualityStatuses[0].id,
        isContaminated: false,
        clientId: client.id
      }
    }),
    prisma.rawMaterial.create({
      data: {
        name: 'Granulated Sugar',
        description: 'Fine granulated white sugar',
        categoryId: categories[1].id, // Sugar category
        supplierId: suppliers[1].id,
        batchNumber: 'GS2024001',
        purchaseDate: new Date('2024-08-05'),
        expirationDate: new Date('2026-08-05'),
        quantity: 25,
        unit: 'kg',
        unitPrice: 1.80,
        reorderLevel: 5,
        storageLocationId: storageLocations[0].id,
        qualityStatusId: qualityStatuses[0].id,
        isContaminated: false,
        clientId: client.id
      }
    }),
    prisma.rawMaterial.create({
      data: {
        name: 'Heavy Cream',
        description: '35% fat heavy cream',
        categoryId: categories[2].id, // Dairy category
        supplierId: suppliers[2].id,
        batchNumber: 'HC2024001',
        purchaseDate: new Date('2024-08-20'),
        expirationDate: new Date('2024-08-27'),
        quantity: 10,
        unit: 'L',
        unitPrice: 5.50,
        reorderLevel: 2,
        storageLocationId: storageLocations[1].id,
        qualityStatusId: qualityStatuses[0].id,
        isContaminated: false,
        clientId: client.id
      }
    })
  ]);

  console.log(`✅ Created ${rawMaterials.length} raw materials`);

  // Create finished products
  const finishedProducts = await Promise.all([
    prisma.finishedProduct.create({
      data: {
        name: 'Artisan Sourdough Bread',
        description: 'Traditional sourdough bread with crispy crust',
        categoryId: categories[4].id, // Breads category
        sku: 'BRD-SD-001',
        batchNumber: 'BSB001',
        productionDate: new Date('2024-08-24'),
        expirationDate: new Date('2024-08-30'),
        shelfLife: 6,
        quantity: 30,
        unit: 'pcs',
        salePrice: 6.99,
        costToProduce: 2.50,
        storageLocationId: storageLocations[0].id,
        qualityStatusId: qualityStatuses[0].id,
        status: 'COMPLETED',
        clientId: client.id
      }
    }),
    prisma.finishedProduct.create({
      data: {
        name: 'Chocolate Croissant',
        description: 'Butter croissant with chocolate filling',
        categoryId: categories[5].id, // Pastries category
        sku: 'PST-CC-001',
        batchNumber: 'CC001',
        productionDate: new Date('2024-08-25'),
        expirationDate: new Date('2024-08-27'),
        shelfLife: 2,
        quantity: 50,
        unit: 'pcs',
        salePrice: 3.99,
        costToProduce: 1.20,
        storageLocationId: storageLocations[0].id,
        qualityStatusId: qualityStatuses[0].id,
        status: 'COMPLETED',
        clientId: client.id
      }
    }),
    prisma.finishedProduct.create({
      data: {
        name: 'Classic Baguette',
        description: 'Traditional French baguette',
        categoryId: categories[4].id, // Breads category
        sku: 'BRD-BG-001',
        batchNumber: 'BG001',
        productionDate: new Date('2024-08-25'),
        expirationDate: new Date('2024-08-26'),
        shelfLife: 1,
        quantity: 40,
        unit: 'pcs',
        salePrice: 4.50,
        costToProduce: 1.50,
        storageLocationId: storageLocations[0].id,
        qualityStatusId: qualityStatuses[0].id,
        status: 'COMPLETED',
        clientId: client.id
      }
    })
  ]);

  console.log(`✅ Created ${finishedProducts.length} finished products`);

  // Create SKU mappings from raw materials and finished products
  console.log('\n📦 Creating SKU mappings...');
  const skuMappingsToCreate = [];

  // Add raw materials to SKU mappings
  for (const material of rawMaterials) {
    skuMappingsToCreate.push({
      name: material.name,
      sku: material.sku || material.name.toUpperCase().replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, '-'),
      description: material.description,
      categoryId: material.categoryId,
      storageLocationId: material.storageLocationId,
      unitPrice: material.unitPrice,
      unit: material.unit,
      reorderLevel: material.reorderLevel,
      clientId: client.id,
    });
  }

  // Add finished products to SKU mappings
  for (const product of finishedProducts) {
    skuMappingsToCreate.push({
      name: product.name,
      sku: product.sku || product.name.toUpperCase().replace(/[^A-Z0-9\s]/g, '').replace(/\s+/g, '-'),
      description: product.description,
      categoryId: product.categoryId,
      storageLocationId: product.storageLocationId,
      unitPrice: product.salePrice,
      unit: product.unit,
      reorderLevel: undefined,
      clientId: client.id,
    });
  }

  // Create all SKU mappings
  const createdSkuMappings = await Promise.all(
    skuMappingsToCreate.map((mapping) => prisma.skuMapping.create({ data: mapping }))
  );

  console.log(`✅ Created ${createdSkuMappings.length} SKU mappings`);

  // Verify created users
  await verifySeededUsers();

  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('🎉 DATABASE SEED COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(70));
  console.log('\n📊 Summary:');
  console.log('   • 2 Clients (System + Demo Bakery)');
  console.log('   • 2 Users (superadmin + bakery admin)');
  console.log(`   • ${categories.length} Categories`);
  console.log(`   • ${suppliers.length} Suppliers`);
  console.log(`   • ${storageLocations.length} Storage Locations`);
  console.log(`   • ${units.length} Standard Units`);
  console.log(`   • ${qualityStatuses.length} Quality Statuses`);
  console.log(`   • ${recipes.length} Recipes`);
  console.log(`   • ${rawMaterials.length} Raw Materials`);
  console.log(`   • ${finishedProducts.length} Finished Products`);
  console.log(`   • ${rawMaterials.length + finishedProducts.length} SKU Mappings`);
  console.log('   • 5 Role Templates (Super Admin + 4 Bakery roles)');
  console.log('\n🔐 Login Credentials:');
  console.log('   Platform Admin:');
  console.log('     Email: superadmin@system.local');
  console.log('     Password: super123');
  console.log('   Bakery Admin:');
  console.log('     Email: admin@demobakery.com');
  console.log('     Password: admin123');
  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Verify that seeded users can authenticate and have correct permissions
 */
async function verifySeededUsers() {
  console.log('\n🧪 Verifying seeded users...');

  try {
    // Test admin@demobakery.com
    const bakeryAdmin = await prisma.user.findUnique({
      where: { email: 'admin@demobakery.com' },
      include: {
        client: true,
        customRole: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!bakeryAdmin) {
      throw new Error('❌ Bakery admin user not found!');
    }

    // Verify password hash exists
    if (!bakeryAdmin.passwordHash || bakeryAdmin.passwordHash.length < 10) {
      throw new Error('❌ Bakery admin has invalid password hash!');
    }

    // Verify role assignment
    if (!bakeryAdmin.roleId) {
      throw new Error('❌ Bakery admin has no roleId assigned!');
    }

    // Verify permissions
    if (!bakeryAdmin.customRole) {
      throw new Error('❌ Bakery admin has no customRole!');
    }

    const bakeryAdminPermCount = bakeryAdmin.customRole.permissions.length;
    if (bakeryAdminPermCount !== 33) {
      throw new Error(`❌ Bakery admin should have 33 permissions, has ${bakeryAdminPermCount}!`);
    }

    // Verify password works
    const passwordValid = await bcrypt.compare('admin123', bakeryAdmin.passwordHash);
    if (!passwordValid) {
      throw new Error('❌ Bakery admin password verification failed!');
    }

    console.log('   ✅ admin@demobakery.com');
    console.log(`      • Client: ${bakeryAdmin.client.name}`);
    console.log(`      • Role: ${bakeryAdmin.customRole.name}`);
    console.log(`      • Permissions: ${bakeryAdminPermCount}`);
    console.log(`      • Password: Valid`);

    // Test superadmin@system.local
    const superAdmin = await prisma.user.findUnique({
      where: { email: 'superadmin@system.local' },
      include: {
        client: true,
        customRole: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!superAdmin) {
      throw new Error('❌ Super admin user not found!');
    }

    // Verify password hash exists
    if (!superAdmin.passwordHash || superAdmin.passwordHash.length < 10) {
      throw new Error('❌ Super admin has invalid password hash!');
    }

    // Verify role assignment
    if (!superAdmin.roleId) {
      throw new Error('❌ Super admin has no roleId assigned!');
    }

    // Verify permissions
    if (!superAdmin.customRole) {
      throw new Error('❌ Super admin has no customRole!');
    }

    const superAdminPermCount = superAdmin.customRole.permissions.length;
    if (superAdminPermCount !== 15) {
      throw new Error(`❌ Super admin should have 15 permissions, has ${superAdminPermCount}!`);
    }

    // Verify password works
    const superPasswordValid = await bcrypt.compare('super123', superAdmin.passwordHash);
    if (!superPasswordValid) {
      throw new Error('❌ Super admin password verification failed!');
    }

    console.log('   ✅ superadmin@system.local');
    console.log(`      • Client: ${superAdmin.client.name}`);
    console.log(`      • Role: ${superAdmin.customRole.name}`);
    console.log(`      • Permissions: ${superAdminPermCount}`);
    console.log(`      • Password: Valid`);

    console.log('\n✅ All seeded users verified successfully!');
  } catch (error) {
    console.error('\n❌ User verification failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
