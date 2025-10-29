const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const standardUnits = [
  // Weight Units
  { name: 'Kilogram', symbol: 'kg', category: 'WEIGHT', description: 'Standard metric unit of mass', isActive: true },
  { name: 'Gram', symbol: 'g', category: 'WEIGHT', description: 'Metric unit of mass', isActive: true },
  { name: 'Pound', symbol: 'lb', category: 'WEIGHT', description: 'Imperial unit of mass', isActive: true },
  { name: 'Ounce', symbol: 'oz', category: 'WEIGHT', description: 'Imperial unit of mass', isActive: true },
  
  // Volume Units
  { name: 'Liter', symbol: 'L', category: 'VOLUME', description: 'Standard metric unit of volume', isActive: true },
  { name: 'Milliliter', symbol: 'mL', category: 'VOLUME', description: 'Metric unit of volume', isActive: true },
  { name: 'Cup', symbol: 'cup', category: 'VOLUME', description: 'US customary unit of volume', isActive: true },
  { name: 'Tablespoon', symbol: 'tbsp', category: 'VOLUME', description: 'Cooking measurement unit', isActive: true },
  { name: 'Teaspoon', symbol: 'tsp', category: 'VOLUME', description: 'Cooking measurement unit', isActive: true },
  { name: 'Fluid Ounce', symbol: 'fl oz', category: 'VOLUME', description: 'US customary unit of volume', isActive: true },
  { name: 'Gallon', symbol: 'gal', category: 'VOLUME', description: 'US customary unit of volume', isActive: true },
  { name: 'Quart', symbol: 'qt', category: 'VOLUME', description: 'US customary unit of volume', isActive: true },
  { name: 'Pint', symbol: 'pt', category: 'VOLUME', description: 'US customary unit of volume', isActive: true },
  
  // Count Units
  { name: 'Piece', symbol: 'pc', category: 'COUNT', description: 'Individual items', isActive: true },
  { name: 'Each', symbol: 'ea', category: 'COUNT', description: 'Individual items', isActive: true },
  { name: 'Dozen', symbol: 'dz', category: 'COUNT', description: '12 pieces', isActive: true },
  { name: 'Pack', symbol: 'pk', category: 'COUNT', description: 'Package of items', isActive: true },
  { name: 'Box', symbol: 'bx', category: 'COUNT', description: 'Box of items', isActive: true },
  { name: 'Case', symbol: 'cs', category: 'COUNT', description: 'Case of items', isActive: true },
  
  // Temperature Units (for recipes)
  { name: 'Celsius', symbol: '°C', category: 'TEMPERATURE', description: 'Metric temperature unit', isActive: true },
  { name: 'Fahrenheit', symbol: '°F', category: 'TEMPERATURE', description: 'Imperial temperature unit', isActive: true },
  
  // Time Units (for recipes)
  { name: 'Minute', symbol: 'min', category: 'TIME', description: 'Time unit', isActive: true },
  { name: 'Hour', symbol: 'hr', category: 'TIME', description: 'Time unit', isActive: true },
  { name: 'Second', symbol: 's', category: 'TIME', description: 'Time unit', isActive: true }
];

async function seedStandardUnits() {
  try {
    console.log('Starting standard units seeding...');
    
    // First, delete existing test units
    console.log('Deleting existing test units...');
    await prisma.unit.deleteMany({
      where: {
        name: {
          contains: 'Test'
        }
      }
    });
    
    // Clear all units to start fresh
    console.log('Clearing all existing units...');
    await prisma.unit.deleteMany();
    
    // Create standard units
    console.log('Creating standard units...');
    const createdUnits = await prisma.unit.createMany({
      data: standardUnits,
      skipDuplicates: true
    });
    
    console.log(`Successfully created ${createdUnits.count} standard units!`);
    
    // Verify created units
    const allUnits = await prisma.unit.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    
    console.log('\nCreated units by category:');
    const unitsByCategory = allUnits.reduce((acc, unit) => {
      if (!acc[unit.category]) acc[unit.category] = [];
      acc[unit.category].push(unit);
      return acc;
    }, {});
    
    Object.entries(unitsByCategory).forEach(([category, units]) => {
      console.log(`\n${category}:`);
      units.forEach(unit => {
        console.log(`  - ${unit.name} (${unit.symbol})`);
      });
    });
    
  } catch (error) {
    console.error('Error seeding standard units:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedStandardUnits();