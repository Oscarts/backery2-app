import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default test client ID - auto-initialized from database
let defaultClientId: string | null = null;
let clientIdInitialized = false;

/**
 * Set the default client ID for test helpers
 */
export function setTestClientId(clientId: string) {
  defaultClientId = clientId;
  clientIdInitialized = true;
}

/**
 * Get a default client ID from the database
 */
async function ensureClientId(): Promise<string> {
  if (defaultClientId) return defaultClientId;
  
  // Auto-initialize from first client in database
  if (!clientIdInitialized) {
    const client = await prisma.client.findFirst({
      where: { isActive: true },
    });
    if (client) {
      defaultClientId = client.id;
      clientIdInitialized = true;
    }
  }
  
  if (!defaultClientId) {
    throw new Error('No client found in database. Ensure database is seeded.');
  }
  
  return defaultClientId;
}

/**
 * Get the default client ID, auto-fetching if needed
 */
async function getClientId(overrideClientId?: string): Promise<string> {
  return overrideClientId || (await ensureClientId());
}

/**
 * Clean up ALL test and existing data (for isolated tests)
 */
export async function cleanupTestData() {
  await prisma.orderItem.deleteMany({});
  await prisma.customerOrder.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.finishedProduct.deleteMany({
    where: { name: { contains: 'Test-' } },
  });
}

/**
 * Clean up only test-specific data (leaves seed data intact)
 */
export async function cleanupOnlyTestData() {
  const testCustomers = await prisma.customer.findMany({
    where: { email: { contains: 'test-' } },
  });

  const testCustomerIds = testCustomers.map(c => c.id);

  if (testCustomerIds.length > 0) {
    await prisma.orderItem.deleteMany({
      where: { order: { customerId: { in: testCustomerIds } } },
    });
    await prisma.customerOrder.deleteMany({
      where: { customerId: { in: testCustomerIds } },
    });
    await prisma.customer.deleteMany({
      where: { id: { in: testCustomerIds } },
    });
  }

  await prisma.finishedProduct.deleteMany({
    where: { name: { contains: 'Test-' } },
  });
}

interface TestOverrides {
  clientId?: string;
  [key: string]: any;
}

/**
 * Create a test customer
 */
export async function createTestCustomer(overrides: TestOverrides = {}) {
  const timestamp = Date.now();
  const { clientId: overrideClientId, ...rest } = overrides;
  const clientId = await getClientId(overrideClientId);

  return await prisma.customer.create({
    data: {
      name: `Test Customer ${timestamp}`,
      email: `test-customer-${timestamp}@example.com`,
      phone: '555-0100',
      address: '123 Test Street',
      isActive: true,
      clientId,
      ...rest,
    },
  });
}

/**
 * Create a test finished product
 */
export async function createTestProduct(overrides: TestOverrides = {}) {
  const timestamp = Date.now();
  const { clientId: overrideClientId, ...rest } = overrides;
  const clientId = await getClientId(overrideClientId);

  return await prisma.finishedProduct.create({
    data: {
      name: `Test-Product-${timestamp}`,
      sku: `TEST-SKU-${timestamp}`,
      batchNumber: `BATCH-${timestamp}`,
      productionDate: new Date(),
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      shelfLife: 30,
      quantity: 100,
      reservedQuantity: 0,
      unit: 'pcs',
      salePrice: 10.0,
      status: 'COMPLETED',
      clientId,
      ...rest,
    },
  });
}

/**
 * Create a test customer order
 */
export async function createTestOrder(customerId: string, items: any[] = [], overrides: TestOverrides = {}) {
  const timestamp = Date.now();
  const { clientId: overrideClientId, ...rest } = overrides;
  const clientId = await getClientId(overrideClientId);

  return await prisma.customerOrder.create({
    data: {
      orderNumber: `ORD-TEST-${timestamp}`,
      status: 'DRAFT',
      totalProductionCost: 100.0,
      totalPrice: 130.0,
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priceMarkupPercentage: 30,
      customer: { connect: { id: customerId } },
      client: { connect: { id: clientId } },
      items: { create: items },
      ...rest,
    },
    include: { items: true, customer: true },
  });
}

/**
 * Disconnect Prisma client
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

/**
 * Get the prisma client instance
 */
export function getPrismaClient() {
  return prisma;
}
