# API Testing Fixes

I've identified that the failing tests are primarily due to the backend server not running or being interrupted. Here's a diagnostic and solution guide for fixing these test issues:

## Problem Diagnosis

1. **Backend Server Not Running**: Most failures occur because the backend server isn't running or gets interrupted
2. **Connection Issues**: Tests show ECONNREFUSED errors when trying to connect to `http://localhost:8000`
3. **Server Stability**: The server appears to be shutting down unexpectedly during testing

## Solutions

1. **Start Backend Server Before Testing**:
   ```bash
   cd /Users/oscar/backery2-app/backend
   npm run dev
   ```

2. **Enhance Test Resilience**:
   - Add server health check before running tests
   - Implement retry logic for transient failures
   - Add proper error handling with clear error messages
   - Ensure tests clean up after themselves even on failure

3. **Run Tests in Separate Terminal**:
   - Keep the server running in one terminal
   - Run tests in another terminal to avoid interrupting the server

4. **Test Modification Recommendations**:
   - Add a pre-test check to verify server is running
   - Implement a more graceful failure mode that doesn't crash the entire test suite
   - Add timeout handling to prevent tests from hanging

## Implementation Notes

For all API tests, add this function and call it at the beginning:

```javascript
async function checkServerHealth() {
  try {
    const response = await fetch('http://localhost:8000/health', {
      timeout: 5000 // 5 second timeout
    });
    
    if (!response.ok) {
      console.error('⚠️ Server is running but health check failed');
      console.error('Status:', response.status);
      return false;
    }
    
    console.log('✅ Server is running and healthy');
    return true;
  } catch (error) {
    console.error('⚠️ Server not running or not accessible');
    console.error('Make sure to start the backend server with: npm run dev');
    return false;
  }
}

// Use at beginning of tests
const serverHealthy = await checkServerHealth();
if (!serverHealthy) {
  console.error('❌ Tests cannot run without a healthy server');
  process.exit(1);
}
```

This approach will ensure tests only run when the server is available and provide clear guidance when it's not.
