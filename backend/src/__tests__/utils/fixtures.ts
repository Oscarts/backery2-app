/**
 * Test fixtures for multi-tenant database testing
 * 
 * These utilities help create properly isolated test data
 * that respects the multi-tenant architecture of the application.
 */

import { PrismaClient } from '@prisma/client';

// Create a dedicated test Prisma client
const prisma = new PrismaClient();

/**
 * Generate a unique identifier for test isolation
 */
export function generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Create a test client (tenant) with all required fields
 */
export async function createTestClient(overrides: Partial<{
    name: string;
    slug: string;
    email: string;
}> = {}) {
    const testId = generateTestId();
    return prisma.client.create({
        data: {
            name: overrides.name || `Test Bakery ${testId}`,
            slug: overrides.slug || `test-bakery-${testId}`,
            email: overrides.email || `test-${testId}@example.com`,
        },
    });
}

/**
 * Create a test supplier within a client
 */
export async function createTestSupplier(clientId: string, overrides: Partial<{
    name: string;
    contactInfo: { name?: string; email?: string; phone?: string };
    address: string;
}> = {}) {
    const testId = generateTestId();
    return prisma.supplier.create({
        data: {
            name: overrides.name || `Test Supplier ${testId}`,
            contactInfo: overrides.contactInfo || {
                name: 'Test Contact',
                email: `supplier-${testId}@example.com`,
                phone: '555-0100',
            },
            address: overrides.address || '123 Test Street',
            clientId,
        },
    });
}

/**
 * Create a test storage location within a client
 */
export async function createTestStorageLocation(clientId: string, overrides: Partial<{
    name: string;
    type: string;
    description: string;
}> = {}) {
    const testId = generateTestId();
    return prisma.storageLocation.create({
        data: {
            name: overrides.name || `Test Storage ${testId}`,
            type: overrides.type || 'dry',
            description: overrides.description || 'Test storage location',
            clientId,
        },
    });
}

/**
 * Create a test raw material with all required relationships
 */
export async function createTestRawMaterial(
    clientId: string,
    supplierId: string,
    storageLocationId: string,
    overrides: Partial<{
        name: string;
        sku: string;
        quantity: number;
        unit: string;
        unitPrice: number;
        reorderLevel: number;
        batchNumber: string;
        expirationDate: Date;
    }> = {}
) {
    const testId = generateTestId();
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setMonth(futureDate.getMonth() + 6); // 6 months expiration

    return prisma.rawMaterial.create({
        data: {
            name: overrides.name || `Test Flour ${testId}`,
            sku: overrides.sku || `SKU-${testId.toUpperCase()}`,
            quantity: overrides.quantity ?? 100,
            unit: overrides.unit || 'kg',
            unitPrice: overrides.unitPrice ?? 2.50,
            reorderLevel: overrides.reorderLevel ?? 10,
            batchNumber: overrides.batchNumber || `BATCH-${testId}`,
            expirationDate: overrides.expirationDate || futureDate,
            clientId,
            supplierId,
            storageLocationId,
        },
    });
}

/**
 * Create a test recipe within a client
 */
export async function createTestRecipe(
    clientId: string,
    overrides: Partial<{
        name: string;
        description: string;
        estimatedCost: number;
        overheadPercentage: number;
        yieldQuantity: number;
        yieldUnit: string;
        instructions: string;
    }> = {}
) {
    const testId = generateTestId();
    return prisma.recipe.create({
        data: {
            name: overrides.name || `Test Bread ${testId}`,
            description: overrides.description || 'Test recipe for cost calculation',
            estimatedCost: overrides.estimatedCost ?? 10.00,
            overheadPercentage: overrides.overheadPercentage ?? 50,
            yieldQuantity: overrides.yieldQuantity ?? 5,
            yieldUnit: overrides.yieldUnit || 'loaves',
            instructions: overrides.instructions || 'Test instructions',
            clientId,
        },
    });
}

/**
 * Create a recipe ingredient linking a recipe to a raw material
 */
export async function createTestRecipeIngredient(
    recipeId: string,
    rawMaterialId: string,
    overrides: Partial<{
        quantity: number;
        unit: string;
    }> = {}
) {
    return prisma.recipeIngredient.create({
        data: {
            recipeId,
            rawMaterialId,
            quantity: overrides.quantity ?? 2,
            unit: overrides.unit || 'kg',
        },
    });
}

/**
 * Create a complete test environment with all necessary entities
 * Returns all created entities for use in tests
 */
export async function createCompleteTestEnvironment() {
    const client = await createTestClient();
    const supplier = await createTestSupplier(client.id);
    const storageLocation = await createTestStorageLocation(client.id);
    const rawMaterial = await createTestRawMaterial(
        client.id,
        supplier.id,
        storageLocation.id,
        { name: 'Test Flour', unitPrice: 2.50 }
    );
    const recipe = await createTestRecipe(client.id, {
        name: 'Test Bread',
        overheadPercentage: 50,
        yieldQuantity: 5,
        yieldUnit: 'loaves',
    });
    const recipeIngredient = await createTestRecipeIngredient(
        recipe.id,
        rawMaterial.id,
        { quantity: 2, unit: 'kg' }
    );

    return {
        client,
        supplier,
        storageLocation,
        rawMaterial,
        recipe,
        recipeIngredient,
    };
}

/**
 * Clean up all test data for a specific client
 * Deletes in correct order to respect foreign key constraints
 */
export async function cleanupTestClient(clientId: string) {
    // Delete in reverse order of dependencies
    await prisma.recipeIngredient.deleteMany({ where: { recipe: { clientId } } });
    await prisma.recipe.deleteMany({ where: { clientId } });
    await prisma.rawMaterial.deleteMany({ where: { clientId } });
    await prisma.storageLocation.deleteMany({ where: { clientId } });
    await prisma.supplier.deleteMany({ where: { clientId } });
    await prisma.client.delete({ where: { id: clientId } });
}

/**
 * Clean up a complete test environment
 */
export async function cleanupTestEnvironment(env: Awaited<ReturnType<typeof createCompleteTestEnvironment>>) {
    await cleanupTestClient(env.client.id);
}

/**
 * Get the Prisma client instance for direct queries in tests
 */
export function getTestPrisma() {
    return prisma;
}

/**
 * Disconnect the test Prisma client
 * Should be called in afterAll hooks
 */
export async function disconnectTestPrisma() {
    await prisma.$disconnect();
}
