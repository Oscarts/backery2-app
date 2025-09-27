/**
 * Script to run all API tests in sequence
 */
const { spawn } = require('child_process');

const tests = [
  // Core API tests
  'backend/test-api-fix.js',
  'backend/test-recipe-api.js',
  'backend/test-what-can-i-make.js',
  
  // Contamination tests  
  'backend/test-contamination-api.js',
  'backend/test-contamination-endpoint.js',
  'backend/test-contamination-update.js',
  
  // Quality tests
  'backend/test-quality-api.js',
  'backend/test-quality-update.js',
  'backend/test-quality-status-enhanced.js',
  
  // Production tests
  'backend/test-production-completion-fix.js',
  'backend/test-production-indicators.js',
  'backend/test-simple-production-completion.js',
  'backend/test-end-to-end-production.js',
  'backend/test-complete-production-workflow.js',
  
  // Inventory tests
  'backend/test-inventory-integration.js',
  'backend/test-inventory-minimal.js',
  'backend/test-inventory-quick.js',
  'backend/test-material-tracking.js',
  
  // Product tests
  'backend/test-finished-product-update.js',
  'backend/test-finished-product-status.js'
];

const jestTests = [
  'backend/dist/tests/materialTracking.test.js',
  'backend/dist/tests/materialTrackingAPI.test.js'
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
