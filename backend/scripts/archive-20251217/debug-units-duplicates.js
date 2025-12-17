const axios = require('axios');

async function debugUnitsDuplicates() {
  const baseURL = 'http://localhost:8000/api';
  
  console.log('🔍 Checking for duplicate units...\n');
  
  try {
    const unitsResponse = await axios.get(`${baseURL}/units`);
    const units = unitsResponse.data.data || [];
    
    // Check for name duplicates
    const names = units.map(u => u.name.toLowerCase());
    const nameCount = {};
    names.forEach(name => {
      nameCount[name] = (nameCount[name] || 0) + 1;
    });
    
    console.log('Name duplicates:');
    Object.entries(nameCount).filter(([name, count]) => count > 1).forEach(([name, count]) => {
      console.log(`  - "${name}": ${count} occurrences`);
    });
    
    // Check for symbol duplicates
    const symbols = units.map(u => u.symbol.toLowerCase());
    const symbolCount = {};
    symbols.forEach(symbol => {
      symbolCount[symbol] = (symbolCount[symbol] || 0) + 1;
    });
    
    console.log('\nSymbol duplicates:');
    Object.entries(symbolCount).filter(([symbol, count]) => count > 1).forEach(([symbol, count]) => {
      console.log(`  - "${symbol}": ${count} occurrences`);
    });
    
    // Check if our test values exist
    const testName = 'Test Unit CRUD';
    const testSymbol = 'tuc';
    
    const existingWithName = units.find(u => u.name.toLowerCase() === testName.toLowerCase());
    const existingWithSymbol = units.find(u => u.symbol.toLowerCase() === testSymbol.toLowerCase());
    
    console.log(`\nTest values check:`);
    console.log(`  - Name "${testName}" exists:`, !!existingWithName);
    console.log(`  - Symbol "${testSymbol}" exists:`, !!existingWithSymbol);
    
    if (existingWithName) {
      console.log(`    Found unit with name: ${existingWithName.name} (${existingWithName.symbol})`);
    }
    if (existingWithSymbol) {
      console.log(`    Found unit with symbol: ${existingWithSymbol.name} (${existingWithSymbol.symbol})`);
    }
    
  } catch (error) {
    console.log('❌ Failed to check units:', error.message);
  }
}

debugUnitsDuplicates();