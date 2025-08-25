import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import Joi from 'joi';

// Validation schemas
const createFinishedProductSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().optional().max(1000),
  sku: Joi.string().required().min(1).max(100),
  categoryId: Joi.string().required(),
  batchNumber: Joi.string().required().min(1).max(100),
  productionDate: Joi.date().required(),
  expirationDate: Joi.date().required().greater(Joi.ref('productionDate')),
  shelfLife: Joi.number().required().positive(),
  quantity: Joi.number().required().positive(),
  unit: Joi.string().required().min(1).max(50),
  salePrice: Joi.number().required().positive(),
  costToProduce: Joi.number().optional().positive(),
  packagingInfo: Joi.string().optional().max(500),
  storageLocationId: Joi.string().optional(),
});

const updateFinishedProductSchema = createFinishedProductSchema.fork([
  'name', 'description', 'sku', 'categoryId', 'batchNumber', 'productionDate',
  'expirationDate', 'shelfLife', 'quantity', 'unit', 'salePrice', 'costToProduce',
  'packagingInfo', 'storageLocationId'
], (schema) => schema.optional()).keys({
  reservedQuantity: Joi.number().optional().min(0),
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

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { batchNumber: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (categoryId) where.categoryId = categoryId;

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

      const finishedProduct = await prisma.finishedProduct.findUnique({
        where: { id },
        include: {
          category: true,
          storageLocation: true,
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

      // Check if SKU already exists
      const existingSku = await prisma.finishedProduct.findUnique({
        where: { sku: value.sku },
      });

      if (existingSku) {
        return res.status(400).json({
          success: false,
          error: 'SKU already exists',
        });
      }

      // Verify related entities exist
      const category = await prisma.category.findUnique({ 
        where: { id: value.categoryId } 
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Category not found',
        });
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
      const createData = {
        ...value,
        productionDate: new Date(value.productionDate),
        expirationDate: new Date(value.expirationDate),
        reservedQuantity: 0, // Default reserved quantity
      };

      const finishedProduct = await prisma.finishedProduct.create({
        data: createData,
        include: {
          category: true,
          storageLocation: true,
        },
      });

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

      // Check SKU uniqueness if being updated
      if (value.sku) {
        const existingSku = await prisma.finishedProduct.findFirst({
          where: {
            sku: value.sku,
            id: { not: id },
          },
        });

        if (existingSku) {
          return res.status(400).json({
            success: false,
            error: 'SKU already exists',
          });
        }
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
      if (value.productionDate) updateData.productionDate = new Date(value.productionDate);
      if (value.expirationDate) updateData.expirationDate = new Date(value.expirationDate);

      const finishedProduct = await prisma.finishedProduct.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          storageLocation: true,
        },
      });

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
        where: { id },
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
        where: { id },
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
        where: { id },
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
};
