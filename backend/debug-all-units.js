const axios = require('axios');

async function checkAllUnits() {
  const baseURL = 'http://localhost:8000/api';
  
  console.log('🔍 Checking ALL units (including inactive)...\n');
  
  try {
    // First check through database directly
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const allUnits = await prisma.unit.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`Total units in database: ${allUnits.length}`);
    
    const testName = 'Test Unit CRUD';
    const testSymbol = 'tuc';
    
    // Check for exact matches (case sensitive)
    const exactNameMatch = allUnits.find(u => u.name === testName);
    const exactSymbolMatch = allUnits.find(u => u.symbol === testSymbol);
    
    console.log(`\nExact matches:`);
    console.log(`  - Name "${testName}":`, exactNameMatch ? `Found (${exactNameMatch.isActive ? 'active' : 'inactive'})` : 'Not found');
    console.log(`  - Symbol "${testSymbol}":`, exactSymbolMatch ? `Found (${exactSymbolMatch.isActive ? 'active' : 'inactive'})` : 'Not found');
    
    // Check for case-insensitive matches
    const caseInsensitiveNameMatch = allUnits.find(u => u.name.toLowerCase() === testName.toLowerCase());
    const caseInsensitiveSymbolMatch = allUnits.find(u => u.symbol.toLowerCase() === testSymbol.toLowerCase());
    
    console.log(`\nCase-insensitive matches:`);
    console.log(`  - Name "${testName}":`, caseInsensitiveNameMatch ? `Found "${caseInsensitiveNameMatch.name}" (${caseInsensitiveNameMatch.isActive ? 'active' : 'inactive'})` : 'Not found');
    console.log(`  - Symbol "${testSymbol}":`, caseInsensitiveSymbolMatch ? `Found "${caseInsensitiveSymbolMatch.symbol}" (${caseInsensitiveSymbolMatch.isActive ? 'active' : 'inactive'})` : 'Not found');
    
    // Show inactive units
    const inactiveUnits = allUnits.filter(u => !u.isActive);
    console.log(`\nInactive units (${inactiveUnits.length}):`);
    inactiveUnits.forEach(unit => {
      console.log(`  - ${unit.name} (${unit.symbol})`);
    });
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.log('❌ Failed to check database:', error.message);
  }
}

checkAllUnits();