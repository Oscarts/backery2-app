import { PrismaClient, CategoryType, StorageLocationType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Seeding bakery management database with realistic data...\n');

  try {
    // Clear existing data first
    console.log('🧹 Cleaning existing data...');
    
    // Delete in proper order to respect foreign key constraints
    await prisma.productionStep.deleteMany();
    await prisma.productionAllocation.deleteMany();
    await prisma.finishedProduct.deleteMany();
    await prisma.productionRun.deleteMany();
    await prisma.intermediateProduct.deleteMany();
    await prisma.recipeIngredient.deleteMany();
    await prisma.rawMaterial.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.category.deleteMany();
    await prisma.unit.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.storageLocation.deleteMany();

    // 1. Create Units
    console.log('📏 Creating units...');
    const units = await Promise.all([
      prisma.unit.create({ data: { name: 'Kilograms', symbol: 'kg', category: 'weight', description: 'Metric unit for weight' } }),
      prisma.unit.create({ data: { name: 'Grams', symbol: 'g', category: 'weight', description: 'Metric unit for small weights' } }),
      prisma.unit.create({ data: { name: 'Liters', symbol: 'L', category: 'volume', description: 'Metric unit for volume' } }),
      prisma.unit.create({ data: { name: 'Milliliters', symbol: 'ml', category: 'volume', description: 'Metric unit for small volumes' } }),
      prisma.unit.create({ data: { name: 'Pieces', symbol: 'pcs', category: 'count', description: 'Individual items' } }),
      prisma.unit.create({ data: { name: 'Dozen', symbol: 'dz', category: 'count', description: '12 pieces' } }),
      prisma.unit.create({ data: { name: 'Tablespoons', symbol: 'tbsp', category: 'volume', description: 'Cooking measurement' } }),
      prisma.unit.create({ data: { name: 'Teaspoons', symbol: 'tsp', category: 'volume', description: 'Cooking measurement' } })
    ]);
      prisma.unit.create({ data: { name: 'Teaspoons', symbol: 'tsp', category: 'volume', description: 'Cooking measurement' } })
    ]);StorageLocationType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDatabase() {
  console.log('🌱 Seeding bakery management database with realistic data...\n');

  try {
    // Clear existing data first
    console.log('🧹 Cleaning existing data...');
    
    // Delete in proper order to respect foreign key constraints
    await prisma.productionStep.deleteMany();
    await prisma.productionAllocation.deleteMany();
    await prisma.finishedProduct.deleteMany();
    await prisma.productionRun.deleteMany();
    await prisma.intermediateProduct.deleteMany();
    await prisma.recipeIngredient.deleteMany();
    await prisma.rawMaterial.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.category.deleteMany();
    await prisma.unit.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.storageLocation.deleteMany();

    // 1. Create Units
    console.log('📏 Creating units...');
    const units = await Promise.all([
      prisma.unit.create({ data: { name: 'Kilograms', symbol: 'kg', type: 'WEIGHT' } }),
      prisma.unit.create({ data: { name: 'Grams', symbol: 'g', type: 'WEIGHT' } }),
      prisma.unit.create({ data: { name: 'Liters', symbol: 'L', type: 'VOLUME' } }),
      prisma.unit.create({ data: { name: 'Milliliters', symbol: 'ml', type: 'VOLUME' } }),
      prisma.unit.create({ data: { name: 'Pieces', symbol: 'pcs', type: 'COUNT' } }),
      prisma.unit.create({ data: { name: 'Dozen', symbol: 'dz', type: 'COUNT' } }),
      prisma.unit.create({ data: { name: 'Tablespoons', symbol: 'tbsp', type: 'VOLUME' } }),
      prisma.unit.create({ data: { name: 'Teaspoons', symbol: 'tsp', type: 'VOLUME' } }),
    ]);
    console.log(`✅ Created ${units.length} units`);

    // 2. Create Categories
    console.log('📂 Creating categories...');
    const categories = await Promise.all([
      prisma.category.create({ data: { name: 'Flours & Grains', type: CategoryType.RAW_MATERIAL, description: 'Various types of flour and grain products' } }),
      prisma.category.create({ data: { name: 'Dairy Products', type: CategoryType.RAW_MATERIAL, description: 'Milk, butter, cream, and other dairy items' } }),
      prisma.category.create({ data: { name: 'Sweeteners', type: CategoryType.RAW_MATERIAL, description: 'Sugar, honey, syrups, and artificial sweeteners' } }),
      prisma.category.create({ data: { name: 'Leavening Agents', type: CategoryType.RAW_MATERIAL, description: 'Yeast, baking powder, baking soda' } }),
      prisma.category.create({ data: { name: 'Spices & Flavorings', type: CategoryType.RAW_MATERIAL, description: 'Salt, vanilla, spices, and flavor extracts' } }),
      prisma.category.create({ data: { name: 'Fats & Oils', type: CategoryType.RAW_MATERIAL, description: 'Butter, oils, and other fat sources' } }),
      prisma.category.create({ data: { name: 'Bread Products', type: CategoryType.FINISHED_PRODUCT, description: 'All types of bread and bread-like products' } }),
      prisma.category.create({ data: { name: 'Pastries & Cakes', type: CategoryType.FINISHED_PRODUCT, description: 'Cakes, pastries, and sweet baked goods' } }),
      prisma.category.create({ data: { name: 'Cookies & Biscuits', type: CategoryType.FINISHED_PRODUCT, description: 'Cookies, biscuits, and similar items' } }),
      prisma.category.create({ data: { name: 'Dough & Batters', type: CategoryType.INTERMEDIATE_PRODUCT, description: 'Pre-made doughs and batters' } }),
      prisma.category.create({ data: { name: 'Bread Recipes', type: CategoryType.RECIPE, description: 'Recipes for various types of bread' } }),
      prisma.category.create({ data: { name: 'Pastry Recipes', type: CategoryType.RECIPE, description: 'Recipes for pastries and sweet items' } }),
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // 3. Create Storage Locations
    console.log('🏪 Creating storage locations...');
    const storageLocations = await Promise.all([
      prisma.storageLocation.create({ data: { name: 'Main Warehouse', type: StorageLocationType.WAREHOUSE, description: 'Primary storage facility', capacity: '5000 kg' } }),
      prisma.storageLocation.create({ data: { name: 'Cold Storage', type: StorageLocationType.COLD_ROOM, description: 'Refrigerated storage for dairy and perishables', capacity: '1000 kg' } }),
      prisma.storageLocation.create({ data: { name: 'Freezer Room', type: StorageLocationType.FREEZER, description: 'Frozen storage for long-term preservation', capacity: '500 kg' } }),
      prisma.storageLocation.create({ data: { name: 'Dry Goods Pantry', type: StorageLocationType.DRY_STORAGE, description: 'Climate-controlled dry storage', capacity: '2000 kg' } }),
      prisma.storageLocation.create({ data: { name: 'Production Floor', type: StorageLocationType.PRODUCTION, description: 'Work-in-progress storage area', capacity: '200 kg' } }),
    ]);
    console.log(`✅ Created ${storageLocations.length} storage locations`);

    // 4. Create Suppliers
    console.log('🏢 Creating suppliers...');
    const suppliers = await Promise.all([
      prisma.supplier.create({ data: { name: 'Premium Flour Mills', contactInfo: 'contact@premiumflour.com', address: '123 Mill Street, Grain City' } }),
      prisma.supplier.create({ data: { name: 'Dairy Fresh Co', contactInfo: 'orders@dairyfresh.com', address: '456 Farm Road, Dairy Valley' } }),
      prisma.supplier.create({ data: { name: 'Sweet Solutions', contactInfo: 'sales@sweetsolutions.com', address: '789 Sugar Lane, Sweet Town' } }),
      prisma.supplier.create({ data: { name: 'Organic Ingredients Ltd', contactInfo: 'info@organicingredients.com', address: '321 Green Street, Organic City' } }),
      prisma.supplier.create({ data: { name: 'Bakery Equipment & Supplies', contactInfo: 'service@bakeryequip.com', address: '654 Industrial Ave, Equipment District' } }),
    ]);
    console.log(`✅ Created ${suppliers.length} suppliers`);

    // 5. Create Raw Materials
    console.log('🥖 Creating raw materials...');
    const rawMaterials = await Promise.all([
      // Flours & Grains
      prisma.rawMaterial.create({
        data: {
          name: 'Bread Flour (High Protein)',
          sku: 'FLOUR-BREAD-001',
          categoryId: categories[0].id,
          supplierId: suppliers[0].id,
          unitId: units[0].id, // kg
          currentStock: 150.0,
          minimumStock: 50.0,
          maximumStock: 500.0,
          unitCost: 2.50,
          storageLocationId: storageLocations[3].id,
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'All-Purpose Flour',
          sku: 'FLOUR-AP-001',
          categoryId: categories[0].id,
          supplierId: suppliers[0].id,
          unitId: units[0].id,
          currentStock: 200.0,
          minimumStock: 75.0,
          maximumStock: 600.0,
          unitCost: 2.25,
          storageLocationId: storageLocations[3].id,
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Whole Wheat Flour',
          sku: 'FLOUR-WW-001',
          categoryId: categories[0].id,
          supplierId: suppliers[0].id,
          unitId: units[0].id,
          currentStock: 100.0,
          minimumStock: 25.0,
          maximumStock: 300.0,
          unitCost: 3.00,
          storageLocationId: storageLocations[3].id,
        }
      }),
      // Dairy Products
      prisma.rawMaterial.create({
        data: {
          name: 'Whole Milk',
          sku: 'DAIRY-MILK-001',
          categoryId: categories[1].id,
          supplierId: suppliers[1].id,
          unitId: units[2].id, // L
          currentStock: 50.0,
          minimumStock: 20.0,
          maximumStock: 100.0,
          unitCost: 1.25,
          storageLocationId: storageLocations[1].id,
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Unsalted Butter',
          sku: 'DAIRY-BUTTER-001',
          categoryId: categories[1].id,
          supplierId: suppliers[1].id,
          unitId: units[0].id,
          currentStock: 25.0,
          minimumStock: 10.0,
          maximumStock: 75.0,
          unitCost: 6.50,
          storageLocationId: storageLocations[1].id,
        }
      }),
      // Sweeteners
      prisma.rawMaterial.create({
        data: {
          name: 'Granulated Sugar',
          sku: 'SWEET-SUGAR-001',
          categoryId: categories[2].id,
          supplierId: suppliers[2].id,
          unitId: units[0].id,
          currentStock: 75.0,
          minimumStock: 25.0,
          maximumStock: 200.0,
          unitCost: 1.75,
          storageLocationId: storageLocations[3].id,
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Honey (Raw)',
          sku: 'SWEET-HONEY-001',
          categoryId: categories[2].id,
          supplierId: suppliers[3].id,
          unitId: units[0].id,
          currentStock: 15.0,
          minimumStock: 5.0,
          maximumStock: 50.0,
          unitCost: 12.00,
          storageLocationId: storageLocations[0].id,
        }
      }),
      // Leavening Agents
      prisma.rawMaterial.create({
        data: {
          name: 'Active Dry Yeast',
          sku: 'YEAST-DRY-001',
          categoryId: categories[3].id,
          supplierId: suppliers[4].id,
          unitId: units[1].id, // g
          currentStock: 2000.0,
          minimumStock: 500.0,
          maximumStock: 5000.0,
          unitCost: 0.08,
          storageLocationId: storageLocations[3].id,
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Baking Powder',
          sku: 'LEAVEN-BP-001',
          categoryId: categories[3].id,
          supplierId: suppliers[4].id,
          unitId: units[1].id,
          currentStock: 1500.0,
          minimumStock: 300.0,
          maximumStock: 3000.0,
          unitCost: 0.15,
          storageLocationId: storageLocations[3].id,
        }
      }),
      // Spices & Flavorings
      prisma.rawMaterial.create({
        data: {
          name: 'Sea Salt (Fine)',
          sku: 'SPICE-SALT-001',
          categoryId: categories[4].id,
          supplierId: suppliers[3].id,
          unitId: units[0].id,
          currentStock: 20.0,
          minimumStock: 5.0,
          maximumStock: 50.0,
          unitCost: 3.50,
          storageLocationId: storageLocations[3].id,
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Pure Vanilla Extract',
          sku: 'FLAVOR-VAN-001',
          categoryId: categories[4].id,
          supplierId: suppliers[2].id,
          unitId: units[3].id, // ml
          currentStock: 2000.0,
          minimumStock: 500.0,
          maximumStock: 5000.0,
          unitCost: 0.25,
          storageLocationId: storageLocations[0].id,
        }
      }),
      // Fats & Oils
      prisma.rawMaterial.create({
        data: {
          name: 'Extra Virgin Olive Oil',
          sku: 'OIL-OLIVE-001',
          categoryId: categories[5].id,
          supplierId: suppliers[3].id,
          unitId: units[2].id,
          currentStock: 30.0,
          minimumStock: 10.0,
          maximumStock: 100.0,
          unitCost: 8.50,
          storageLocationId: storageLocations[0].id,
        }
      }),
    ]);
    console.log(`✅ Created ${rawMaterials.length} raw materials`);

    // 6. Create Recipes
    console.log('📝 Creating recipes...');
    const recipes = await Promise.all([
      prisma.recipe.create({
        data: {
          name: 'Classic Artisan Bread',
          description: 'Traditional crusty bread with a soft interior',
          categoryId: categories[10].id, // Bread Recipes
          yieldQuantity: 2.0,
          yieldUnit: 'loaves',
          prepTime: 30,
          cookTime: 45,
          totalTime: 75,
          instructions: '1. Mix flour, water, yeast, and salt\n2. Knead for 10 minutes\n3. First rise (1 hour)\n4. Shape loaves\n5. Second rise (45 minutes)\n6. Bake at 450°F for 30 minutes',
          estimatedCost: 3.50,
        }
      }),
      prisma.recipe.create({
        data: {
          name: 'Honey Wheat Bread',
          description: 'Nutritious whole wheat bread sweetened with honey',
          categoryId: categories[10].id,
          yieldQuantity: 2.0,
          yieldUnit: 'loaves',
          prepTime: 25,
          cookTime: 40,
          totalTime: 65,
          instructions: '1. Combine flours, yeast, and salt\n2. Mix in milk, honey, and oil\n3. Knead until smooth\n4. Rise for 1 hour\n5. Shape and rise again\n6. Bake at 375°F for 35-40 minutes',
          estimatedCost: 4.25,
        }
      }),
      prisma.recipe.create({
        data: {
          name: 'Classic Chocolate Chip Cookies',
          description: 'Traditional soft and chewy chocolate chip cookies',
          categoryId: categories[11].id, // Pastry Recipes
          yieldQuantity: 36.0,
          yieldUnit: 'pcs',
          prepTime: 15,
          cookTime: 12,
          totalTime: 27,
          instructions: '1. Cream butter and sugars\n2. Add eggs and vanilla\n3. Mix in flour, baking soda, salt\n4. Fold in chocolate chips\n5. Drop on baking sheets\n6. Bake at 375°F for 9-11 minutes',
          estimatedCost: 8.50,
        }
      }),
    ]);
    console.log(`✅ Created ${recipes.length} recipes`);

    // 7. Create Recipe Ingredients
    console.log('🥄 Creating recipe ingredients...');
    // Classic Artisan Bread ingredients
    await Promise.all([
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[0].id,
          rawMaterialId: rawMaterials[0].id, // Bread Flour
          quantity: 1.0,
          unit: 'kg',
          notes: 'High protein flour for good gluten development'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[0].id,
          rawMaterialId: rawMaterials[7].id, // Yeast
          quantity: 7.0,
          unit: 'g',
          notes: 'Active dry yeast - proof before using'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[0].id,
          rawMaterialId: rawMaterials[9].id, // Salt
          quantity: 15.0,
          unit: 'g',
          notes: 'Sea salt for flavor enhancement'
        }
      }),
    ]);

    // 8. Create some realistic Finished Products
    console.log('🍰 Creating finished products...');
    const finishedProducts = await Promise.all([
      prisma.finishedProduct.create({
        data: {
          name: 'Classic Artisan Bread',
          sku: 'FP-BREAD-ARTISAN-001',
          categoryId: categories[6].id, // Bread Products
          recipeId: recipes[0].id,
          batchNumber: `BATCH-${new Date().toISOString().slice(0, 10)}-001`,
          quantity: 20.0,
          reservedQuantity: 0.0,
          unitPrice: 4.50,
          productionDate: new Date(),
          expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          storageLocationId: storageLocations[0].id,
          status: 'AVAILABLE',
        }
      }),
      prisma.finishedProduct.create({
        data: {
          name: 'Honey Wheat Bread',
          sku: 'FP-BREAD-HONEY-001',
          categoryId: categories[6].id,
          recipeId: recipes[1].id,
          batchNumber: `BATCH-${new Date().toISOString().slice(0, 10)}-002`,
          quantity: 15.0,
          reservedQuantity: 3.0,
          unitPrice: 5.25,
          productionDate: new Date(),
          expirationDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
          storageLocationId: storageLocations[0].id,
          status: 'AVAILABLE',
        }
      }),
      prisma.finishedProduct.create({
        data: {
          name: 'Chocolate Chip Cookies',
          sku: 'FP-COOKIES-CC-001',
          categoryId: categories[8].id, // Cookies & Biscuits
          recipeId: recipes[2].id,
          batchNumber: `BATCH-${new Date().toISOString().slice(0, 10)}-003`,
          quantity: 144.0,
          reservedQuantity: 12.0,
          unitPrice: 0.75,
          productionDate: new Date(),
          expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
          storageLocationId: storageLocations[0].id,
          status: 'AVAILABLE',
        }
      }),
    ]);
    console.log(`✅ Created ${finishedProducts.length} finished products`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('=' .repeat(50));
    console.log('📊 Summary:');
    console.log(`   • ${units.length} units`);
    console.log(`   • ${categories.length} categories`);
    console.log(`   • ${storageLocations.length} storage locations`);
    console.log(`   • ${suppliers.length} suppliers`);
    console.log(`   • ${rawMaterials.length} raw materials`);
    console.log(`   • ${recipes.length} recipes`);
    console.log(`   • ${finishedProducts.length} finished products`);
    console.log('   • Recipe ingredients linked');
    console.log('\n🚀 Your bakery management system is ready with realistic data!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();