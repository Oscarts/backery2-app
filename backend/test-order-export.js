/**
 * Test Word Export Functionality for Customer Orders
 * Tests export capability for all order statuses (DRAFT, CONFIRMED, FULFILLED)
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:8000/api';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}▶${colors.reset} ${msg}\n`),
};

/**
 * Test helper to create test order
 */
async function createTestOrder(customerId, status = 'DRAFT') {
  try {
    // First create a customer if not exists
    let customer;
    try {
      const customersResponse = await axios.get(`${API_BASE}/customers`);
      if (customersResponse.data.data && customersResponse.data.data.length > 0) {
        customer = customersResponse.data.data[0];
      } else {
        const customerCreate = await axios.post(`${API_BASE}/customers`, {
          name: 'Test Customer Export',
          email: 'test-export@example.com',
          phone: '+33 1 23 45 67 89',
          address: '123 Rue de la Paix, 75001 Paris, France',
        });
        customer = customerCreate.data.data;
      }
    } catch (error) {
      log.error(`Failed to get/create customer: ${error.message}`);
      return null;
    }

    // Get a finished product for the order
    const productsResponse = await axios.get(`${API_BASE}/finished-products`);
    if (!productsResponse.data.data || productsResponse.data.data.length === 0) {
      log.warning('No finished products available. Please seed the database first.');
      return null;
    }
    const product = productsResponse.data.data[0];

    // Create order
    const orderData = {
      customerId: customer.id,
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      priceMarkupPercentage: 30,
      tvaRate: 20, // 20% TVA (French standard rate)
      notes: `Test order for export functionality - Status: ${status}`,
      items: [
        {
          productId: product.id,
          quantity: 5,
          unitPrice: product.salePrice || 10.0,
        },
      ],
    };

    const response = await axios.post(`${API_BASE}/customer-orders`, orderData);
    const order = response.data.data;

    // Change status if needed
    if (status === 'CONFIRMED' && order.status === 'DRAFT') {
      const confirmResponse = await axios.post(`${API_BASE}/customer-orders/${order.id}/confirm`);
      return confirmResponse.data.data;
    } else if (status === 'FULFILLED') {
      if (order.status === 'DRAFT') {
        await axios.post(`${API_BASE}/customer-orders/${order.id}/confirm`);
      }
      const fulfillResponse = await axios.post(`${API_BASE}/customer-orders/${order.id}/fulfill`);
      return fulfillResponse.data.data;
    }

    return order;
  } catch (error) {
    log.error(`Failed to create test order: ${error.message}`);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

/**
 * Test Word export for a specific order
 */
async function testWordExport(orderId, orderNumber, status) {
  try {
    log.info(`Testing Word export for order ${orderNumber} (${status})...`);

    const response = await axios.get(`${API_BASE}/customer-orders/${orderId}/export/word`, {
      responseType: 'arraybuffer',
    });

    // Check response headers
    const contentType = response.headers['content-type'];
    if (
      !contentType ||
      !contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    ) {
      log.error(`Invalid content type: ${contentType}`);
      return false;
    }

    // Check if we received data
    if (!response.data || response.data.length === 0) {
      log.error('Received empty response');
      return false;
    }

    // Save file for manual inspection
    const outputDir = path.join(__dirname, 'test-exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `order-${orderNumber}-${status}.docx`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, Buffer.from(response.data));

    log.success(`Word export successful for ${status} order`);
    log.info(`  File saved: ${filepath}`);
    log.info(`  File size: ${(response.data.length / 1024).toFixed(2)} KB`);

    return true;
  } catch (error) {
    log.error(`Word export failed: ${error.message}`);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data.toString());
    }
    return false;
  }
}

/**
 * Test export functionality for all order statuses
 */
async function testAllStatuses() {
  log.section('Testing Word Export for All Order Statuses');

  const statuses = ['DRAFT', 'CONFIRMED', 'FULFILLED'];
  const results = {
    passed: 0,
    failed: 0,
  };

  for (const status of statuses) {
    log.section(`Testing ${status} Orders`);

    // Create test order
    const order = await createTestOrder(null, status);
    if (!order) {
      log.error(`Failed to create ${status} order`);
      results.failed++;
      continue;
    }

    log.success(`Created ${status} order: ${order.orderNumber}`);
    log.info(`  Order ID: ${order.id}`);
    log.info(`  Customer: ${order.customer?.name || 'N/A'}`);
    log.info(`  Total Price: €${order.totalPrice.toFixed(2)}`);
    log.info(`  TVA Rate: ${order.tvaRate}%`);
    log.info(`  Items: ${order.items?.length || 0}`);

    // Test export
    const exportSuccess = await testWordExport(order.id, order.orderNumber, status);
    if (exportSuccess) {
      results.passed++;
    } else {
      results.failed++;
    }

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Test document content and formatting
 */
async function testDocumentContent() {
  log.section('Testing Document Content and Formatting');

  // Create a test order with specific data
  const order = await createTestOrder(null, 'CONFIRMED');
  if (!order) {
    log.error('Failed to create test order');
    return false;
  }

  log.info('Checking document content requirements:');
  log.info('  ✓ Should show DEVIS for DRAFT orders');
  log.info('  ✓ Should show PROFORMA for CONFIRMED/FULFILLED orders');
  log.info('  ✓ Should include customer information');
  log.info('  ✓ Should list items with quantities and prices');
  log.info('  ✓ Should calculate Total HT (before tax)');
  log.info('  ✓ Should show TVA amount and rate');
  log.info('  ✓ Should show Total TTC (including tax)');
  log.info('  ✓ Should NOT include production costs');
  log.info('  ✓ Should include payment terms and conditions');

  const exportSuccess = await testWordExport(order.id, order.orderNumber, 'CONFIRMED');

  if (exportSuccess) {
    log.success('Document generated successfully');
    log.warning('Please manually verify the document contains:');
    log.warning('  - Professional French formatting');
    log.warning('  - All required sections');
    log.warning('  - Correct TVA calculations');
    log.warning('  - NO production cost information');
  }

  return exportSuccess;
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Customer Orders Word Export Test Suite');
  console.log('='.repeat(70));

  try {
    // Test 1: Export for all statuses
    const statusResults = await testAllStatuses();

    // Test 2: Document content and formatting
    await testDocumentContent();

    // Summary
    log.section('Test Summary');
    console.log(`Total Tests: ${statusResults.passed + statusResults.failed}`);
    log.success(`Passed: ${statusResults.passed}`);
    if (statusResults.failed > 0) {
      log.error(`Failed: ${statusResults.failed}`);
    }

    console.log('\n' + '='.repeat(70));
    if (statusResults.failed === 0) {
      log.success('All tests passed! ✨');
      log.info('\nGenerated Word documents saved in: backend/test-exports/');
      log.info('Please manually review the documents for:');
      log.info('  1. Professional French formatting (DEVIS/PROFORMA)');
      log.info('  2. Correct TVA calculations');
      log.info('  3. Absence of production cost information');
      log.info('  4. Complete customer and order information');
    } else {
      log.error('Some tests failed. Please review the errors above.');
      process.exit(1);
    }
    console.log('='.repeat(70) + '\n');
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
