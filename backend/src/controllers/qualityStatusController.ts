import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all quality statuses
export const getQualityStatuses = async (req: Request, res: Response) => {
  try {
    console.log('🔍 Quality Status API called - getQualityStatuses');
    const qualityStatuses = await prisma.qualityStatus.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    console.log('✅ Found', qualityStatuses.length, 'active quality statuses');
    res.json({ success: true, data: qualityStatuses });
  } catch (error) {
    console.error('❌ Error fetching quality statuses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch quality statuses' });
  }
};

// Get quality status by ID
export const getQualityStatusById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const qualityStatus = await prisma.qualityStatus.findUnique({
      where: { id },
    });

    if (!qualityStatus) {
      return res.status(404).json({ error: 'Quality status not found' });
    }

    res.json(qualityStatus);
  } catch (error) {
    console.error('Error fetching quality status:', error);
    res.status(500).json({ error: 'Failed to fetch quality status' });
  }
};

// Create quality status
export const createQualityStatus = async (req: Request, res: Response) => {
  try {
    const { name, description, color, sortOrder } = req.body;

    const newQualityStatus = await prisma.qualityStatus.create({
      data: {
        name,
        description,
        color,
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json(newQualityStatus);
  } catch (error: any) {
    console.error('Error creating quality status:', error);

    // Handle Prisma unique constraint error
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return res.status(400).json({ error: 'Quality status name already exists' });
    }

    res.status(500).json({ error: 'Failed to create quality status' });
  }
};

// Update quality status
export const updateQualityStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, color, sortOrder, isActive } = req.body;

    const updatedQualityStatus = await prisma.qualityStatus.update({
      where: { id },
      data: {
        name,
        description,
        color,
        sortOrder,
        isActive,
      },
    });

    res.json(updatedQualityStatus);
  } catch (error: any) {
    console.error('Error updating quality status:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Quality status not found' });
    }

    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return res.status(400).json({ error: 'Quality status name already exists' });
    }

    res.status(500).json({ error: 'Failed to update quality status' });
  }
};

// Delete quality status (soft delete)
export const deleteQualityStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if quality status is in use
    const inUse = await Promise.all([
      prisma.rawMaterial.count({ where: { qualityStatusId: id } }),
      prisma.intermediateProduct.count({ where: { qualityStatusId: id } }),
      prisma.finishedProduct.count({ where: { qualityStatusId: id } }),
    ]);

    const totalInUse = inUse.reduce((sum, count) => sum + count, 0);

    if (totalInUse > 0) {
      // Soft delete - just deactivate
      const updatedQualityStatus = await prisma.qualityStatus.update({
        where: { id },
        data: { isActive: false },
      });

      res.json({
        message: 'Quality status deactivated (it is in use by existing products)',
        qualityStatus: updatedQualityStatus,
      });
    } else {
      // Hard delete if not in use
      await prisma.qualityStatus.delete({
        where: { id },
      });

      res.json({ message: 'Quality status deleted successfully' });
    }
  } catch (error) {
    console.error('Error deleting quality status:', error);

    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return res.status(404).json({ error: 'Quality status not found' });
    }

    res.status(500).json({ error: 'Failed to delete quality status' });
  }
};

// Get usage statistics for quality status
export const getQualityStatusUsage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const usage = await Promise.all([
      prisma.rawMaterial.count({ where: { qualityStatusId: id } }),
      prisma.intermediateProduct.count({ where: { qualityStatusId: id } }),
      prisma.finishedProduct.count({ where: { qualityStatusId: id } }),
    ]);

    res.json({
      qualityStatusId: id,
      usage: {
        rawMaterials: usage[0],
        intermediateProducts: usage[1],
        finishedProducts: usage[2],
        total: usage.reduce((sum, count) => sum + count, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching quality status usage:', error);
    res.status(500).json({ error: 'Failed to fetch quality status usage' });
  }
};
