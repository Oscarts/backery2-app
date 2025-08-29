import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import Joi from 'joi';

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
  categoryId: Joi.string().required(),
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
      const where: any = {};

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

      const [rawMaterials, total] = await Promise.all([
        prisma.rawMaterial.findMany({
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
        }),
        prisma.rawMaterial.count({ where }),
      ]);

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

      const rawMaterial = await prisma.rawMaterial.findUnique({
        where: { id },
        include: {
          category: true,
          supplier: true,
          storageLocation: true,
        },
      });

      if (!rawMaterial) {
        return res.status(404).json({
          success: false,
          error: 'Raw material not found',
        });
      }

      res.json({
        success: true,
        data: rawMaterial,
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

      // Check if batch number already exists for this supplier
      const existingBatch = await prisma.rawMaterial.findFirst({
        where: {
          batchNumber: value.batchNumber,
          supplierId: value.supplierId,
        },
      });

      if (existingBatch) {
        return res.status(400).json({
          success: false,
          error: 'Batch number already exists for this supplier',
        });
      }

      // Verify related entities exist
      const [category, supplier, storageLocation] = await Promise.all([
        prisma.category.findUnique({ where: { id: value.categoryId } }),
        prisma.supplier.findUnique({ where: { id: value.supplierId } }),
        prisma.storageLocation.findUnique({ where: { id: value.storageLocationId } }),
      ]);

      if (!category) {
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

      const createData = {
        ...value,
        purchaseDate: new Date(value.purchaseDate),
        expirationDate: new Date(value.expirationDate),
        unitPrice: value.costPerUnit, // Map costPerUnit to unitPrice
        qualityStatusId: defaultQualityStatusId, // Use provided or default quality status
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

      res.status(201).json({
        success: true,
        data: rawMaterial,
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

      res.json({
        success: true,
        data: rawMaterial,
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
};
