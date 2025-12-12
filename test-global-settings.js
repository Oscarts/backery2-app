const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

// Test credentials
const SUPER_ADMIN = {
  email: 'superadmin@system.local',
  password: 'superadmin123'
};

const ORG_ADMIN = {
  email: 'oscar@test.com',
  password: 'oscar@test.com'
};

let superAdminToken = '';
let orgAdminToken = '';

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

async function login(credentials, role) {
  try {
    log(`\n🔐 Logging in as ${role}...`, 'cyan');
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    log(`✅ Login successful`, 'green');
    log(`   User: ${response.data.data.user.email}`, 'blue');
    log(`   Role: ${response.data.data.user.customRole?.name || response.data.data.user.role}`, 'blue');
    log(`   Client: ${response.data.data.user.client.name}`, 'blue');
    log(`   Permissions: ${response.data.data.user.permissions.length}`, 'blue');
    return response.data.data.token;
  } catch (error) {
    log(`❌ Login failed: ${error.response?.data?.error || error.message}`, 'red');
    throw error;
  }
}

async function testGetUnits(token, role, shouldSucceed = true) {
  try {
    log(`\n📋 Testing GET /api/units as ${role}...`, 'cyan');
    const response = await axios.get(`${BASE_URL}/units`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ GET units successful - ${response.data.length} units found`, 'green');
    return response.data;
  } catch (error) {
    if (shouldSucceed) {
      log(`❌ GET units failed: ${error.response?.data?.message || error.message}`, 'red');
    } else {
      log(`✅ GET units correctly rejected (expected)`, 'green');
    }
  }
}

async function testCreateUnit(token, role, shouldSucceed = true) {
  try {
    log(`\n➕ Testing POST /api/units as ${role}...`, 'cyan');
    const newUnit = {
      name: `Test Unit ${Date.now()}`,
      symbol: `TU${Date.now()}`,
      category: 'WEIGHT',
      description: 'Test unit for automated testing'
    };
    const response = await axios.post(`${BASE_URL}/units`, newUnit, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ POST unit successful - Created "${response.data.data.name}"`, 'green');
    return response.data.data;
  } catch (error) {
    if (!shouldSucceed) {
      log(`✅ POST unit correctly rejected: ${error.response?.data?.message}`, 'green');
    } else {
      log(`❌ POST unit failed: ${error.response?.data?.message || error.message}`, 'red');
    }
  }
}

async function testUpdateUnit(token, unitId, role, shouldSucceed = true) {
  try {
    log(`\n✏️  Testing PUT /api/units/${unitId} as ${role}...`, 'cyan');
    const updates = {
      name: `Updated Unit ${Date.now()}`,
      symbol: `UU${Date.now()}`,
      category: 'WEIGHT',
      description: 'Updated test unit'
    };
    const response = await axios.put(`${BASE_URL}/units/${unitId}`, updates, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ PUT unit successful - Updated to "${response.data.data.name}"`, 'green');
    return response.data.data;
  } catch (error) {
    if (!shouldSucceed) {
      log(`✅ PUT unit correctly rejected: ${error.response?.data?.message}`, 'green');
    } else {
      log(`❌ PUT unit failed: ${error.response?.data?.message || error.message}`, 'red');
    }
  }
}

async function testDeleteUnit(token, unitId, role, shouldSucceed = true) {
  try {
    log(`\n🗑️  Testing DELETE /api/units/${unitId} as ${role}...`, 'cyan');
    await axios.delete(`${BASE_URL}/units/${unitId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    log(`✅ DELETE unit successful`, 'green');
  } catch (error) {
    if (!shouldSucceed) {
      log(`✅ DELETE unit correctly rejected: ${error.response?.data?.message}`, 'green');
    } else {
      log(`❌ DELETE unit failed: ${error.response?.data?.message || error.message}`, 'red');
    }
  }
}

async function testPermissions(token, role) {
  try {
    log(`\n🔍 Checking ${role} permissions...`, 'cyan');
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const permissions = response.data.permissions;
    const hasClientsView = permissions.some(p => p.resource === 'clients' && p.action === 'view');
    const hasSettingsView = permissions.some(p => p.resource === 'settings' && p.action === 'view');

    log(`   Total Permissions: ${permissions.length}`, 'blue');
    log(`   Has 'clients:view': ${hasClientsView ? '✅' : '❌'}`, hasClientsView ? 'green' : 'red');
    log(`   Has 'settings:view': ${hasSettingsView ? '✅' : '❌'}`, hasSettingsView ? 'green' : 'red');

    if (role === 'Super Admin') {
      log(`   Expected: clients:view = YES, settings:view = NO`, 'yellow');
    } else {
      log(`   Expected: clients:view = NO, settings:view = YES`, 'yellow');
    }

    return { hasClientsView, hasSettingsView };
  } catch (error) {
    log(`❌ Permission check failed: ${error.response?.data?.message || error.message}`, 'red');
  }
}

async function runTests() {
  try {
    logSection('🧪 GLOBAL SETTINGS SEPARATION TEST SUITE');

    // Login both users
    logSection('STEP 1: Authentication');
    superAdminToken = await login(SUPER_ADMIN, 'Super Admin');
    orgAdminToken = await login(ORG_ADMIN, 'Organization Admin');

    // Check permissions
    logSection('STEP 2: Permission Verification');
    const superAdminPerms = await testPermissions(superAdminToken, 'Super Admin');
    const orgAdminPerms = await testPermissions(orgAdminToken, 'Organization Admin');

    // Test Super Admin can read units
    logSection('STEP 3: Super Admin - Read Units (Should Succeed)');
    const units = await testGetUnits(superAdminToken, 'Super Admin', true);

    // Test Org Admin can read units
    logSection('STEP 4: Organization Admin - Read Units (Should Succeed)');
    await testGetUnits(orgAdminToken, 'Organization Admin', true);

    // Test Super Admin can create units
    logSection('STEP 5: Super Admin - Create Unit (Should Succeed)');
    const newUnit = await testCreateUnit(superAdminToken, 'Super Admin', true);

    // Test Org Admin cannot create units
    logSection('STEP 6: Organization Admin - Create Unit (Should Fail)');
    await testCreateUnit(orgAdminToken, 'Organization Admin', false);

    if (newUnit) {
      // Test Super Admin can update units
      logSection('STEP 7: Super Admin - Update Unit (Should Succeed)');
      await testUpdateUnit(superAdminToken, newUnit.id, 'Super Admin', true);

      // Test Org Admin cannot update units
      logSection('STEP 8: Organization Admin - Update Unit (Should Fail)');
      await testUpdateUnit(orgAdminToken, newUnit.id, 'Organization Admin', false);

      // Test Org Admin cannot delete units
      logSection('STEP 9: Organization Admin - Delete Unit (Should Fail)');
      await testDeleteUnit(orgAdminToken, newUnit.id, 'Organization Admin', false);

      // Test Super Admin can delete units
      logSection('STEP 10: Super Admin - Delete Unit (Should Succeed)');
      await testDeleteUnit(superAdminToken, newUnit.id, 'Super Admin', true);
    }

    // Summary
    logSection('✨ TEST SUMMARY');
    log('✅ All tests completed!', 'green');
    log('\nExpected Results:', 'bold');
    log('  ✓ Both roles can READ units (global resource)', 'green');
    log('  ✓ Only Super Admin can CREATE/UPDATE/DELETE units', 'green');
    log('  ✓ Organization Admin gets 403 Forbidden on write operations', 'green');
    log('\nFrontend Navigation:', 'bold');
    log('  ✓ Super Admin sees "Global Settings" menu item', 'yellow');
    log('  ✓ Organization Admin sees "Settings" with read-only units', 'yellow');
    log('  ✓ Both can use units in dropdowns (comboboxes)', 'yellow');

  } catch (error) {
    log('\n❌ Test suite failed:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
runTests();
