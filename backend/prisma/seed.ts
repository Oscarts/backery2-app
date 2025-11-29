import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

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

  // Create client first (required for multi-tenant isolation)
  console.log('🏢 Creating test client...');
  const client = await prisma.client.create({
    data: {
      name: 'Demo Bakery',
      email: 'admin@demobakery.com',
      subscriptionPlan: 'TRIAL',
      slug: 'demo-bakery'
    }
  });
  console.log('✅ Created test client:', client.id);

  // Create test user for this client
  console.log('👤 Creating test user...');
  const testUser = await prisma.user.create({
    data: {
      email: 'admin@demobakery.com',
      passwordHash: '$2a$12$rFp1Y7/yQv99sRnLbyPqDeQzqQRrvrs6upuDvn9KI7rzAWOtL769m', // hashed version of 'admin123'
      firstName: 'Demo',
      lastName: 'Admin',
      role: 'ADMIN',
      clientId: client.id,
      isActive: true
    }
  });
  console.log('✅ Created test user:', testUser.email);

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

  // Create units
  const units = await Promise.all([
    // Weight units
    prisma.unit.create({
      data: { name: 'Kilogram', symbol: 'kg', category: 'weight', description: 'Standard unit of mass' }
    }),
    prisma.unit.create({
      data: { name: 'Gram', symbol: 'g', category: 'weight', description: 'Small unit of mass' }
    }),
    prisma.unit.create({
      data: { name: 'Pound', symbol: 'lb', category: 'weight', description: 'Imperial unit of mass' }
    }),
    prisma.unit.create({
      data: { name: 'Ounce', symbol: 'oz', category: 'weight', description: 'Small imperial unit of mass' }
    }),

    // Volume units
    prisma.unit.create({
      data: { name: 'Liter', symbol: 'L', category: 'volume', description: 'Standard unit of volume' }
    }),
    prisma.unit.create({
      data: { name: 'Milliliter', symbol: 'ml', category: 'volume', description: 'Small unit of volume' }
    }),
    prisma.unit.create({
      data: { name: 'Cup', symbol: 'cup', category: 'volume', description: 'Cooking measurement' }
    }),
    prisma.unit.create({
      data: { name: 'Tablespoon', symbol: 'tbsp', category: 'volume', description: 'Small cooking measurement' }
    }),
    prisma.unit.create({
      data: { name: 'Teaspoon', symbol: 'tsp', category: 'volume', description: 'Smallest cooking measurement' }
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
    })
  ]);

  console.log(`✅ Created ${units.length} units`);

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

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
