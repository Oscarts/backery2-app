import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function to get the default quality status (first item by sortOrder)
const getDefaultQualityStatus = async () => {
  const defaultStatus = await prisma.qualityStatus.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return defaultStatus?.id || null;
};

export const intermediateProductController = {
  // Get all intermediate products
  getAll: async (req: Request, res: Response) => {
    try {
      const products = await prisma.intermediateProduct.findMany({
        include: {
          category: true,
          storageLocation: true,
          recipe: true,
          qualityStatus: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      res.json({ success: true, data: products });
    } catch (error) {
      console.error('Error fetching intermediate products:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch intermediate products' });
    }
  },

  // Get a single intermediate product by ID
  getById: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const product = await prisma.intermediateProduct.findUnique({
        where: { id },
        include: {
          category: true,
          storageLocation: true,
          recipe: true,
          qualityStatus: true
        }
      });
      if (!product) {
        return res.status(404).json({ success: false, error: 'Intermediate product not found' });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      console.error('Error fetching intermediate product:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch intermediate product' });
    }
  },

  // Create a new intermediate product
  create: async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        categoryId,
        storageLocationId,
        recipeId,
        batchNumber,
        productionDate,
        expirationDate,
        quantity,
        unit,
        status,
        contaminated,
        qualityStatus
      } = req.body;

      // Validate required fields
      if (!name || !description || !categoryId || !storageLocationId || !batchNumber ||
        !productionDate || !expirationDate || !quantity || !unit) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const defaultQualityStatusId = qualityStatus || await getDefaultQualityStatus();

      const product = await prisma.intermediateProduct.create({
        data: {
          name,
          description,
          categoryId,
          storageLocationId,
          recipeId: recipeId || null,
          batchNumber,
          productionDate: new Date(productionDate),
          expirationDate: new Date(expirationDate),
          quantity: parseFloat(quantity),
          unit,
          status: status || 'IN_PRODUCTION',
          contaminated: contaminated ?? false,
          qualityStatusId: defaultQualityStatusId
        },
        include: {
          category: true,
          storageLocation: true,
          recipe: true,
          qualityStatus: true
        }
      });

      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      console.error('Error creating intermediate product:', error);
      if (error.code === 'P2002') {
        res.status(400).json({ success: false, error: 'Batch number already exists' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to create intermediate product' });
      }
    }
  },

  // Update an intermediate product
  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const {
        name,
        description,
        categoryId,
        storageLocationId,
        recipeId,
        batchNumber,
        productionDate,
        expirationDate,
        quantity,
        unit,
        status,
        contaminated,
        qualityStatus,
        qualityStatusId
      } = req.body;

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (storageLocationId !== undefined) updateData.storageLocationId = storageLocationId;
      if (recipeId !== undefined) updateData.recipeId = recipeId || null;
      if (batchNumber !== undefined) updateData.batchNumber = batchNumber;
      if (productionDate !== undefined) updateData.productionDate = new Date(productionDate);
      if (expirationDate !== undefined) updateData.expirationDate = new Date(expirationDate);
      if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
      if (unit !== undefined) updateData.unit = unit;
      if (status !== undefined) updateData.status = status;
      if (contaminated !== undefined) updateData.contaminated = contaminated === true || contaminated === 'on';
      
      // Handle both qualityStatus and qualityStatusId for backward compatibility
      if (qualityStatusId !== undefined) updateData.qualityStatusId = qualityStatusId;
      else if (qualityStatus !== undefined) updateData.qualityStatusId = qualityStatus;
      
      // Handle empty qualityStatusId - convert empty string to null for the database
      if (updateData.qualityStatusId === '') {
        updateData.qualityStatusId = null;
      }

      const product = await prisma.intermediateProduct.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          storageLocation: true,
          recipe: true,
          qualityStatus: true
        }
      });

      res.json({ success: true, data: product });
    } catch (error: any) {
      console.error('Error updating intermediate product:', error);
      if (error.code === 'P2025') {
        res.status(404).json({ success: false, error: 'Intermediate product not found' });
      } else if (error.code === 'P2002') {
        res.status(400).json({ success: false, error: 'Batch number already exists' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to update intermediate product' });
      }
    }
  },

  // Delete an intermediate product
  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await prisma.intermediateProduct.delete({
        where: { id }
      });
      res.json({ success: true, message: 'Intermediate product deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting intermediate product:', error);
      if (error.code === 'P2025') {
        res.status(404).json({ success: false, error: 'Intermediate product not found' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to delete intermediate product' });
      }
    }
  }
};
