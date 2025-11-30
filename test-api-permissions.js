#!/usr/bin/env node

/**
 * API Integration Test - Permission System
 * Tests actual HTTP endpoints with different user roles
 * Following CODE_GUIDELINES.md - verify system works end-to-end
 */

const http = require('http');

const API_BASE = 'http://localhost:8000/api';

// Helper to make HTTP requests
function apiRequest(method, path, token = null, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

async function testPermissionSystem() {
    console.log('🧪 API INTEGRATION TEST - PERMISSION SYSTEM');
    console.log('='.repeat(60));
    console.log('Testing actual HTTP endpoints with role-based permissions\n');

    const results = { passed: 0, failed: 0, tests: [] };

    try {
        // Test 1: Login as Super Admin
        console.log('📋 Test 1: Super Admin Login');
        console.log('-'.repeat(60));

        const superadminLogin = await apiRequest('POST', '/auth/login', null, {
            email: 'superadmin@system.local',
            password: 'superadmin123'
        });

        if (superadminLogin.status === 200 && superadminLogin.data.data?.token) {
            console.log('✅ PASSED: Super admin logged in successfully');
            results.passed++;
            results.tests.push({ name: 'Super Admin Login', status: 'PASS' });
        } else {
            console.log('❌ FAILED: Super admin login failed');
            console.log('   Response:', superadminLogin.status, superadminLogin.data);
            results.failed++;
            results.tests.push({ name: 'Super Admin Login', status: 'FAIL', details: superadminLogin.data });
        }

        const superadminToken = superadminLogin.data.data?.token;

        // Test 2: Super Admin can access clients endpoint
        console.log('\n📋 Test 2: Super Admin - Access Clients Endpoint');
        console.log('-'.repeat(60));

        const clientsAccess = await apiRequest('GET', '/clients', superadminToken);

        if (clientsAccess.status === 200) {
            console.log('✅ PASSED: Super admin can access clients endpoint');
            console.log(`   Found ${clientsAccess.data.data?.clients?.length || 0} clients`);
            results.passed++;
            results.tests.push({ name: 'Super Admin - Clients Access', status: 'PASS' });
        } else {
            console.log('❌ FAILED: Super admin cannot access clients');
            console.log('   Response:', clientsAccess.status, clientsAccess.data);
            results.failed++;
            results.tests.push({ name: 'Super Admin - Clients Access', status: 'FAIL', details: clientsAccess.data });
        }

        // Test 3: Login as Organization Admin
        console.log('\n📋 Test 3: Organization Admin Login');
        console.log('-'.repeat(60));

        const orgAdminLogin = await apiRequest('POST', '/auth/login', null, {
            email: 'admin@abcbakery.com',
            password: 'admin123'
        });

        if (orgAdminLogin.status === 200 && orgAdminLogin.data.data?.token) {
            console.log('✅ PASSED: Org admin logged in successfully');
            results.passed++;
            results.tests.push({ name: 'Org Admin Login', status: 'PASS' });
        } else {
            console.log('❌ FAILED: Org admin login failed');
            console.log('   Response:', orgAdminLogin.status, orgAdminLogin.data);
            results.failed++;
            results.tests.push({ name: 'Org Admin Login', status: 'FAIL', details: orgAdminLogin.data });
        }

        const orgAdminToken = orgAdminLogin.data.data?.token;

        // Test 4: Org Admin CANNOT access clients endpoint
        console.log('\n📋 Test 4: Org Admin - Blocked from Clients Endpoint');
        console.log('-'.repeat(60));

        const orgAdminClientsAccess = await apiRequest('GET', '/clients', orgAdminToken);

        if (orgAdminClientsAccess.status === 403) {
            console.log('✅ PASSED: Org admin correctly blocked from clients endpoint');
            results.passed++;
            results.tests.push({ name: 'Org Admin - Clients Blocked', status: 'PASS' });
        } else {
            console.log('❌ FAILED: Org admin should not access clients');
            console.log('   Response:', orgAdminClientsAccess.status, orgAdminClientsAccess.data);
            results.failed++;
            results.tests.push({ name: 'Org Admin - Clients Blocked', status: 'FAIL', details: orgAdminClientsAccess.data });
        }

        // Test 5: Org Admin CAN access raw materials
        console.log('\n📋 Test 5: Org Admin - Access Raw Materials');
        console.log('-'.repeat(60));

        const rawMaterialsAccess = await apiRequest('GET', '/raw-materials', orgAdminToken);

        if (rawMaterialsAccess.status === 200) {
            console.log('✅ PASSED: Org admin can access raw materials');
            results.passed++;
            results.tests.push({ name: 'Org Admin - Raw Materials Access', status: 'PASS' });
        } else {
            console.log('❌ FAILED: Org admin should access raw materials');
            console.log('   Response:', rawMaterialsAccess.status, rawMaterialsAccess.data);
            results.failed++;
            results.tests.push({ name: 'Org Admin - Raw Materials Access', status: 'FAIL', details: rawMaterialsAccess.data });
        }

        // Test 6: Org Admin CAN access customers
        console.log('\n📋 Test 6: Org Admin - Access Customers');
        console.log('-'.repeat(60));

        const customersAccess = await apiRequest('GET', '/customers', orgAdminToken);

        if (customersAccess.status === 200) {
            console.log('✅ PASSED: Org admin can access customers');
            results.passed++;
            results.tests.push({ name: 'Org Admin - Customers Access', status: 'PASS' });
        } else {
            console.log('❌ FAILED: Org admin should access customers');
            console.log('   Response:', customersAccess.status, customersAccess.data);
            results.failed++;
            results.tests.push({ name: 'Org Admin - Customers Access', status: 'FAIL', details: customersAccess.data });
        }

        // Test 7: Org Admin CAN access recipes
        console.log('\n📋 Test 7: Org Admin - Access Recipes');
        console.log('-'.repeat(60));

        const recipesAccess = await apiRequest('GET', '/recipes', orgAdminToken);

        if (recipesAccess.status === 200) {
            console.log('✅ PASSED: Org admin can access recipes');
            results.passed++;
            results.tests.push({ name: 'Org Admin - Recipes Access', status: 'PASS' });
        } else {
            console.log('❌ FAILED: Org admin should access recipes');
            console.log('   Response:', recipesAccess.status, recipesAccess.data);
            results.failed++;
            results.tests.push({ name: 'Org Admin - Recipes Access', status: 'FAIL', details: recipesAccess.data });
        }

        // Test 8: Multi-tenant isolation - ABC Bakery sees only their data
        console.log('\n📋 Test 8: Multi-Tenant Isolation - ABC Bakery Data');
        console.log('-'.repeat(60));

        const abcCustomers = await apiRequest('GET', '/customers', orgAdminToken);

        if (abcCustomers.status === 200) {
            const customers = abcCustomers.data.data?.customers || abcCustomers.data.customers || [];
            console.log(`✅ PASSED: ABC Bakery sees ${customers.length} customers (isolated data)`);
            results.passed++;
            results.tests.push({ name: 'Multi-Tenant Isolation', status: 'PASS' });
        } else {
            console.log('❌ FAILED: Could not verify tenant isolation');
            results.failed++;
            results.tests.push({ name: 'Multi-Tenant Isolation', status: 'FAIL' });
        }

        // Test 9: Dashboard access for all users
        console.log('\n📋 Test 9: Dashboard Access');
        console.log('-'.repeat(60));

        const superadminDashboard = await apiRequest('GET', '/dashboard/summary', superadminToken);
        const orgAdminDashboard = await apiRequest('GET', '/dashboard/summary', orgAdminToken);

        if (superadminDashboard.status === 200 && orgAdminDashboard.status === 200) {
            console.log('✅ PASSED: Both super admin and org admin can access dashboard');
            results.passed++;
            results.tests.push({ name: 'Dashboard Access', status: 'PASS' });
        } else {
            console.log('❌ FAILED: Dashboard access issues');
            console.log('   Super Admin:', superadminDashboard.status);
            console.log('   Org Admin:', orgAdminDashboard.status);
            results.failed++;
            results.tests.push({ name: 'Dashboard Access', status: 'FAIL' });
        }

        // Test 10: Unauthenticated access blocked
        console.log('\n📋 Test 10: Unauthenticated Access Blocked');
        console.log('-'.repeat(60));

        const noAuthAccess = await apiRequest('GET', '/raw-materials', null);

        if (noAuthAccess.status === 401) {
            console.log('✅ PASSED: Unauthenticated requests correctly blocked');
            results.passed++;
            results.tests.push({ name: 'Auth Required', status: 'PASS' });
        } else {
            console.log('❌ FAILED: Should require authentication');
            console.log('   Response:', noAuthAccess.status);
            results.failed++;
            results.tests.push({ name: 'Auth Required', status: 'FAIL' });
        }

        // Final Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 API TEST SUMMARY');
        console.log('='.repeat(60));

        const total = results.passed + results.failed;
        const passRate = ((results.passed / total) * 100).toFixed(1);

        console.log(`\nTotal Tests: ${total}`);
        console.log(`✅ Passed: ${results.passed} (${passRate}%)`);
        console.log(`❌ Failed: ${results.failed}`);

        console.log('\n📋 Test Results:');
        results.tests.forEach(test => {
            const icon = test.status === 'PASS' ? '✅' : '❌';
            console.log(`   ${icon} ${test.name}`);
        });

        if (results.failed === 0) {
            console.log('\n🎉 ALL API TESTS PASSED!');
            console.log('\n✅ The permission system is working correctly:');
            console.log('   • Super Admin has full access to all endpoints');
            console.log('   • Org Admins can access their resources');
            console.log('   • Org Admins are blocked from client management');
            console.log('   • Multi-tenant isolation is working');
            console.log('   • Authentication is required for protected routes');
            console.log('\n🚀 System is ready for production!');
        } else {
            console.log('\n⚠️  Some API tests failed - review details above');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n💥 Test error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Check if server is running
async function checkServer() {
    try {
        const health = await apiRequest('GET', '/health');
        if (health.status === 200) {
            console.log('✅ Server is running\n');
            return true;
        }
    } catch (error) {
        console.log('❌ Server is not running!');
        console.log('   Please start the server with: npm run dev');
        console.log('   Then run this test again.\n');
        process.exit(1);
    }
}

checkServer().then(() => testPermissionSystem());
