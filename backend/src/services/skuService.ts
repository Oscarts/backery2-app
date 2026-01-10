// Use a direct PrismaClient instance to avoid circular dependency with app.ts during early imports
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Generate a canonical SKU slug from a product/material name.
 * Non-alphanumeric characters become '-', collapsed, uppercased.
 */
export function generateSkuFromName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Retrieve existing SKU for a name across raw materials and finished products, or generate a new one.
 * Priority: finished products (stable) then raw materials.
 */
export async function getOrCreateSkuForName(name: string, clientId: string): Promise<string> {
  const existingFinished = await prisma.finishedProduct.findFirst({ where: { name, clientId }, select: { sku: true } });
  if (existingFinished?.sku) return existingFinished.sku;
  const existingRaw: any = await prisma.rawMaterial.findFirst({ where: { name, clientId } });
  if (existingRaw?.sku) return existingRaw.sku as string;
  return generateSkuFromName(name);
}

/**
 * Ensure SKU consistency when name changes: if another entity with new name has a SKU use that; else generate.
 */
export async function resolveSkuOnRename(newName: string, clientId: string): Promise<string> {
  return getOrCreateSkuForName(newName, clientId);
}

/**
 * If an incoming SKU is supplied, ensure it is consistent with existing mapping for the name.
 * Rules:
 *  - Same name = same SKU (reusable across multiple items/batches)
 *  - If name already has a SKU, reuse it (allow multiple items with same name/SKU)
 *  - If no mapping yet and incoming sku provided, normalize and use it.
 *  - If no mapping and no incoming sku, generate one.
 *  - Only throw conflict if user tries to assign DIFFERENT SKU to existing name.
 */
export async function validateOrAssignSku(name: string, clientId: string, incomingSku?: string): Promise<string> {
  const existingSku = await getOrCreateSkuForName(name, clientId);
  // Check if this name already has a SKU assigned
  const raw: any = await prisma.rawMaterial.findFirst({ where: { name, clientId } });
  const finished: any = await prisma.finishedProduct.findFirst({ where: { name, clientId } });
  const mappingAlreadyExisted = !!(raw?.sku || finished?.sku);

  if (mappingAlreadyExisted) {
    // Name already has a SKU - ensure incoming SKU matches (if provided)
    if (incomingSku && incomingSku.toUpperCase() !== existingSku) {
      throw Object.assign(new Error('SKU conflict: name already mapped to different SKU'), { status: 409 });
    }
    // Return existing SKU - this allows multiple items with same name/SKU
    return existingSku;
  }

  // No existing mapping yet - create new one
  if (incomingSku) {
    return generateSkuFromName(incomingSku); // Normalize user-provided value
  }
  return generateSkuFromName(name);
}

/**
 * Persist a SKU mapping to the SkuMapping table with complete information.
 * This ensures the SKU reference remains even if all items with this name are deleted.
 * Uses upsert to avoid duplicates.
 */
export async function persistSkuMapping(
  name: string,
  sku: string,
  clientId: string,
  options: {
    unitPrice?: number;
    unit?: string;
    reorderLevel?: number;
    categoryId?: string;
    storageLocationId?: string;
    description?: string;
  } = {}
): Promise<void> {
  try {
    const updateData = {
      sku,
      updatedAt: new Date(),
      ...(options.unitPrice !== undefined && { unitPrice: options.unitPrice }),
      ...(options.unit && { unit: options.unit }),
      ...(options.reorderLevel !== undefined && { reorderLevel: options.reorderLevel }),
      ...(options.categoryId && { categoryId: options.categoryId }),
      ...(options.storageLocationId && { storageLocationId: options.storageLocationId }),
      ...(options.description && { description: options.description }),
    };

    const createData = {
      name,
      clientId,
      ...updateData,
    };

    await prisma.skuMapping.upsert({
      where: {
        name_clientId: { name, clientId }
      },
      update: updateData,
      create: createData,
    });
  } catch (error: any) {
    // If there's a unique constraint error on SKU, try with just the name
    if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
      // SKU already exists for different name, skip persistence
      console.warn(`SKU ${sku} already mapped to different name, skipping persistence for ${name}`);
    } else {
      throw error;
    }
  }
}

/**
 * Get suggested SKU for autocomplete based on partial name.
 * Returns matching name/SKU pairs from existing raw materials, finished products, and SkuMappings.
 */
export async function getSuggestedSku(partialName: string, clientId: string): Promise<Array<{ name: string; sku: string }>> {
  const searchTerm = partialName.toLowerCase();

  // Search raw materials (tenant-filtered)
  const rawMaterials = await prisma.rawMaterial.findMany({
    where: {
      name: { contains: searchTerm, mode: 'insensitive' },
      sku: { not: null },
      clientId
    },
    select: { name: true, sku: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
    take: 10,
  });

  // Search finished products (tenant-filtered)
  const finishedProducts = await prisma.finishedProduct.findMany({
    where: {
      name: { contains: searchTerm, mode: 'insensitive' },
      sku: { not: '' },
      clientId
    },
    select: { name: true, sku: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
    take: 10,
  });

  // Combine and deduplicate by name
  const combined = [...rawMaterials, ...finishedProducts];
  const uniqueMap = new Map<string, string>();

  combined.forEach((item) => {
    if (item.sku && !uniqueMap.has(item.name)) {
      uniqueMap.set(item.name, item.sku);
    }
  });

  return Array.from(uniqueMap.entries())
    .map(([name, sku]) => ({ name, sku }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 10);
}

/**
 * Get all SKU mappings for the reference page.
 * Returns comprehensive list from existing products within the client,
 * plus persisted SKU mappings from the SkuMapping table.
 */
export async function getAllSkuMappings(clientId: string): Promise<Array<{ name: string; sku: string; source: string }>> {
  // Get from raw materials (tenant-filtered)
  const rawMaterials = await prisma.rawMaterial.findMany({
    where: { sku: { not: null }, clientId },
    select: { name: true, sku: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
  });

  // Get from finished products (tenant-filtered)
  const finishedProducts = await prisma.finishedProduct.findMany({
    where: { sku: { not: '' }, clientId },
    select: { name: true, sku: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
  });

  // Get from persisted SkuMapping table (tenant-filtered)
  const persistedMappings = await prisma.skuMapping.findMany({
    where: { clientId },
    select: { name: true, sku: true },
    orderBy: { name: 'asc' },
  });

  // Combine with source tracking
  const combined: Array<{ name: string; sku: string; source: string }> = [];
  const seenNames = new Set<string>();

  // Priority: Finished products first (more stable SKUs)
  finishedProducts.forEach((item) => {
    if (item.sku && !seenNames.has(item.name)) {
      combined.push({ name: item.name, sku: item.sku, source: 'finished_product' });
      seenNames.add(item.name);
    }
  });

  // Then raw materials
  rawMaterials.forEach((item) => {
    if (item.sku && !seenNames.has(item.name)) {
      combined.push({ name: item.name, sku: item.sku, source: 'raw_material' });
      seenNames.add(item.name);
    }
  });

  // Finally, add persisted mappings that aren't already in the list
  persistedMappings.forEach((item) => {
    if (item.sku && !seenNames.has(item.name)) {
      combined.push({ name: item.name, sku: item.sku, source: 'sku_mapping' });
      seenNames.add(item.name);
    }
  });

  return combined.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Generate batch number in format: SUPPLIER_CODE-YYYYMMDD-SEQ
 * Example: SUP1-20251101-001
 */
export async function generateBatchNumber(supplierId: string, clientId: string, date: Date = new Date()): Promise<string> {
  // Get supplier code
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId, clientId },
    select: { name: true },
  });

  if (!supplier) {
    throw new Error('Supplier not found');
  }

  // Generate supplier code (first 3-4 chars, uppercase)
  const supplierCode = supplier.name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 4) || 'SUPP';

  // Format date as YYYYMMDD
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

  // Find existing batches for this supplier and date
  const datePrefix = `${supplierCode}-${dateStr}-`;
  const existingBatches = await prisma.rawMaterial.findMany({
    where: {
      supplierId,
      clientId,
      batchNumber: { startsWith: datePrefix },
    },
    select: { batchNumber: true },
    orderBy: { batchNumber: 'desc' },
    take: 1,
  });

  // Extract sequence number and increment
  let sequence = 1;
  if (existingBatches.length > 0) {
    const lastBatch = existingBatches[0].batchNumber;
    const parts = lastBatch.split('-');
    if (parts.length === 3) {
      sequence = parseInt(parts[2], 10) + 1;
    }
  }

  // Format sequence with leading zeros (001, 002, etc.)
  const sequenceStr = sequence.toString().padStart(3, '0');

  return `${supplierCode}-${dateStr}-${sequenceStr}`;
}

/**
 * Check if a SKU/name is in use by any raw materials or finished products.
 * Returns usage information for validation before deletion.
 */
export async function isSkuInUse(name: string, clientId: string): Promise<{
  inUse: boolean;
  rawMaterialCount: number;
  finishedProductCount: number;
}> {
  const rawMaterialCount = await prisma.rawMaterial.count({
    where: { name, clientId },
  });

  const finishedProductCount = await prisma.finishedProduct.count({
    where: { name, clientId },
  });

  return {
    inUse: rawMaterialCount > 0 || finishedProductCount > 0,
    rawMaterialCount,
    finishedProductCount,
  };
}

/**
 * Safely delete a SKU mapping only if it's not in use by any products.
 * Throws an error if the SKU is still in use.
 */
export async function deleteSkuMapping(name: string, clientId: string): Promise<void> {
  const usage = await isSkuInUse(name, clientId);

  if (usage.inUse) {
    throw Object.assign(
      new Error(`Cannot delete SKU mapping: ${usage.rawMaterialCount} raw material(s) and ${usage.finishedProductCount} finished product(s) still use this name`),
      { status: 400, usage }
    );
  }

  // Delete from SkuMapping table (tenant-filtered)
  await prisma.skuMapping.deleteMany({
    where: { name, clientId }
  });
}
