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
