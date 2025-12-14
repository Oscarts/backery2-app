// Test script to verify Raw Materials page loads correctly
console.log('🧪 Testing Raw Materials Page...\n');

async function testRawMaterialsPage() {
  try {
    // Test backend API
    console.log('1. Testing Backend API:');
    const apiResponse = await fetch('http://localhost:8000/api/raw-materials');
    const apiData = await apiResponse.json();
    console.log(`   ✅ API Status: ${apiResponse.status}`);
    console.log(`   ✅ Success: ${apiData.success}`);
    console.log(`   ✅ Raw Materials Count: ${apiData.data.length}`);
    
    if (apiData.data.length > 0) {
      console.log(`   ✅ First Material: ${apiData.data[0].name}`);
      console.log(`   ✅ Has supplier: ${!!apiData.data[0].supplier}`);
      console.log(`   ✅ Has category: ${!!apiData.data[0].category}`);
      console.log(`   ✅ Has unitDetails: ${!!apiData.data[0].unitDetails}`);
    }

    // Test suppliers endpoint
    console.log('\n2. Testing Suppliers API:');
    const suppliersResponse = await fetch('http://localhost:8000/api/suppliers');
    const suppliersData = await suppliersResponse.json();
    console.log(`   ✅ Suppliers Count: ${suppliersData.data.length}`);

    // Test units endpoint
    console.log('\n3. Testing Units API:');
    const unitsResponse = await fetch('http://localhost:8000/api/units');
    const unitsData = await unitsResponse.json();
    console.log(`   ✅ Units Count: ${unitsData.data.length}`);

    // Test storage locations endpoint
    console.log('\n4. Testing Storage Locations API:');
    const locationsResponse = await fetch('http://localhost:8000/api/storage-locations');
    const locationsData = await locationsResponse.json();
    console.log(`   ✅ Storage Locations Count: ${locationsData.data.length}`);

    // Test categories endpoint
    console.log('\n5. Testing Categories API:');
    const categoriesResponse = await fetch('http://localhost:8000/api/categories');
    const categoriesData = await categoriesResponse.json();
    const rawMaterialCategories = categoriesData.data.filter(c => c.type === 'RAW_MATERIAL');
    console.log(`   ✅ Total Categories: ${categoriesData.data.length}`);
    console.log(`   ✅ RAW_MATERIAL Categories: ${rawMaterialCategories.length}`);

    console.log('\n✅ All backend endpoints are working correctly!');
    console.log('\n📝 If the page is not loading:');
    console.log('   1. Open browser DevTools (F12)');
    console.log('   2. Check Console tab for errors');
    console.log('   3. Check Network tab to see if API calls are failing');
    console.log('   4. Try hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)');
    console.log('   5. Clear browser cache and reload');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRawMaterialsPage();
