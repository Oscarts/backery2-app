import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean up ALL test and existing data (for isolated tests)
 * Use with caution - this will delete all data in test database
 */
export async function cleanupTestData() {
  // Delete in correct order to respect foreign key constraints
  await prisma.orderItem.deleteMany({});
  await prisma.customerOrder.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.finishedProduct.deleteMany({
    where: {
      name: {
        contains: 'Test-',
      },
    },
  });
}

/**
 * Clean up only test-specific data (leaves seed data intact)
 */
export async function cleanupOnlyTestData() {
  // Delete only test customers and their orders
  const testCustomers = await prisma.customer.findMany({
    where: {
      email: {
        contains: 'test-',
      },
    },
  });
  
  const testCustomerIds = testCustomers.map(c => c.id);
  
  if (testCustomerIds.length > 0) {
    await prisma.orderItem.deleteMany({
      where: {
        order: {
          customerId: {
            in: testCustomerIds,
          },
        },
      },
    });
    
    await prisma.customerOrder.deleteMany({
      where: {
        customerId: {
          in: testCustomerIds,
        },
      },
    });
    
    await prisma.customer.deleteMany({
      where: {
        id: {
          in: testCustomerIds,
        },
      },
    });
  }
  
  await prisma.finishedProduct.deleteMany({
    where: {
      name: {
        contains: 'Test-',
      },
    },
  });
}

/**
 * Create a test customer
 */
export async function createTestCustomer(overrides = {}) {
  const timestamp = Date.now();
  return await prisma.customer.create({
    data: {
      name: `Test Customer ${timestamp}`,
      email: `test-customer-${timestamp}@example.com`,
      phone: '555-0100',
      address: '123 Test Street',
      isActive: true,
      ...overrides,
    },
  });
}

/**
 * Create a test finished product
 */
export async function createTestProduct(overrides = {}) {
  const timestamp = Date.now();
  return await prisma.finishedProduct.create({
    data: {
      name: `Test-Product-${timestamp}`,
      sku: `TEST-SKU-${timestamp}`,
      batchNumber: `BATCH-${timestamp}`,
      productionDate: new Date(),
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      shelfLife: 30,
      quantity: 100,
      reservedQuantity: 0,
      unit: 'pcs',
      salePrice: 10.0,
      status: 'COMPLETED',
      ...overrides,
    },
  });
}

/**
 * Create a test customer order
 */
export async function createTestOrder(customerId: string, items: any[] = [], overrides = {}) {
  const timestamp = Date.now();
  const orderNumber = `ORD-TEST-${timestamp}`;

  return await prisma.customerOrder.create({
    data: {
      orderNumber,
      customerId,
      status: 'DRAFT',
      totalProductionCost: 100.0,
      totalPrice: 130.0,
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      priceMarkupPercentage: 30,
      items: {
        create: items,
      },
      ...overrides,
    },
    include: {
      items: true,
      customer: true,
    },
  });
}

/**
 * Disconnect Prisma client
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

/**
 * Get Prisma client for tests
 */
export function getPrismaClient() {
  return prisma;
}
