import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

// Validation schemas
const createSkuReferenceSchema = Joi.object({
  name: Joi.string().required().trim(),
  sku: Joi.string().optional().trim(),
  description: Joi.string().allow('', null).optional(),
  unitPrice: Joi.number().positive().allow(null).optional(),
  unit: Joi.string().allow('', null).optional(),
  reorderLevel: Joi.number().min(0).allow(null).optional(),
  storageLocationId: Joi.string().allow('', null).optional(),
  categoryId: Joi.string().allow('', null).optional(),
});

const updateSkuReferenceSchema = Joi.object({
  name: Joi.string().trim().optional(),
  sku: Joi.string().trim().optional(),
  description: Joi.string().allow('', null).optional(),
  unitPrice: Joi.number().positive().allow(null).optional(),
  unit: Joi.string().allow('', null).optional(),
  reorderLevel: Joi.number().min(0).allow(null).optional(),
  storageLocationId: Joi.string().allow('', null).optional(),
  categoryId: Joi.string().allow('', null).optional(),
});

/**
 * Generate SKU in industry-standard format: PREFIX-CATEGORY-PRODUCTCODE-SEQUENCE
 * Examples: SKU-DAIRY-MILK-001, SKU-BAKERY-BREAD-023, SKU-INGRED-CHOC-042
 * 
 * @param name - Product/material name
 * @param categoryName - Category name (optional)
 * @param clientId - Client ID for sequence generation
 * @param existingSkuCount - Number of existing SKUs for sequence
 * @returns Formatted SKU string
 */
async function generateSkuWithSequence(
  name: string,
  categoryName: string | null | undefined,
  clientId: string,
  existingSkuCount: number
): Promise<string> {
  const prefix = 'SKU'; // SKU Reference prefix

  // Generate category code (first 3-6 chars of category, or GENERAL if no category)
  let categoryCode = 'GENERAL';
  if (categoryName) {
    categoryCode = categoryName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6);
  }

  // Generate product code from name (first significant word, 3-5 chars)
  const productCode = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '') // Remove special chars
    .split(/\s+/) // Split into words
    .filter(word => word.length > 0) // Remove empty
    .slice(0, 2) // Take first 2 words max
    .join('') // Combine
    .substring(0, 5); // Limit to 5 chars

  // Generate sequence number (3 digits, zero-padded)
  const sequence = String(existingSkuCount + 1).padStart(3, '0');

  return `${prefix}-${categoryCode}-${productCode}-${sequence}`;
}

/**
 * Legacy simple SKU generation (fallback)
 * Used when category-based generation is not possible
 */
  function generateSimpleSku(name: string): string {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  }

export const skuReferenceController = {
  /**
   * Get all SKU references for a client
   */
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = req.user!.clientId;
      const { search, categoryId, storageLocationId } = req.query;

      const where: any = { clientId };

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { sku: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId as string;
      }

      if (storageLocationId) {
        where.storageLocationId = storageLocationId as string;
      }

      const skuReferences = await prisma.skuMapping.findMany({
        where,
        include: {
          category: true,
          storageLocation: true,
          _count: {
            select: {
              rawMaterials: true,
              finishedProducts: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });

      res.json({ success: true, data: skuReferences });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a single SKU reference by ID
   */
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = req.user!.clientId;
      const { id } = req.params;

      const skuReference = await prisma.skuMapping.findFirst({
        where: { id, clientId },
        include: {
          category: true,
          storageLocation: true,
          rawMaterials: {
            select: {
              id: true,
              name: true,
              batchNumber: true,
              quantity: true,
              unit: true,
            },
          },
          finishedProducts: {
            select: {
              id: true,
              name: true,
              batchNumber: true,
              quantity: true,
              unit: true,
            },
          },
        },
      });

      if (!skuReference) {
        return res.status(404).json({
          success: false,
          error: 'SKU reference not found',
        });
      }

      res.json({ success: true, data: skuReference });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new SKU reference
   */
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = req.user!.clientId;

      // Validate request body
      const { error, value } = createSkuReferenceSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      // Generate SKU if not provided
      let sku = value.sku;

      if (!sku) {
        // Get category name if categoryId is provided
        let categoryName: string | null = null;
        if (value.categoryId) {
          const category = await prisma.category.findUnique({
            where: { id: value.categoryId },
            select: { name: true },
          });
          categoryName = category?.name || null;
        }

        // Count existing SKU references for sequence generation
        const existingCount = await prisma.skuMapping.count({
          where: { clientId },
        });

        // Generate industry-standard SKU
        sku = await generateSkuWithSequence(value.name, categoryName, clientId, existingCount);
      }

      // Check for duplicate name
      const existingByName = await prisma.skuMapping.findFirst({
        where: { name: value.name, clientId },
      });
      if (existingByName) {
        return res.status(409).json({
          success: false,
          error: `SKU reference with name "${value.name}" already exists`,
        });
      }

      // Check for duplicate SKU
      const existingBySku = await prisma.skuMapping.findFirst({
        where: { sku, clientId },
      });
      if (existingBySku) {
        return res.status(409).json({
          success: false,
          error: `SKU "${sku}" is already in use`,
        });
      }

      // Create SKU reference
      const skuReference = await prisma.skuMapping.create({
        data: {
          ...value,
          sku,
          clientId,
          // Convert empty strings to null
          description: value.description || null,
          unit: value.unit || null,
          unitPrice: value.unitPrice || null,
          reorderLevel: value.reorderLevel || null,
          storageLocationId: value.storageLocationId || null,
          categoryId: value.categoryId || null,
        },
        include: {
          category: true,
          storageLocation: true,
        },
      });

      res.status(201).json({ success: true, data: skuReference });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update an existing SKU reference
   */
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = req.user!.clientId;
      const { id } = req.params;

      // Validate request body
      const { error, value } = updateSkuReferenceSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      // Verify SKU reference exists and belongs to client
      const existing = await prisma.skuMapping.findFirst({
        where: { id, clientId },
      });
      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'SKU reference not found',
        });
      }

      // Check for name conflict if name is being changed
      if (value.name && value.name !== existing.name) {
        const nameConflict = await prisma.skuMapping.findFirst({
          where: { name: value.name, clientId, id: { not: id } },
        });
        if (nameConflict) {
          return res.status(409).json({
            success: false,
            error: `SKU reference with name "${value.name}" already exists`,
          });
        }
      }

      // Check for SKU conflict if SKU is being changed
      if (value.sku && value.sku !== existing.sku) {
        const skuConflict = await prisma.skuMapping.findFirst({
          where: { sku: value.sku, clientId, id: { not: id } },
        });
        if (skuConflict) {
          return res.status(409).json({
            success: false,
            error: `SKU "${value.sku}" is already in use`,
          });
        }
      }

      // Update SKU reference
      const updated = await prisma.skuMapping.update({
        where: { id },
        data: {
          ...value,
          // Convert empty strings to null
          description: value.description === '' ? null : value.description,
          unit: value.unit === '' ? null : value.unit,
          unitPrice: value.unitPrice === null ? null : value.unitPrice,
          reorderLevel: value.reorderLevel === null ? null : value.reorderLevel,
          storageLocationId: value.storageLocationId === '' ? null : value.storageLocationId,
          categoryId: value.categoryId === '' ? null : value.categoryId,
        },
        include: {
          category: true,
          storageLocation: true,
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a SKU reference
   */
  deleteSkuReference: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = req.user!.clientId;
      const { id } = req.params;

      // Verify SKU reference exists and belongs to client
      const existing = await prisma.skuMapping.findFirst({
        where: { id, clientId },
        include: {
          _count: {
            select: {
              rawMaterials: true,
              finishedProducts: true,
            },
          },
        },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'SKU reference not found',
        });
      }

      // Check if SKU reference is in use
      const totalUsage = existing._count.rawMaterials + existing._count.finishedProducts;
      if (totalUsage > 0) {
        return res.status(409).json({
          success: false,
          error: `Cannot delete SKU reference "${existing.name}". It is currently used by ${existing._count.rawMaterials} raw material(s) and ${existing._count.finishedProducts} finished product(s).`,
          details: {
            rawMaterialCount: existing._count.rawMaterials,
            finishedProductCount: existing._count.finishedProducts,
          },
        });
      }

      // Delete SKU reference
      await prisma.skuMapping.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: `SKU reference "${existing.name}" deleted successfully`,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Check usage of a SKU reference
   */
  checkUsage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = req.user!.clientId;
      const { id } = req.params;

      const skuReference = await prisma.skuMapping.findFirst({
        where: { id, clientId },
        include: {
          rawMaterials: {
            select: {
              id: true,
              name: true,
              batchNumber: true,
              quantity: true,
              unit: true,
            },
          },
          finishedProducts: {
            select: {
              id: true,
              name: true,
              batchNumber: true,
              quantity: true,
              unit: true,
            },
          },
        },
      });

      if (!skuReference) {
        return res.status(404).json({
          success: false,
          error: 'SKU reference not found',
        });
      }

      res.json({
        success: true,
        data: {
          skuReference: {
            id: skuReference.id,
            name: skuReference.name,
            sku: skuReference.sku,
          },
          usage: {
            rawMaterials: skuReference.rawMaterials,
            finishedProducts: skuReference.finishedProducts,
            totalCount:
              skuReference.rawMaterials.length + skuReference.finishedProducts.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
