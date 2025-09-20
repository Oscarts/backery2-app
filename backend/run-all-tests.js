/**
 * Script to run all API tests in sequence
 */
const { spawn } = require('child_process');

const tests = [
  'test-contamination-api.js',
  'test-contamination-endpoint.js',
  'test-contamination-update.js',
  'test-quality-api.js',
  'test-quality-update.js',
  'test-api-fix.js',
  'test-finished-product-update.js',
  'test-intermediate-product-update.js',
  'test-what-can-i-make.js', // Added new test for What Can I Make API
  'test-production-completion-fix.js', // Added test for production completion fix
  'test-production-indicators.js', // Added test for production indicators
  'src/tests/materialTracking.test.ts', // Added material tracking service tests
  'src/tests/materialTrackingAPI.test.ts' // Added material tracking API tests
];

async function runTests() {
  console.log('🚀 Running all API tests...\n');

  for (const test of tests) {
    console.log(`\n📝 Running ${test}...`);
    console.log('='.repeat(50));

    // Run test and wait for it to complete
    await new Promise((resolve, reject) => {
      const child = spawn('node', [test], { stdio: 'inherit' });

      child.on('close', code => {
        if (code === 0) {
          console.log(`\n✅ ${test} completed successfully`);
          resolve();
        } else {
          console.log(`\n❌ ${test} failed with code ${code}`);
          resolve(); // Continue with next test even if this one fails
        }
      });

      child.on('error', err => {
        console.error(`\n❌ Error running ${test}:`, err);
        resolve(); // Continue with next test even if this one fails
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
