/**
 * Script to run all API tests in sequence
 */
const { spawn } = require('child_process');

const tests = [
  // Core API tests
  'test-api-fix.js',
  'test-recipe-api.js',
  'test-what-can-i-make.js',

  // Contamination tests
  'test-contamination-api.js',
  'test-contamination-endpoint.js',
  'test-contamination-update.js',

  // Quality tests
  'test-quality-api.js',
  'test-quality-update.js',
  'test-quality-status-enhanced.js',

  // Production tests
  'test-production-completion-fix.js',
  'test-production-indicators.js',
  'test-simple-production-completion.js',
  'test-end-to-end-production.js',
  'test-complete-production-workflow.js',
  'test-production-sku-stability.js',

  // Inventory tests
  'test-inventory-integration.js',
  'test-inventory-minimal.js',
  'test-inventory-quick.js',
  'test-material-tracking.js',

  // Product tests
  'test-finished-product-update.js',
  'test-finished-product-status.js',

  // SKU mapping tests
  'test-raw-material-sku-reuse.js',
  'test-finished-product-sku-reuse.js'
];

// Adjust Jest test paths if they exist after build
const jestTests = [
  'dist/tests/materialTracking.test.js',
  'dist/tests/materialTrackingAPI.test.js'
];

async function runTests() {
  console.log('🚀 Running all API tests...\n');


  for (const test of tests) {
    console.log(`\n📝 Running ${test}...`);
    console.log('='.repeat(50));
    await new Promise((resolve, reject) => {
  const child = spawn('node', [test], { stdio: 'inherit' });
      child.on('close', code => {
        if (code === 0) {
          console.log(`\n✅ ${test} completed successfully`);
          resolve();
        } else {
          console.log(`\n❌ ${test} failed with code ${code}`);
          resolve();
        }
      });
      child.on('error', err => {
        console.error(`\n❌ Error running ${test}:`, err);
        resolve();
      });
    });
    console.log('='.repeat(50));
  }

  // Run Jest tests
  for (const jestTest of jestTests) {
    console.log(`\n📝 Running Jest test: ${jestTest}...`);
    console.log('='.repeat(50));
    await new Promise((resolve, reject) => {
      const child = spawn('npx', ['jest', jestTest], { stdio: 'inherit' });
      child.on('close', code => {
        if (code === 0) {
          console.log(`\n✅ Jest test ${jestTest} completed successfully`);
          resolve();
        } else {
          console.log(`\n❌ Jest test ${jestTest} failed with code ${code}`);
          resolve();
        }
      });
      child.on('error', err => {
        console.error(`\n❌ Error running Jest test ${jestTest}:`, err);
        resolve();
      });
    });
    console.log('='.repeat(50));
  }

  console.log('\n🎯 All tests completed!');
}

runTests().catch(err => {
  console.error('Error in test runner:', err);
  process.exit(1);
});
