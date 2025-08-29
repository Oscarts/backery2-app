import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create categories
  const categories = await Promise.all([
    // Raw Material Categories
    prisma.category.create({
      data: { name: 'Flour', type: 'RAW_MATERIAL', description: 'Various types of flour' }
    }),
    prisma.category.create({
      data: { name: 'Sugar', type: 'RAW_MATERIAL', description: 'Sweeteners and sugars' }
    }),
    prisma.category.create({
      data: { name: 'Dairy', type: 'RAW_MATERIAL', description: 'Milk, butter, cream' }
    }),

    // Intermediate Product Categories
    prisma.category.create({
      data: { name: 'Dough', type: 'INTERMEDIATE', description: 'Pre-made doughs and bases' }
    }),
    prisma.category.create({
      data: { name: 'Fillings', type: 'INTERMEDIATE', description: 'Creams, jams, and fillings' }
    }),
    prisma.category.create({
      data: { name: 'Glazes', type: 'INTERMEDIATE', description: 'Icings and glazes' }
    }),

    // Finished Product Categories
    prisma.category.create({
      data: { name: 'Breads', type: 'FINISHED_PRODUCT', description: 'All types of bread' }
    }),
    prisma.category.create({
      data: { name: 'Pastries', type: 'FINISHED_PRODUCT', description: 'Croissants, danishes, etc.' }
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
        isActive: true
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Sweet Supply Inc.',
        contactInfo: { email: 'info@sweetsupply.com', phone: '+1-555-0202' },
        address: '456 Sugar Ave, Sweettown, TX 75001',
        isActive: true
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Dairy Fresh Ltd.',
        contactInfo: { email: 'sales@dairyfresh.com', phone: '+1-555-0303' },
        address: '789 Cream Blvd, Milktown, WI 53001',
        isActive: true
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
        capacity: '500kg'
      }
    }),
    prisma.storageLocation.create({
      data: {
        name: 'Refrigerator B',
        type: 'Cold',
        description: 'Refrigerated storage 2-4°C',
        capacity: '200kg'
      }
    }),
    prisma.storageLocation.create({
      data: {
        name: 'Freezer C',
        type: 'Frozen',
        description: 'Frozen storage -18°C',
        capacity: '150kg'
      }
    }),
    prisma.storageLocation.create({
      data: {
        name: 'Production Area',
        type: 'Work',
        description: 'Active production workspace',
        capacity: '50kg'
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

  // Create recipes
  const recipes = await Promise.all([
    prisma.recipe.create({
      data: {
        name: 'Basic Bread Dough Recipe',
        description: 'Standard bread dough for various bread types',
        categoryId: categories[3].id, // Dough category
        yieldQuantity: 10,
        yieldUnit: 'kg',
        prepTime: 45,
        instructions: JSON.stringify([
          'Mix flour, water, yeast, and salt',
          'Knead for 10 minutes',
          'First rise: 1 hour',
          'Shape and second rise: 30 minutes'
        ])
      }
    }),
    prisma.recipe.create({
      data: {
        name: 'Vanilla Pastry Cream Recipe',
        description: 'Classic pastry cream for various applications',
        categoryId: categories[4].id, // Fillings category
        yieldQuantity: 5,
        yieldUnit: 'L',
        prepTime: 30,
        instructions: JSON.stringify([
          'Heat milk with vanilla',
          'Whisk egg yolks with sugar',
          'Temper and cook until thick',
          'Strain and cool'
        ])
      }
    })
  ]);

  console.log(`✅ Created ${recipes.length} recipes`);

  // Get default quality status
  const defaultQualityStatus = await prisma.qualityStatus.findFirst({
    where: { name: 'Good' },
  }) || await prisma.qualityStatus.findFirst();

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
        qualityStatusId: defaultQualityStatus?.id,
        isContaminated: false
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
        qualityStatusId: defaultQualityStatus?.id,
        isContaminated: false
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
        qualityStatusId: defaultQualityStatus?.id,
        isContaminated: false
      }
    })
  ]);

  console.log(`✅ Created ${rawMaterials.length} raw materials`);

  // Create intermediate products
  const intermediateProducts = await Promise.all([
    prisma.intermediateProduct.create({
      data: {
        name: 'Basic Bread Dough',
        description: 'Pre-fermented bread dough base',
        categoryId: categories[3].id, // Dough category
        storageLocationId: storageLocations[3].id,
        recipeId: recipes[0].id,
        batchNumber: 'BD001',
        productionDate: new Date('2024-08-20'),
        expirationDate: new Date('2024-08-22'),
        quantity: 25.5,
        unit: 'kg',
        status: 'COMPLETED',
        contaminated: false,
        qualityStatusId: defaultQualityStatus?.id
      }
    }),
    prisma.intermediateProduct.create({
      data: {
        name: 'Vanilla Pastry Cream',
        description: 'Basic pastry cream for fillings',
        categoryId: categories[4].id, // Fillings category
        storageLocationId: storageLocations[1].id,
        recipeId: recipes[1].id,
        batchNumber: 'PC001',
        productionDate: new Date('2024-08-24'),
        expirationDate: new Date('2024-08-26'),
        quantity: 10,
        unit: 'L',
        status: 'IN_PRODUCTION',
        contaminated: false,
        qualityStatusId: defaultQualityStatus?.id
      }
    }),
    prisma.intermediateProduct.create({
      data: {
        name: 'Chocolate Ganache',
        description: 'Dark chocolate ganache for cake coating',
        categoryId: categories[5].id, // Glazes category
        storageLocationId: storageLocations[1].id,
        batchNumber: 'CG001',
        productionDate: new Date('2024-08-23'),
        expirationDate: new Date('2024-08-30'),
        quantity: 15,
        unit: 'kg',
        status: 'COMPLETED',
        contaminated: false,
        qualityStatusId: defaultQualityStatus?.id
      }
    })
  ]);

  console.log(`✅ Created ${intermediateProducts.length} intermediate products`);

  // Create finished products
  const finishedProducts = await Promise.all([
    prisma.finishedProduct.create({
      data: {
        name: 'Artisan Sourdough Bread',
        description: 'Traditional sourdough bread with crispy crust',
        categoryId: categories[6].id, // Breads category
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
        qualityStatusId: defaultQualityStatus?.id
      }
    }),
    prisma.finishedProduct.create({
      data: {
        name: 'Chocolate Croissant',
        description: 'Butter croissant with chocolate filling',
        categoryId: categories[7].id, // Pastries category
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
        qualityStatusId: defaultQualityStatus?.id
      }
    }),
    prisma.finishedProduct.create({
      data: {
        name: 'Classic Baguette',
        description: 'Traditional French baguette',
        categoryId: categories[6].id, // Breads category
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
        qualityStatusId: defaultQualityStatus?.id
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
