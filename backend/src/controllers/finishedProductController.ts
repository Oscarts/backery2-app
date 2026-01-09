import { Request, Response, NextFunction } from 'express';
import { prisma } from '../app';
import Joi from 'joi';
import { getOrCreateSkuForName, resolveSkuOnRename, validateOrAssignSku, persistSkuMapping } from '../services/skuService';

// Helper function to get the default quality status (first item by sortOrder)
const getDefaultQualityStatus = async () => {
  const defaultStatus = await prisma.qualityStatus.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return defaultStatus?.id || null;
};

// Validation schemas
const createFinishedProductSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().optional().max(1000),
  sku: Joi.string().optional(), // Optional: system will derive based on name
  categoryId: Joi.string().optional().allow('').allow(null),
  batchNumber: Joi.string().required().min(1).max(100),
  productionDate: Joi.date().required(),
  expirationDate: Joi.date().required().greater(Joi.ref('productionDate')),
  shelfLife: Joi.number().required().positive(),
  quantity: Joi.number().required().positive(),
  unit: Joi.string().required().min(1).max(50),
  salePrice: Joi.number().required().positive(),
  costToProduce: Joi.number().optional().positive(),
  markupPercentage: Joi.number().optional().min(0).max(1000), // Profit margin percentage
  packagingInfo: Joi.string().optional().allow('').max(500),
  storageLocationId: Joi.string().optional(),
  qualityStatusId: Joi.string().optional().allow('').allow(null),
  isContaminated: Joi.boolean().optional().default(false),
  status: Joi.string().valid('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD').optional(),
});

const updateFinishedProductSchema = createFinishedProductSchema.fork([
  'name', 'description', 'sku', 'categoryId', 'batchNumber', 'productionDate',
  'expirationDate', 'shelfLife', 'quantity', 'unit', 'salePrice', 'costToProduce',
  'markupPercentage', 'packagingInfo', 'storageLocationId', 'qualityStatusId', 'isContaminated'
], (schema) => schema.optional()).keys({
  reservedQuantity: Joi.number().optional().min(0),
  status: Joi.string().valid('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD').optional(),
});

const reserveQuantitySchema = Joi.object({
  quantity: Joi.number().required().positive(),
  reason: Joi.string().optional().max(500),
});

export const finishedProductController = {
  // GET /api/finished-products
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const categoryId = req.query.categoryId as string;
      const expiringSoon = req.query.expiringSoon === 'true';
      const lowStock = req.query.lowStock === 'true';
      const minStock = parseInt(req.query.minStock as string) || 10;
      const status = req.query.status as string | undefined;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { batchNumber: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (categoryId) where.categoryId = categoryId;
      if (status) where.status = status;

      if (expiringSoon) {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        where.expirationDate = {
          lte: sevenDaysFromNow,
          gte: new Date(),
        };
      }

      if (lowStock) {
        where.quantity = {
          lte: minStock,
        };
      }

      const [finishedProducts, total] = await Promise.all([
        prisma.finishedProduct.findMany({
          where,
          include: {
            category: true,
            storageLocation: true,
            qualityStatus: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.finishedProduct.count({ where }),
      ]);

      res.json({
        success: true,
        data: finishedProducts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/finished-products/:id
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const finishedProduct = await prisma.finishedProduct.findFirst({
        where: {
          id,
          clientId: req.user!.clientId, // CRITICAL: Filter by tenant
        },
        include: {
          category: true,
          storageLocation: true,
          qualityStatus: true,
        },
      });

      if (!finishedProduct) {
        return res.status(404).json({
          success: false,
          error: 'Finished product not found',
        });
      }

      res.json({
        success: true,
        data: finishedProduct,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/finished-products
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = createFinishedProductSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      // Derive/reuse SKU based on name (ignore provided sku if any)
      const derivedSku = await validateOrAssignSku(value.name, req.user!.clientId, value.sku);

      // Verify related entities exist
      let category = null;
      if (value.categoryId) {
        category = await prisma.category.findUnique({
          where: { id: value.categoryId }
        });

        if (!category) {
          return res.status(400).json({
            success: false,
            error: 'Category not found',
          });
        }
      }

      let storageLocation = null;
      if (value.storageLocationId) {
        storageLocation = await prisma.storageLocation.findUnique({
          where: { id: value.storageLocationId }
        });

        if (!storageLocation) {
          return res.status(400).json({
            success: false,
            error: 'Storage location not found',
          });
        }
      }

      // Prepare create data
      const defaultQualityStatusId = value.qualityStatusId || await getDefaultQualityStatus();

      // Get clientId from authenticated user (required for multi-tenant isolation)
      const clientId = (req.user as any)?.clientId || (global as any).__currentClientId;

      if (!clientId) {
        console.error('POST /api/finished-products - No clientId available!');
        return res.status(500).json({
          success: false,
          error: 'Client ID not found in request'
        });
      }

      const createData = {
        ...value,
        sku: derivedSku,
        productionDate: new Date(value.productionDate),
        expirationDate: new Date(value.expirationDate),
        reservedQuantity: 0, // Default reserved quantity
        qualityStatusId: defaultQualityStatusId, // Use provided or default quality status
        clientId // Explicitly add clientId
      };

      const finishedProduct = await prisma.finishedProduct.create({
        data: createData,
        include: {
          category: true,
          storageLocation: true,
          qualityStatus: true,
        },
      });

      // Persist SKU mapping to ensure it remains even if this finished product is deleted
      await persistSkuMapping(finishedProduct.name, finishedProduct.sku, req.user!.clientId, finishedProduct.category?.name);

      res.status(201).json({
        success: true,
        data: finishedProduct,
        message: 'Finished product created successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/finished-products/:id
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { error, value } = updateFinishedProductSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      // Check if finished product exists
      const existingProduct = await prisma.finishedProduct.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: 'Finished product not found',
        });
      }

      // If name changed derive SKU accordingly; ignore manual sku changes
      if (value.name && value.name !== existingProduct.name) {
        (value as any).sku = await resolveSkuOnRename(value.name, req.user!.clientId);
      } else if (value.sku) {
        (value as any).sku = await validateOrAssignSku(value.name || existingProduct.name, req.user!.clientId, value.sku);
      }

      // Verify storage location exists if being updated
      if (value.storageLocationId) {
        const storageLocation = await prisma.storageLocation.findUnique({
          where: { id: value.storageLocationId },
        });

        if (!storageLocation) {
          return res.status(400).json({
            success: false,
            error: 'Storage location not found',
          });
        }
      }

      // Prepare update data
      const updateData: any = { ...value };

      // Handle categoryId properly
      if (value.categoryId === '' || value.categoryId === null) {
        updateData.categoryId = null;
      }
      // Make sure isContaminated is properly handled
      if (value.isContaminated !== undefined) {
        updateData.isContaminated = value.isContaminated === true || value.isContaminated === 'on';
      }
      // Handle empty qualityStatusId - convert empty string to null for the database
      if (updateData.qualityStatusId === '') {
        updateData.qualityStatusId = null;
      }
      // Handle empty packagingInfo - convert empty string to null for the database
      if (updateData.packagingInfo === '') {
        updateData.packagingInfo = null;
      }
      if (value.productionDate) updateData.productionDate = new Date(value.productionDate);
      if (value.expirationDate) updateData.expirationDate = new Date(value.expirationDate);

      const finishedProduct = await prisma.finishedProduct.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          storageLocation: true,
          qualityStatus: true,
        },
      });

      // Persist SKU mapping to ensure it remains even if this finished product is deleted
      if (finishedProduct.sku) {
        await persistSkuMapping(finishedProduct.name, finishedProduct.sku, req.user!.clientId, finishedProduct.category?.name);
      }

      res.json({
        success: true,
        data: finishedProduct,
        message: 'Finished product updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/finished-products/:id
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const existingProduct = await prisma.finishedProduct.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: 'Finished product not found',
        });
      }

      // Check if product has reserved quantity
      if (existingProduct.reservedQuantity > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete product with reserved quantity',
        });
      }

      await prisma.finishedProduct.delete({
        where: {
          id,
          clientId: req.user!.clientId, // CRITICAL: Filter by tenant
        },
      });

      res.json({
        success: true,
        message: 'Finished product deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/finished-products/expiring
  getExpiring: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);

      const finishedProducts = await prisma.finishedProduct.findMany({
        where: {
          clientId: req.user!.clientId, // CRITICAL: Filter by tenant
          expirationDate: {
            lte: targetDate,
            gte: new Date(),
          },
        },
        include: {
          category: true,
          storageLocation: true,
        },
        orderBy: { expirationDate: 'asc' },
      });

      res.json({
        success: true,
        data: finishedProducts,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/finished-products/low-stock
  getLowStock: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 10;

      const finishedProducts = await prisma.finishedProduct.findMany({
        where: {
          clientId: req.user!.clientId, // CRITICAL: Filter by tenant
          quantity: {
            lte: threshold,
          },
        },
        include: {
          category: true,
          storageLocation: true,
        },
        orderBy: { quantity: 'asc' },
      });

      res.json({
        success: true,
        data: finishedProducts,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/finished-products/:id/reserve
  reserveQuantity: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { error, value } = reserveQuantitySchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const existingProduct = await prisma.finishedProduct.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: 'Finished product not found',
        });
      }

      const availableQuantity = existingProduct.quantity - existingProduct.reservedQuantity;

      if (value.quantity > availableQuantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient available quantity. Available: ${availableQuantity}`,
        });
      }

      const finishedProduct = await prisma.finishedProduct.update({
        where: {
          id,
          clientId: req.user!.clientId, // CRITICAL: Filter by tenant
        },
        data: {
          reservedQuantity: existingProduct.reservedQuantity + value.quantity
        },
        include: {
          category: true,
          storageLocation: true,
        },
      });

      // TODO: Create reservation record for tracking
      // This will be implemented in the order management phase

      res.json({
        success: true,
        data: finishedProduct,
        message: `Reserved ${value.quantity} ${existingProduct.unit}`,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/finished-products/:id/release
  releaseReservation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { error, value } = reserveQuantitySchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const existingProduct = await prisma.finishedProduct.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          error: 'Finished product not found',
        });
      }

      if (value.quantity > existingProduct.reservedQuantity) {
        return res.status(400).json({
          success: false,
          error: `Cannot release more than reserved. Reserved: ${existingProduct.reservedQuantity}`,
        });
      }

      const finishedProduct = await prisma.finishedProduct.update({
        where: {
          id,
          clientId: req.user!.clientId, // CRITICAL: Filter by tenant
        },
        data: {
          reservedQuantity: existingProduct.reservedQuantity - value.quantity
        },
        include: {
          category: true,
          storageLocation: true,
        },
      });

      res.json({
        success: true,
        data: finishedProduct,
        message: `Released ${value.quantity} ${existingProduct.unit} from reservation`,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/finished-products/defaults
  getDefaults: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get first storage location (alphabetically)
      const firstStorageLocation = await prisma.storageLocation.findFirst({
        where: {
          clientId: req.user!.clientId, // CRITICAL: Filter by tenant
        },
        orderBy: { name: 'asc' },
      });

      // Get default quality status (first by sortOrder)
      const defaultQualityStatus = await getDefaultQualityStatus();

      // Get "Finished Products" or similar category as default
      const finishedCategory = await prisma.category.findFirst({
        where: {
          clientId: req.user!.clientId, // CRITICAL: Filter by tenant
          OR: [
            { name: { contains: 'Finished', mode: 'insensitive' } },
            { name: { contains: 'Product', mode: 'insensitive' } },
            { type: 'FINISHED_PRODUCT' }
          ],
        },
        orderBy: { name: 'asc' },
      });

      res.json({
        success: true,
        data: {
          storageLocationId: firstStorageLocation?.id || null,
          qualityStatusId: defaultQualityStatus,
          categoryId: finishedCategory?.id || null,
          batchNumber: null, // Will be generated in frontend based on production date
          shelfLife: 7, // Default 7 days shelf life
          markupPercentage: 50, // Default 50% markup
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
