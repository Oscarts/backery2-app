import { PrismaClient, CategoryType } from '@prisma/client';

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
    console.log(`✅ Created ${units.length} units`);

    // 2. Create Storage Locations
    console.log('🏪 Creating storage locations...');
    const storageLocations = await Promise.all([
      prisma.storageLocation.create({
        data: {
          name: 'Main Pantry',
          type: 'DRY_STORAGE',
          description: 'Primary dry goods storage area',
          capacity: '1000 kg'
        }
      }),
      prisma.storageLocation.create({
        data: {
          name: 'Walk-in Cooler',
          type: 'COLD_STORAGE',
          description: 'Refrigerated storage for perishables',
          capacity: '500 kg'
        }
      }),
      prisma.storageLocation.create({
        data: {
          name: 'Freezer Unit',
          type: 'FROZEN_STORAGE',
          description: 'Frozen goods storage',
          capacity: '200 kg'
        }
      }),
      prisma.storageLocation.create({
        data: {
          name: 'Production Floor',
          type: 'PRODUCTION_AREA',
          description: 'Main baking and production area',
          capacity: '100 units'
        }
      }),
      prisma.storageLocation.create({
        data: {
          name: 'Finished Goods Display',
          type: 'DISPLAY_AREA',
          description: 'Customer display area for finished products',
          capacity: '50 units'
        }
      })
    ]);
    console.log(`✅ Created ${storageLocations.length} storage locations`);

    // 3. Create Suppliers
    console.log('🚚 Creating suppliers...');
    const suppliers = await Promise.all([
      prisma.supplier.create({
        data: {
          name: 'Premium Flour Mills',
          contactInfo: { 
            phone: '555-0101', 
            email: 'orders@premiumflour.com',
            contact: 'Sarah Johnson' 
          },
          address: '123 Mill Street, Grain City, GC 12345',
          isActive: true
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'Dairy Fresh Co-op',
          contactInfo: { 
            phone: '555-0202', 
            email: 'wholesale@dairyfresh.com',
            contact: 'Mike Thompson' 
          },
          address: '456 Farm Road, Dairy Valley, DV 67890',
          isActive: true
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'Sweet Ingredients Ltd',
          contactInfo: { 
            phone: '555-0303', 
            email: 'sales@sweetingredients.com',
            contact: 'Lisa Chen' 
          },
          address: '789 Sugar Ave, Sweet Town, ST 11111',
          isActive: true
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'Organic Essentials',
          contactInfo: { 
            phone: '555-0404', 
            email: 'orders@organicesse.com',
            contact: 'David Rodriguez' 
          },
          address: '321 Green Street, Eco City, EC 22222',
          isActive: true
        }
      }),
      prisma.supplier.create({
        data: {
          name: 'Bakery Equipment Supply',
          contactInfo: { 
            phone: '555-0505', 
            email: 'support@bakeryequip.com',
            contact: 'Anna White' 
          },
          address: '654 Industrial Blvd, Tool City, TC 33333',
          isActive: true
        }
      })
    ]);
    console.log(`✅ Created ${suppliers.length} suppliers`);

    // 4. Create Categories
    console.log('📂 Creating categories...');
    const categories = await Promise.all([
      prisma.category.create({
        data: {
          name: 'Flour & Grains',
          type: CategoryType.RAW_MATERIAL,
          description: 'Various types of flour and grain products for baking'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Dairy Products',
          type: CategoryType.RAW_MATERIAL,
          description: 'Milk, butter, cream, and other dairy ingredients'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Sweeteners',
          type: CategoryType.RAW_MATERIAL,
          description: 'Sugar, honey, syrups, and artificial sweeteners'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Fats & Oils',
          type: CategoryType.RAW_MATERIAL,
          description: 'Butter, oils, and other fat sources for baking'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Leavening Agents',
          type: CategoryType.RAW_MATERIAL,
          description: 'Yeast, baking powder, baking soda, and other rising agents'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Flavorings',
          type: CategoryType.RAW_MATERIAL,
          description: 'Vanilla, extracts, spices, and flavor enhancers'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Eggs & Proteins',
          type: CategoryType.RAW_MATERIAL,
          description: 'Fresh eggs and protein ingredients'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Breads',
          type: CategoryType.FINISHED_PRODUCT,
          description: 'Various types of bread products'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Pastries',
          type: CategoryType.FINISHED_PRODUCT,
          description: 'Sweet and savory pastry items'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Cakes',
          type: CategoryType.FINISHED_PRODUCT,
          description: 'Layer cakes, cupcakes, and specialty cakes'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Cookies',
          type: CategoryType.FINISHED_PRODUCT,
          description: 'Various cookie and biscuit products'
        }
      }),
      prisma.category.create({
        data: {
          name: 'Dough Recipes',
          type: CategoryType.RECIPE,
          description: 'Base dough recipes for various products'
        }
      })
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // 5. Create Raw Materials
    console.log('🌾 Creating raw materials...');
    const rawMaterials = await Promise.all([
      prisma.rawMaterial.create({
        data: {
          name: 'All-Purpose Flour',
          description: 'High-quality unbleached all-purpose flour',
          categoryId: categories[0].id, // Flour & Grains
          supplierId: suppliers[0].id,   // Premium Flour Mills
          storageLocationId: storageLocations[0].id, // Main Pantry
          batchNumber: 'FLOUR-AP-20250920-001',
          purchaseDate: new Date('2025-09-15'),
          expirationDate: new Date('2026-09-15'), // 1 year shelf life
          quantity: 500.0,
          unit: 'kg',
          unitPrice: 1.25,
          reorderLevel: 100.0,
          reservedQuantity: 0.0
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Bread Flour',
          description: 'High-protein flour ideal for bread making',
          categoryId: categories[0].id, // Flour & Grains
          supplierId: suppliers[0].id,   // Premium Flour Mills
          storageLocationId: storageLocations[0].id, // Main Pantry
          batchNumber: 'FLOUR-BR-20250920-001',
          purchaseDate: new Date('2025-09-15'),
          expirationDate: new Date('2026-09-15'),
          quantity: 300.0,
          unit: 'kg',
          unitPrice: 1.45,
          reorderLevel: 80.0,
          reservedQuantity: 0.0
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Whole Milk',
          description: 'Fresh whole milk, 3.25% fat',
          categoryId: categories[1].id, // Dairy Products
          supplierId: suppliers[1].id,   // Dairy Fresh Co-op
          storageLocationId: storageLocations[1].id, // Walk-in Cooler
          batchNumber: 'MILK-WH-20250920-001',
          purchaseDate: new Date('2025-09-18'),
          expirationDate: new Date('2025-10-02'), // 14 days shelf life
          quantity: 100.0,
          unit: 'L',
          unitPrice: 0.89,
          reorderLevel: 40.0,
          reservedQuantity: 0.0
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Unsalted Butter',
          description: 'Premium quality unsalted butter',
          categoryId: categories[1].id, // Dairy Products
          supplierId: suppliers[1].id,   // Dairy Fresh Co-op
          storageLocationId: storageLocations[1].id, // Walk-in Cooler
          batchNumber: 'BUTTER-US-20250920-001',
          purchaseDate: new Date('2025-09-18'),
          expirationDate: new Date('2025-10-18'), // 30 days shelf life
          quantity: 50.0,
          unit: 'kg',
          unitPrice: 4.50,
          reorderLevel: 25.0,
          reservedQuantity: 0.0
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Granulated Sugar',
          description: 'Fine white granulated sugar',
          categoryId: categories[2].id, // Sweeteners
          supplierId: suppliers[2].id,   // Sweet Ingredients Ltd
          storageLocationId: storageLocations[0].id, // Main Pantry
          batchNumber: 'SUGAR-GR-20250920-001',
          purchaseDate: new Date('2025-09-10'),
          expirationDate: new Date('2027-09-10'), // 2 years shelf life
          quantity: 200.0,
          unit: 'kg',
          unitPrice: 0.95,
          reorderLevel: 50.0,
          reservedQuantity: 0.0
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Active Dry Yeast',
          description: 'Commercial grade active dry yeast',
          categoryId: categories[4].id, // Leavening Agents
          supplierId: suppliers[0].id,   // Premium Flour Mills
          storageLocationId: storageLocations[0].id, // Main Pantry
          batchNumber: 'YEAST-AD-20250920-001',
          purchaseDate: new Date('2025-09-15'),
          expirationDate: new Date('2026-03-15'), // 6 months shelf life
          quantity: 5.0,
          unit: 'kg',
          unitPrice: 12.00,
          reorderLevel: 3.0,
          reservedQuantity: 0.0
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Fresh Eggs (Large)',
          description: 'Grade A large fresh eggs',
          categoryId: categories[6].id, // Eggs & Proteins
          supplierId: suppliers[3].id,   // Organic Essentials
          storageLocationId: storageLocations[1].id, // Walk-in Cooler
          batchNumber: 'EGGS-LG-20250920-001',
          purchaseDate: new Date('2025-09-18'),
          expirationDate: new Date('2025-10-16'), // 28 days shelf life
          quantity: 360.0, // 30 dozen
          unit: 'pcs',
          unitPrice: 0.25,
          reorderLevel: 120.0,
          reservedQuantity: 0.0
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Pure Vanilla Extract',
          description: 'Premium pure vanilla extract',
          categoryId: categories[5].id, // Flavorings
          supplierId: suppliers[2].id,   // Sweet Ingredients Ltd
          storageLocationId: storageLocations[0].id, // Main Pantry
          batchNumber: 'VANILLA-PE-20250920-001',
          purchaseDate: new Date('2025-09-10'),
          expirationDate: new Date('2028-09-10'), // 3 years shelf life
          quantity: 2.0,
          unit: 'L',
          unitPrice: 45.00,
          reorderLevel: 1.0,
          reservedQuantity: 0.0
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Sea Salt',
          description: 'Fine sea salt for baking',
          categoryId: categories[5].id, // Flavorings
          supplierId: suppliers[3].id,   // Organic Essentials
          storageLocationId: storageLocations[0].id, // Main Pantry
          batchNumber: 'SALT-SS-20250920-001',
          purchaseDate: new Date('2025-09-05'),
          expirationDate: new Date('2030-09-05'), // 5 years shelf life
          quantity: 25.0,
          unit: 'kg',
          unitPrice: 2.75,
          reorderLevel: 10.0,
          reservedQuantity: 0.0
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Olive Oil (Extra Virgin)',
          description: 'Cold-pressed extra virgin olive oil',
          categoryId: categories[3].id, // Fats & Oils
          supplierId: suppliers[3].id,   // Organic Essentials
          storageLocationId: storageLocations[0].id, // Main Pantry
          batchNumber: 'OIL-EV-20250920-001',
          purchaseDate: new Date('2025-09-10'),
          expirationDate: new Date('2027-03-10'), // 18 months shelf life
          quantity: 20.0,
          unit: 'L',
          unitPrice: 8.50,
          reorderLevel: 10.0,
          reservedQuantity: 0.0
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Baking Powder',
          description: 'Double-acting baking powder',
          categoryId: categories[4].id, // Leavening Agents
          supplierId: suppliers[0].id,   // Premium Flour Mills
          storageLocationId: storageLocations[0].id, // Main Pantry
          batchNumber: 'BP-DA-20250920-001',
          purchaseDate: new Date('2025-09-10'),
          expirationDate: new Date('2027-01-10'), // 15 months shelf life
          quantity: 10.0,
          unit: 'kg',
          unitPrice: 3.25,
          reorderLevel: 5.0,
          reservedQuantity: 0.0
        }
      }),
      prisma.rawMaterial.create({
        data: {
          name: 'Dark Chocolate Chips',
          description: 'Premium dark chocolate chips (70% cocoa)',
          categoryId: categories[5].id, // Flavorings
          supplierId: suppliers[2].id,   // Sweet Ingredients Ltd
          storageLocationId: storageLocations[0].id, // Main Pantry
          batchNumber: 'CHOC-DC-20250920-001',
          purchaseDate: new Date('2025-09-10'),
          expirationDate: new Date('2027-03-10'), // 18 months shelf life
          quantity: 30.0,
          unit: 'kg',
          unitPrice: 6.75,
          reorderLevel: 15.0,
          reservedQuantity: 0.0
        }
      })
    ]);
    console.log(`✅ Created ${rawMaterials.length} raw materials`);

    // 6. Create Recipes
    console.log('📝 Creating recipes...');
    const recipes = await Promise.all([
      prisma.recipe.create({
        data: {
          name: 'Classic Artisan Bread',
          description: 'Traditional crusty artisan bread with a perfect crumb',
          categoryId: categories[11].id, // Dough Recipes
          yieldQuantity: 2.0,
          yieldUnit: 'loaves',
          prepTime: 30,
          cookTime: 45,
          estimatedTotalTime: 300, // includes rising time
          estimatedCost: 1.85,
          difficulty: 'MEDIUM',
          emoji: '🍞',
          equipmentRequired: ['Stand mixer', 'Proofing baskets', 'Dutch oven'],
          instructions: {
            steps: [
              'Mix flour, water, salt, and yeast in stand mixer',
              'Knead for 10 minutes until smooth and elastic',
              'First rise: 2 hours at room temperature',
              'Shape into loaves and place in proofing baskets',
              'Second rise: 45 minutes',
              'Preheat Dutch oven to 450°F',
              'Score dough and bake covered for 30 minutes',
              'Remove lid and bake 15 minutes more until golden'
            ],
            tips: [
              'Use a kitchen scale for accuracy',
              'Dough should pass the windowpane test',
              'Steam creates the perfect crust'
            ]
          },
          version: 1,
          isActive: true
        }
      }),
      prisma.recipe.create({
        data: {
          name: 'Chocolate Chip Cookies',
          description: 'Soft and chewy chocolate chip cookies',
          categoryId: categories[11].id, // Dough Recipes
          yieldQuantity: 48.0,
          yieldUnit: 'pcs',
          prepTime: 20,
          cookTime: 12,
          estimatedTotalTime: 45,
          estimatedCost: 3.25,
          difficulty: 'EASY',
          emoji: '🍪',
          equipmentRequired: ['Stand mixer', 'Cookie sheets', 'Cooling racks'],
          instructions: {
            steps: [
              'Cream butter and sugars until light and fluffy',
              'Beat in eggs and vanilla extract',
              'Mix in flour, baking powder, and salt',
              'Fold in chocolate chips',
              'Chill dough for 30 minutes',
              'Preheat oven to 375°F',
              'Drop spoonfuls onto baking sheets',
              'Bake 10-12 minutes until golden brown'
            ],
            tips: [
              'Do not overbake - cookies will continue cooking on hot pan',
              'Chill dough for better shape retention',
              'Use parchment paper for easy removal'
            ]
          },
          version: 1,
          isActive: true
        }
      }),
      prisma.recipe.create({
        data: {
          name: 'Vanilla Sponge Cake',
          description: 'Light and airy vanilla sponge cake base',
          categoryId: categories[11].id, // Dough Recipes
          yieldQuantity: 1.0,
          yieldUnit: '9-inch cake',
          prepTime: 25,
          cookTime: 30,
          estimatedTotalTime: 75,
          estimatedCost: 2.45,
          difficulty: 'MEDIUM',
          emoji: '🎂',
          equipmentRequired: ['Stand mixer', '9-inch cake pans', 'Wire cooling racks'],
          instructions: {
            steps: [
              'Preheat oven to 350°F and grease cake pans',
              'Cream butter and sugar until light and fluffy',
              'Beat in eggs one at a time',
              'Mix in vanilla extract',
              'Alternate flour mixture and milk in three additions',
              'Divide batter between prepared pans',
              'Bake 25-30 minutes until toothpick comes out clean',
              'Cool in pans 10 minutes, then turn out onto racks'
            ],
            tips: [
              'Room temperature ingredients mix better',
              'Do not overmix once flour is added',
              'Test for doneness with toothpick in center'
            ]
          },
          version: 1,
          isActive: true
        }
      })
    ]);
    console.log(`✅ Created ${recipes.length} recipes`);

    // 7. Create Recipe Ingredients
    console.log('🧂 Creating recipe ingredients...');
    const recipeIngredients = await Promise.all([
      // Classic Artisan Bread ingredients
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[0].id,
          rawMaterialId: rawMaterials[1].id, // Bread Flour
          quantity: 1.0,
          unit: 'kg',
          notes: 'High-protein flour for good gluten development'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[0].id,
          rawMaterialId: rawMaterials[5].id, // Active Dry Yeast
          quantity: 0.01,
          unit: 'kg',
          notes: 'Dissolve in warm water before adding'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[0].id,
          rawMaterialId: rawMaterials[8].id, // Sea Salt
          quantity: 0.02,
          unit: 'kg',
          notes: 'Enhances flavor and strengthens gluten'
        }
      }),
      
      // Chocolate Chip Cookies ingredients
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[1].id,
          rawMaterialId: rawMaterials[0].id, // All-Purpose Flour
          quantity: 0.5,
          unit: 'kg',
          notes: 'Sift before measuring for best results'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[1].id,
          rawMaterialId: rawMaterials[3].id, // Unsalted Butter
          quantity: 0.25,
          unit: 'kg',
          notes: 'Room temperature for proper creaming'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[1].id,
          rawMaterialId: rawMaterials[4].id, // Granulated Sugar
          quantity: 0.3,
          unit: 'kg',
          notes: 'Use half granulated, half brown sugar for best texture'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[1].id,
          rawMaterialId: rawMaterials[6].id, // Fresh Eggs
          quantity: 2.0,
          unit: 'pcs',
          notes: 'Large eggs, room temperature'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[1].id,
          rawMaterialId: rawMaterials[7].id, // Pure Vanilla Extract
          quantity: 0.015,
          unit: 'L',
          notes: '1 tablespoon pure vanilla'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[1].id,
          rawMaterialId: rawMaterials[10].id, // Baking Powder
          quantity: 0.005,
          unit: 'kg',
          notes: '1 teaspoon, ensure it is fresh'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[1].id,
          rawMaterialId: rawMaterials[11].id, // Dark Chocolate Chips
          quantity: 0.3,
          unit: 'kg',
          notes: 'Premium dark chocolate for best flavor'
        }
      }),
      
      // Vanilla Sponge Cake ingredients
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[2].id,
          rawMaterialId: rawMaterials[0].id, // All-Purpose Flour
          quantity: 0.3,
          unit: 'kg',
          notes: 'Sift twice for light texture'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[2].id,
          rawMaterialId: rawMaterials[3].id, // Unsalted Butter
          quantity: 0.15,
          unit: 'kg',
          notes: 'Room temperature for proper creaming'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[2].id,
          rawMaterialId: rawMaterials[4].id, // Granulated Sugar
          quantity: 0.25,
          unit: 'kg',
          notes: 'Fine granulated sugar works best'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[2].id,
          rawMaterialId: rawMaterials[6].id, // Fresh Eggs
          quantity: 3.0,
          unit: 'pcs',
          notes: 'Large eggs, room temperature'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[2].id,
          rawMaterialId: rawMaterials[7].id, // Pure Vanilla Extract
          quantity: 0.01,
          unit: 'L',
          notes: '2 teaspoons pure vanilla'
        }
      }),
      prisma.recipeIngredient.create({
        data: {
          recipeId: recipes[2].id,
          rawMaterialId: rawMaterials[2].id, // Whole Milk
          quantity: 0.125,
          unit: 'L',
          notes: 'Room temperature for best mixing'
        }
      })
    ]);
    console.log(`✅ Created ${recipeIngredients.length} recipe ingredients`);

    // 8. Create Finished Products
    console.log('🎯 Creating finished products...');
    const finishedProducts = await Promise.all([
      prisma.finishedProduct.create({
        data: {
          name: 'Artisan Sourdough Loaf',
          description: 'Hand-crafted artisan sourdough bread with perfect crust',
          sku: 'BREAD-ART-001',
          categoryId: categories[7].id, // Breads
          batchNumber: 'ART-20250920-001',
          productionDate: new Date('2025-09-20'),
          expirationDate: new Date('2025-09-25'),
          shelfLife: 5,
          quantity: 24.0,
          reservedQuantity: 0.0,
          unit: 'loaves',
          salePrice: 8.50,
          costToProduce: 2.85,
          packagingInfo: 'Brown paper bags with artisan bakery sticker',
          storageLocationId: storageLocations[4].id, // Finished Goods Display
          status: 'COMPLETED',
          isContaminated: false
        }
      }),
      prisma.finishedProduct.create({
        data: {
          name: 'Premium Chocolate Chip Cookies',
          description: 'Soft-baked cookies with premium dark chocolate chips',
          sku: 'COOK-CCC-002',
          categoryId: categories[10].id, // Cookies
          batchNumber: 'CCC-20250920-001',
          productionDate: new Date('2025-09-20'),
          expirationDate: new Date('2025-09-27'),
          shelfLife: 7,
          quantity: 144.0,
          reservedQuantity: 0.0,
          unit: 'pcs',
          salePrice: 2.25,
          costToProduce: 0.68,
          packagingInfo: 'Individual cellophane wrappers, 12-count display boxes',
          storageLocationId: storageLocations[4].id, // Finished Goods Display
          status: 'COMPLETED',
          isContaminated: false
        }
      }),
      prisma.finishedProduct.create({
        data: {
          name: 'Vanilla Birthday Cake',
          description: 'Two-layer vanilla sponge cake with buttercream frosting',
          sku: 'CAKE-VBC-003',
          categoryId: categories[9].id, // Cakes
          batchNumber: 'VBC-20250920-001',
          productionDate: new Date('2025-09-20'),
          expirationDate: new Date('2025-09-23'),
          shelfLife: 3,
          quantity: 6.0,
          reservedQuantity: 0.0,
          unit: 'cakes',
          salePrice: 28.00,
          costToProduce: 8.75,
          packagingInfo: 'Cake box with viewing window, includes candles',
          storageLocationId: storageLocations[1].id, // Walk-in Cooler
          status: 'COMPLETED',
          isContaminated: false
        }
      })
    ]);
    console.log(`✅ Created ${finishedProducts.length} finished products`);

    console.log('\n🎉 Database seeded successfully with realistic bakery data!');
    console.log('\n📊 Summary:');
    console.log(`- ${units.length} units created`);
    console.log(`- ${storageLocations.length} storage locations created`);
    console.log(`- ${suppliers.length} suppliers created`);
    console.log(`- ${categories.length} categories created`);
    console.log(`- ${rawMaterials.length} raw materials created`);
    console.log(`- ${recipes.length} recipes created`);
    console.log(`- ${recipeIngredients.length} recipe ingredients created`);
    console.log(`- ${finishedProducts.length} finished products created`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDatabase()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });