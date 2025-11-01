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
export async function getOrCreateSkuForName(name: string): Promise<string> {
  const existingFinished = await prisma.finishedProduct.findFirst({ where: { name }, select: { sku: true } });
  if (existingFinished?.sku) return existingFinished.sku;
  const existingRaw: any = await prisma.rawMaterial.findFirst({ where: { name } });
  if (existingRaw?.sku) return existingRaw.sku as string;
  return generateSkuFromName(name);
}

/**
 * Ensure SKU consistency when name changes: if another entity with new name has a SKU use that; else generate.
 */
export async function resolveSkuOnRename(newName: string): Promise<string> {
  return getOrCreateSkuForName(newName);
}

/**
 * If an incoming SKU is supplied, ensure it is consistent with existing mapping for the name.
 * Rules:
 *  - If name already mapped (via any raw material or finished product) enforce existing SKU.
 *  - If no mapping yet and incoming sku provided, normalize and use it.
 *  - If no mapping and no incoming sku, generate one.
 *  - If mapping exists but incoming differs, throw conflict error.
 */
export async function validateOrAssignSku(name: string, incomingSku?: string): Promise<string> {
  const existingSku = await getOrCreateSkuForName(name);
  // If there was already a mapping (found among finished or raw materials)
  const raw: any = await prisma.rawMaterial.findFirst({ where: { name } });
  const finished: any = await prisma.finishedProduct.findFirst({ where: { name } });
  const mappingAlreadyExisted = !!(raw?.sku || finished?.sku);

  if (mappingAlreadyExisted) {
    if (incomingSku && incomingSku.toUpperCase() !== existingSku) {
      throw Object.assign(new Error('SKU conflict: name already mapped to different SKU'), { status: 409 });
    }
    return existingSku;
  }

  // No existing mapping yet
  if (incomingSku) {
    return generateSkuFromName(incomingSku); // Normalize user-provided value
  }
  return generateSkuFromName(name);
}

/**
 * Get suggested SKU for autocomplete based on partial name.
 * Returns matching name/SKU pairs from existing raw materials, finished products, and SkuMappings.
 */
export async function getSuggestedSku(partialName: string): Promise<Array<{ name: string; sku: string }>> {
  const searchTerm = partialName.toLowerCase();
  
  // Search in SkuMapping table first
  const skuMappings = await prisma.skuMapping.findMany({
    where: { name: { contains: searchTerm, mode: 'insensitive' } },
    select: { name: true, sku: true },
    orderBy: { name: 'asc' },
    take: 10,
  });

  // Search raw materials
  const rawMaterials = await prisma.rawMaterial.findMany({
    where: {
      name: { contains: searchTerm, mode: 'insensitive' },
      sku: { not: null },
    },
    select: { name: true, sku: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
    take: 10,
  });

  // Search finished products
  const finishedProducts = await prisma.finishedProduct.findMany({
    where: {
      name: { contains: searchTerm, mode: 'insensitive' },
      sku: { not: '' },
    },
    select: { name: true, sku: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
    take: 10,
  });

  // Combine and deduplicate by name
  const combined = [...skuMappings, ...rawMaterials, ...finishedProducts];
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
 * Returns comprehensive list from SkuMapping table and existing products.
 */
export async function getAllSkuMappings(): Promise<Array<{ name: string; sku: string; source: string }>> {
  // Get from SkuMapping table
  const skuMappings = await prisma.skuMapping.findMany({
    select: { name: true, sku: true, category: true },
    orderBy: { name: 'asc' },
  });

  // Get from raw materials
  const rawMaterials = await prisma.rawMaterial.findMany({
    where: { sku: { not: null } },
    select: { name: true, sku: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
  });

  // Get from finished products
  const finishedProducts = await prisma.finishedProduct.findMany({
    where: { sku: { not: '' } },
    select: { name: true, sku: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
  });

  // Combine with source tracking
  const combined: Array<{ name: string; sku: string; source: string }> = [];
  const seenNames = new Set<string>();

  // Priority: SkuMapping table first
  skuMappings.forEach((item: { name: string; sku: string; category: string | null }) => {
    if (!seenNames.has(item.name)) {
      combined.push({ name: item.name, sku: item.sku, source: 'mapping' });
      seenNames.add(item.name);
    }
  });

  // Then finished products
  finishedProducts.forEach((item) => {
    if (item.sku && !seenNames.has(item.name)) {
      combined.push({ name: item.name, sku: item.sku, source: 'finished_product' });
      seenNames.add(item.name);
    }
  });

  // Finally raw materials
  rawMaterials.forEach((item) => {
    if (item.sku && !seenNames.has(item.name)) {
      combined.push({ name: item.name, sku: item.sku, source: 'raw_material' });
      seenNames.add(item.name);
    }
  });

  return combined;
}

/**
 * Generate batch number in format: SUPPLIER_CODE-YYYYMMDD-SEQ
 * Example: SUP1-20251101-001
 */
export async function generateBatchNumber(supplierId: string, date: Date = new Date()): Promise<string> {
  // Get supplier code
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId },
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
