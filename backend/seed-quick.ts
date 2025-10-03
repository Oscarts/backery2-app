import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting quick seed for essential data...');

  console.log('🗑️  Cleaning existing data...');
  // Clean in reverse order to respect foreign keys
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
  console.log('✅ Cleaned existing data');

  // Create categories
  const rawMaterialCategory = await prisma.category.create({
    data: { name: 'Flour', type: 'RAW_MATERIAL', description: 'Various types of flour' }
  });
  
  const finishedProductCategory = await prisma.category.create({
    data: { name: 'Breads', type: 'FINISHED_PRODUCT', description: 'All types of bread' }
  });

  const recipeCategory = await prisma.category.create({
    data: { name: 'Baking Recipes', type: 'RECIPE', description: 'Bakery recipes' }
  });

  console.log('✅ Created 3 categories');

  // Create suppliers
  const supplier = await prisma.supplier.create({
    data: {
      name: 'Premium Flour Co.',
      contactInfo: { email: 'contact@premiumflour.com', phone: '+1-555-0101' },
      address: '123 Mill St, Wheat Valley, CA 90210',
      isActive: true
    }
  });

  console.log('✅ Created 1 supplier');

  // Create storage locations
  const dryStorage = await prisma.storageLocation.create({
    data: {
      name: 'Dry Storage A',
      type: 'Dry',
      description: 'Temperature controlled dry storage',
      capacity: '500kg'
    }
  });

  const coldStorage = await prisma.storageLocation.create({
    data: {
      name: 'Refrigerator B',
      type: 'Cold',
      description: 'Walk-in refrigerator',
      capacity: '300kg'
    }
  });

  console.log('✅ Created 2 storage locations');

  // Create units
  const kg = await prisma.unit.create({
    data: {
      name: 'Kilogram',
      symbol: 'kg',
      category: 'WEIGHT',
      description: 'Metric unit of weight',
      isActive: true
    }
  });

  const gram = await prisma.unit.create({
    data: {
      name: 'Gram',
      symbol: 'g',
      category: 'WEIGHT',
      description: 'Metric unit of weight',
      isActive: true
    }
  });

  const liter = await prisma.unit.create({
    data: {
      name: 'Liter',
      symbol: 'L',
      category: 'VOLUME',
      description: 'Metric unit of volume',
      isActive: true
    }
  });

  const piece = await prisma.unit.create({
    data: {
      name: 'Piece',
      symbol: 'pcs',
      category: 'COUNT',
      description: 'Individual items',
      isActive: true
    }
  });

  console.log('✅ Created 4 units');

  // Create quality statuses
  const qualityGood = await prisma.qualityStatus.create({
    data: {
      name: 'Good',
      description: 'Product meets all quality standards',
      sortOrder: 1,
      isActive: true
    }
  });

  const qualityFair = await prisma.qualityStatus.create({
    data: {
      name: 'Fair',
      description: 'Product is acceptable but not optimal',
      sortOrder: 2,
      isActive: true
    }
  });

  console.log('✅ Created 2 quality statuses');

  // Create some raw materials
  const flour = await prisma.rawMaterial.create({
    data: {
      name: 'All-Purpose Flour',
      sku: 'FLOUR-001',
      categoryId: rawMaterialCategory.id,
      supplierId: supplier.id,
      batchNumber: 'BATCH-2025-001',
      purchaseDate: new Date('2025-10-01'),
      expirationDate: new Date('2026-04-01'),
      quantity: 50,
      unit: 'kg',
      unitPrice: 2.50,
      reorderLevel: 10,
      storageLocationId: dryStorage.id,
      qualityStatusId: qualityGood.id,
      isContaminated: false
    }
  });

  const sugar = await prisma.rawMaterial.create({
    data: {
      name: 'White Sugar',
      sku: 'SUGAR-001',
      categoryId: rawMaterialCategory.id,
      supplierId: supplier.id,
      batchNumber: 'BATCH-2025-002',
      purchaseDate: new Date('2025-10-01'),
      expirationDate: new Date('2027-10-01'),
      quantity: 30,
      unit: 'kg',
      unitPrice: 1.80,
      reorderLevel: 5,
      storageLocationId: dryStorage.id,
      qualityStatusId: qualityGood.id,
      isContaminated: false
    }
  });

  const butter = await prisma.rawMaterial.create({
    data: {
      name: 'Butter',
      sku: 'BUTTER-001',
      categoryId: rawMaterialCategory.id,
      supplierId: supplier.id,
      batchNumber: 'BATCH-2025-003',
      purchaseDate: new Date('2025-10-01'),
      expirationDate: new Date('2025-11-15'),
      quantity: 15,
      unit: 'kg',
      unitPrice: 6.50,
      reorderLevel: 3,
      storageLocationId: coldStorage.id,
      qualityStatusId: qualityGood.id,
      isContaminated: false
    }
  });

  console.log('✅ Created 3 raw materials');

  // Create some recipes
  const sourdoughRecipe = await prisma.recipe.create({
    data: {
      name: 'Sourdough Bread Recipe',
      categoryId: recipeCategory.id,
      description: 'Traditional sourdough bread with natural fermentation',
      instructions: ['Mix flour and water', 'Add starter', 'Let ferment 12-24 hours', 'Shape and proof', 'Bake at 450°F for 35 minutes'],
      prepTime: 30,
      cookTime: 35,
      estimatedTotalTime: 65,
      yieldQuantity: 1,
      yieldUnit: 'loaf',
      difficulty: 'MEDIUM',
      emoji: '🍞',
      estimatedCost: 3.50,
      isActive: true,
      ingredients: {
        create: [
          {
            rawMaterialId: flour.id,
            quantity: 0.5,
            unit: 'kg',
            notes: 'High-quality bread flour preferred'
          },
          {
            rawMaterialId: sugar.id,
            quantity: 0.02,
            unit: 'kg',
            notes: 'For feeding the starter'
          }
        ]
      }
    }
  });

  const baguetteRecipe = await prisma.recipe.create({
    data: {
      name: 'French Baguette Recipe',
      categoryId: recipeCategory.id,
      description: 'Classic French baguette with crispy crust',
      instructions: ['Mix ingredients', 'Knead dough 10 minutes', 'First rise 2 hours', 'Shape into baguettes', 'Second rise 1 hour', 'Score and bake at 475°F for 20 minutes'],
      prepTime: 20,
      cookTime: 20,
      estimatedTotalTime: 40,
      yieldQuantity: 3,
      yieldUnit: 'baguettes',
      difficulty: 'EASY',
      emoji: '🥖',
      estimatedCost: 1.80,
      isActive: true,
      ingredients: {
        create: [
          {
            rawMaterialId: flour.id,
            quantity: 0.4,
            unit: 'kg',
            notes: 'French bread flour'
          },
          {
            rawMaterialId: butter.id,
            quantity: 0.03,
            unit: 'kg',
            notes: 'For richness'
          }
        ]
      }
    }
  });

  const croissantRecipe = await prisma.recipe.create({
    data: {
      name: 'Butter Croissant Recipe',
      categoryId: recipeCategory.id,
      description: 'Flaky French croissants with layers of butter',
      instructions: ['Make dough and chill', 'Laminate with butter (6 folds)', 'Roll and shape', 'Proof overnight', 'Egg wash and bake at 400°F for 15 minutes'],
      prepTime: 180,
      cookTime: 15,
      estimatedTotalTime: 195,
      yieldQuantity: 12,
      yieldUnit: 'croissants',
      difficulty: 'HARD',
      emoji: '🥐',
      estimatedCost: 4.20,
      isActive: true,
      ingredients: {
        create: [
          {
            rawMaterialId: flour.id,
            quantity: 0.5,
            unit: 'kg',
            notes: 'All-purpose or pastry flour'
          },
          {
            rawMaterialId: butter.id,
            quantity: 0.25,
            unit: 'kg',
            notes: 'Cold European butter for lamination'
          },
          {
            rawMaterialId: sugar.id,
            quantity: 0.05,
            unit: 'kg',
            notes: 'Granulated sugar'
          }
        ]
      }
    }
  });

  console.log('✅ Created 3 recipes with ingredients');

  // Create some finished products
  const bread = await prisma.finishedProduct.create({
    data: {
      name: 'Sourdough Bread',
      sku: 'BREAD-001',
      categoryId: finishedProductCategory.id,
      batchNumber: 'FP-2025-001',
      productionDate: new Date('2025-10-02'),
      expirationDate: new Date('2025-10-09'),
      shelfLife: 7,
      quantity: 50,
      unit: 'pcs',
      salePrice: 6.99,
      costToProduce: 3.50,
      packagingInfo: 'Paper bag',
      storageLocationId: dryStorage.id,
      qualityStatusId: qualityGood.id,
      status: 'COMPLETED',
      isContaminated: false
    }
  });

  const baguette = await prisma.finishedProduct.create({
    data: {
      name: 'French Baguette',
      sku: 'BREAD-002',
      categoryId: finishedProductCategory.id,
      batchNumber: 'FP-2025-002',
      productionDate: new Date('2025-10-03'),
      expirationDate: new Date('2025-10-05'),
      shelfLife: 2,
      quantity: 30,
      unit: 'pcs',
      salePrice: 3.99,
      costToProduce: 1.80,
      packagingInfo: 'Paper wrap',
      storageLocationId: dryStorage.id,
      qualityStatusId: qualityGood.id,
      status: 'COMPLETED',
      isContaminated: false
    }
  });

  console.log('✅ Created 2 finished products');

  // Create a customer
  const customer = await prisma.customer.create({
    data: {
      name: 'Main Street Café',
      email: 'orders@mainstreetcafe.com',
      phone: '+1-555-1234',
      address: '123 Main St, Downtown, CA 90001',
      isActive: true
    }
  });

  console.log('✅ Created 1 customer');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log('- 3 Categories (RAW_MATERIAL, FINISHED_PRODUCT, RECIPE)');
  console.log('- 1 Supplier');
  console.log('- 2 Storage Locations');
  console.log('- 4 Units (kg, g, L, pcs)');
  console.log('- 2 Quality Statuses');
  console.log('- 3 Raw Materials (Flour, Sugar, Butter)');
  console.log('- 3 Recipes (Sourdough, Baguette, Croissant)');
  console.log('- 2 Finished Products (Sourdough, Baguette)');
  console.log('- 1 Customer');
  console.log('');
  console.log('✨ Database is ready for use!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
