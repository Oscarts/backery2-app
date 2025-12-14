import { Request, Response, NextFunction } from 'express';
import { prisma } from '../app';
import Joi from 'joi';
import { getOrCreateSkuForName, resolveSkuOnRename, validateOrAssignSku, getSuggestedSku, getAllSkuMappings, generateBatchNumber, deleteSkuMapping, isSkuInUse, persistSkuMapping } from '../services/skuService';

// Helper function to get the default quality status (first item by sortOrder)
const getDefaultQualityStatus = async () => {
  const defaultStatus = await prisma.qualityStatus.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return defaultStatus?.id || null;
};

// Validation schemas
const createRawMaterialSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  sku: Joi.string().optional(), // Ignored if provided; system derives from name or reuses existing
  categoryId: Joi.string().optional().allow('').allow(null),
  supplierId: Joi.string().required(),
  batchNumber: Joi.string().required().min(1).max(100),
  purchaseDate: Joi.date().required(),
  expirationDate: Joi.date().required().greater(Joi.ref('purchaseDate')),
  quantity: Joi.number().required().positive(),
  unit: Joi.string().required().min(1).max(50),
  costPerUnit: Joi.number().required().positive(),
  reorderLevel: Joi.number().required().min(0),
  storageLocationId: Joi.string().required(),
  qualityStatusId: Joi.string().optional().allow('').allow(null),
});

const updateRawMaterialSchema = createRawMaterialSchema.fork([
  'name', 'categoryId', 'supplierId', 'batchNumber', 'purchaseDate',
  'expirationDate', 'quantity', 'unit', 'costPerUnit', 'reorderLevel', 'storageLocationId',
  'qualityStatusId'
], (schema) => schema.optional()).keys({
  contaminated: Joi.boolean().optional(),
});

export const rawMaterialController = {
  // GET /api/raw-materials
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const categoryId = req.query.categoryId as string;
      const supplierId = req.query.supplierId as string;
      const expiringSoon = req.query.expiringSoon === 'true';
      const contaminated = req.query.contaminated === 'true' ? true :
        req.query.contaminated === 'false' ? false : undefined;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { batchNumber: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (categoryId) where.categoryId = categoryId;
      if (supplierId) where.supplierId = supplierId;
      if (contaminated !== undefined) where.isContaminated = contaminated;

      if (expiringSoon) {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        where.expirationDate = {
          lte: sevenDaysFromNow,
          gte: new Date(),
        };
      }

      // Find unit data for all raw materials
      const unitSymbols = new Set<string>();

      // First get all raw materials
      const rawMaterialsData = await prisma.rawMaterial.findMany({
        where,
        include: {
          category: true,
          supplier: true,
          storageLocation: true,
          qualityStatus: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      // Collect all unique unit symbols
      rawMaterialsData.forEach(material => {
        if (material.unit) unitSymbols.add(material.unit);
      });

      // Get unit details for all used unit symbols
      // NOTE: Units are global (not tenant-specific) as they're standard measurement units
      const unitDetails = await prisma.unit.findMany({
        where: {
          symbol: {
            in: Array.from(unitSymbols)
          }
        }
      });

      // Create a map of unit symbols to unit objects
      const unitMap = new Map();
      unitDetails.forEach(unit => {
        unitMap.set(unit.symbol, unit);
      });

      // Add unit details to each raw material
      const rawMaterials = rawMaterialsData.map(material => {
        return {
          ...material,
          unitDetails: unitMap.get(material.unit) || null
        };
      });

      const total = await prisma.rawMaterial.count({ where });

      res.json({
        success: true,
        data: rawMaterials,
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

  // GET /api/raw-materials/:id
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const rawMaterial = await prisma.rawMaterial.findFirst({
        where: {
          id,
          clientId: req.user!.clientId, // CRITICAL: Filter by tenant
        },
        include: {
          category: true,
          supplier: true,
          storageLocation: true,
          qualityStatus: true,
        },
      });

      // Get unit details if the raw material exists
      let unitDetails = null;
      if (rawMaterial && rawMaterial.unit) {
        unitDetails = await prisma.unit.findFirst({
          where: { symbol: rawMaterial.unit }
        });
      }

      if (!rawMaterial) {
        return res.status(404).json({
          success: false,
          error: 'Raw material not found',
        });
      }

      res.json({
        success: true,
        data: {
          ...rawMaterial,
          unitDetails
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/raw-materials
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = createRawMaterialSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      // Check if this exact combination already exists within this client
      // Allow same name with different batches, but prevent duplicate name+batch
      const existingBatch = await prisma.rawMaterial.findFirst({
        where: {
          clientId: req.user!.clientId, // CRITICAL: Multi-tenant isolation
          name: value.name,
          batchNumber: value.batchNumber,
        },
      });

      if (existingBatch) {
        return res.status(400).json({
          success: false,
          error: `Raw material "${value.name}" with batch number "${value.batchNumber}" already exists`,
        });
      }

      // Verify related entities exist
      const supplier = await prisma.supplier.findUnique({ where: { id: value.supplierId } });
      const storageLocation = await prisma.storageLocation.findUnique({ where: { id: value.storageLocationId } });

      // Only check for category if a categoryId is provided
      let category = null;
      if (value.categoryId) {
        category = await prisma.category.findUnique({ where: { id: value.categoryId } });
      }

      // Only validate category if categoryId was provided
      if (value.categoryId && !category) {
        return res.status(400).json({
          success: false,
          error: 'Category not found',
        });
      }

      if (!supplier) {
        return res.status(400).json({
          success: false,
          error: 'Supplier not found',
        });
      }

      if (!storageLocation) {
        return res.status(400).json({
          success: false,
          error: 'Storage location not found',
        });
      }

      // Prepare create data with field mapping
      const defaultQualityStatusId = value.qualityStatusId || await getDefaultQualityStatus();

      const derivedSku = await validateOrAssignSku(value.name, req.user!.clientId, value.sku);
      // Get clientId from authenticated user (required for multi-tenant isolation)
      const clientId = (req.user as any)?.clientId || (global as any).__currentClientId;

      if (!clientId) {
        console.error('POST /api/raw-materials - No clientId available!');
        return res.status(500).json({
          success: false,
          error: 'Client ID not found in request'
        });
      }

      const createData = {
        ...value,
        sku: derivedSku,
        purchaseDate: new Date(value.purchaseDate),
        expirationDate: new Date(value.expirationDate),
        unitPrice: value.costPerUnit, // Map costPerUnit to unitPrice
        qualityStatusId: defaultQualityStatusId, // Use provided or default quality status
        clientId // Explicitly add clientId
      };
      delete createData.costPerUnit; // Remove the frontend field

      const rawMaterial = await prisma.rawMaterial.create({
        data: createData,
        include: {
          category: true,
          supplier: true,
          storageLocation: true,
          qualityStatus: true,
        },
      });

      // Persist SKU mapping to ensure it remains even if this raw material is deleted
      await persistSkuMapping(rawMaterial.name, rawMaterial.sku || derivedSku, rawMaterial.category?.name);

      // Get unit details
      let unitDetails = null;
      if (rawMaterial.unit) {
        unitDetails = await prisma.unit.findFirst({
          where: { symbol: rawMaterial.unit }
        });
      }

      res.status(201).json({
        success: true,
        data: {
          ...rawMaterial,
          unitDetails
        },
        message: 'Raw material created successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/raw-materials/:id
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { error, value } = updateRawMaterialSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      // Check if raw material exists
      const existingRawMaterial = await prisma.rawMaterial.findUnique({
        where: { id },
      });

      if (!existingRawMaterial) {
        return res.status(404).json({
          success: false,
          error: 'Raw material not found',
        });
      }

      // Check batch number uniqueness if being updated
      if (value.batchNumber && value.supplierId) {
        const existingBatch = await prisma.rawMaterial.findFirst({
          where: {
            batchNumber: value.batchNumber,
            supplierId: value.supplierId,
            id: { not: id },
          },
        });

        if (existingBatch) {
          return res.status(400).json({
            success: false,
            error: 'Batch number already exists for this supplier',
          });
        }
      }

      // Prepare update data
      const updateData: any = { ...value };
      if (value.name && value.name !== existingRawMaterial.name) {
        updateData.sku = await resolveSkuOnRename(value.name, req.user!.clientId);
      } else if (value.sku) {
        // Validate provided SKU against name mapping
        updateData.sku = await validateOrAssignSku(value.name || existingRawMaterial.name, req.user!.clientId, value.sku);
      }
      if (value.purchaseDate) updateData.purchaseDate = new Date(value.purchaseDate);
      if (value.expirationDate) updateData.expirationDate = new Date(value.expirationDate);

      // Map frontend field names to database field names
      if (value.costPerUnit !== undefined) {
        updateData.unitPrice = value.costPerUnit;
        delete updateData.costPerUnit;
      }
      if (value.contaminated !== undefined) {
        updateData.isContaminated = value.contaminated === true || value.contaminated === 'on';
        delete updateData.contaminated;
      }

      // Handle empty qualityStatusId - convert empty string to null for the database
      if (updateData.qualityStatusId === '') {
        updateData.qualityStatusId = null;
      }

      const rawMaterial = await prisma.rawMaterial.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          supplier: true,
          storageLocation: true,
          qualityStatus: true,
        },
      });

      // Persist SKU mapping to ensure it remains even if this raw material is deleted
      if (rawMaterial.sku) {
        await persistSkuMapping(rawMaterial.name, rawMaterial.sku, rawMaterial.category?.name);
      }

      // Get unit details
      let unitDetails = null;
      if (rawMaterial.unit) {
        unitDetails = await prisma.unit.findFirst({
          where: { symbol: rawMaterial.unit }
        });
      }

      res.json({
        success: true,
        data: {
          ...rawMaterial,
          unitDetails
        },
        message: 'Raw material updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/raw-materials/:id
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const existingRawMaterial = await prisma.rawMaterial.findUnique({
        where: { id },
      });

      if (!existingRawMaterial) {
        return res.status(404).json({
          success: false,
          error: 'Raw material not found',
        });
      }

      await prisma.rawMaterial.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Raw material deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/raw-materials/expiring
  getExpiring: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);

      const rawMaterials = await prisma.rawMaterial.findMany({
        where: {
          clientId: req.user!.clientId, // CRITICAL: Filter by tenant
          expirationDate: {
            lte: targetDate,
            gte: new Date(),
          },
          isContaminated: false,
        },
        include: {
          category: true,
          supplier: true,
          storageLocation: true,
        },
        orderBy: { expirationDate: 'asc' },
      });

      res.json({
        success: true,
        data: rawMaterials,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/raw-materials/low-stock
  getLowStock: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const threshold = parseInt(req.query.threshold as string) || 10;

      const rawMaterials = await prisma.rawMaterial.findMany({
        where: {
          clientId: req.user!.clientId, // CRITICAL: Filter by tenant
          quantity: {
            lte: threshold,
          },
          isContaminated: false,
        },
        include: {
          category: true,
          supplier: true,
          storageLocation: true,
        },
        orderBy: { quantity: 'asc' },
      });

      res.json({
        success: true,
        data: rawMaterials,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/raw-materials/:id/contaminate
  markContaminated: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason || typeof reason !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Contamination reason is required',
        });
      }

      const existingRawMaterial = await prisma.rawMaterial.findUnique({
        where: { id },
      });

      if (!existingRawMaterial) {
        return res.status(404).json({
          success: false,
          error: 'Raw material not found',
        });
      }

      const rawMaterial = await prisma.rawMaterial.update({
        where: { id },
        data: { isContaminated: true },
        include: {
          category: true,
          supplier: true,
          storageLocation: true,
        },
      });

      // TODO: Create contamination incident record
      // This will be implemented in the contamination tracking phase

      res.json({
        success: true,
        data: rawMaterial,
        message: 'Raw material marked as contaminated',
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/raw-materials/sku-suggestions?name=
  getSkuSuggestions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const name = req.query.name as string;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Name parameter is required',
        });
      }

      const suggestions = await getSuggestedSku(name, req.user!.clientId);

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/raw-materials/sku-mappings
  getSkuMappings: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mappings = await getAllSkuMappings(req.user!.clientId);

      res.json({
        success: true,
        data: mappings,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/raw-materials/defaults
  getDefaults: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get first storage location
      const firstStorageLocation = await prisma.storageLocation.findFirst({
        orderBy: { name: 'asc' },
      });

      // Get default quality status (first by sortOrder)
      const defaultQualityStatus = await getDefaultQualityStatus();

      // Get first supplier
      const firstSupplier = await prisma.supplier.findFirst({
        orderBy: { name: 'asc' },
      });

      // Get "Ingredients" category as default for raw materials
      const ingredientsCategory = await prisma.category.findFirst({
        where: {
          name: { contains: 'Ingredient', mode: 'insensitive' },
          type: 'RAW_MATERIAL'
        },
      });

      res.json({
        success: true,
        data: {
          storageLocationId: firstStorageLocation?.id || null,
          qualityStatusId: defaultQualityStatus,
          supplierId: firstSupplier?.id || null,
          categoryId: ingredientsCategory?.id || null,
          batchNumber: null, // Will be generated in frontend after expiration date is entered
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/raw-materials/generate-batch-number?supplierId=xxx&expirationDate=YYYY-MM-DD
  generateBatchNumberEndpoint: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const supplierId = req.query.supplierId as string;
      const expirationDate = req.query.expirationDate as string;

      if (!supplierId) {
        return res.status(400).json({
          success: false,
          error: 'supplierId is required',
        });
      }

      if (!expirationDate) {
        return res.status(400).json({
          success: false,
          error: 'expirationDate is required',
        });
      }

      const date = new Date(expirationDate);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid expirationDate format',
        });
      }

      const batchNumber = await generateBatchNumber(supplierId, req.user!.clientId, date);

      res.json({
        success: true,
        data: { batchNumber },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/raw-materials/sku-mappings/:name/usage
  checkSkuUsage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.params;

      const usage = await isSkuInUse(name, req.user!.clientId);

      res.json({
        success: true,
        data: usage,
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/raw-materials/sku-mappings/:name
  deleteSkuMappingEndpoint: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.params;

      await deleteSkuMapping(name, req.user!.clientId);

      res.json({
        success: true,
        message: 'SKU mapping deleted successfully',
      });
    } catch (error: any) {
      if (error.status === 400) {
        return res.status(400).json({
          success: false,
          error: error.message,
          usage: error.usage,
        });
      }
      next(error);
    }
  },
};
