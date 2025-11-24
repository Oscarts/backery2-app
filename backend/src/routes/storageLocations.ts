import { Router } from 'express';
import { prisma } from '../app';

const router = Router();

// GET /api/storage-locations
router.get('/', async (req, res, next) => {
  try {
    const storageLocations = await prisma.storageLocation.findMany({
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: storageLocations,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/storage-locations/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const storageLocation = await prisma.storageLocation.findUnique({
      where: { id },
    });

    if (!storageLocation) {
      return res.status(404).json({
        success: false,
        error: 'Storage location not found',
      });
    }

    res.json({
      success: true,
      data: storageLocation,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/storage-locations
router.post('/', async (req, res, next) => {
  try {
    const { name, type, description, capacity } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
      });
    }

    // Explicitly add clientId from authenticated user
    const clientId = (req.user as any)?.clientId || (global as any).__currentClientId;

    if (!clientId) {
      return res.status(500).json({
        success: false,
        error: 'Client ID not found in request'
      });
    }

    const storageLocation = await prisma.storageLocation.create({
      data: { name, type, description, capacity, clientId },
    });

    res.status(201).json({
      success: true,
      data: storageLocation,
      message: 'Storage location created successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      res.status(400).json({
        success: false,
        error: 'A storage location with this name already exists'
      });
    } else {
      next(error);
    }
  }
});

// PUT /api/storage-locations/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, description, capacity } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (capacity !== undefined) updateData.capacity = capacity;

    const storageLocation = await prisma.storageLocation.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: storageLocation,
      message: 'Storage location updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Storage location not found',
      });
    } else if (error.code === 'P2002') {
      // Unique constraint violation
      res.status(400).json({
        success: false,
        error: 'A storage location with this name already exists'
      });
    } else {
      next(error);
    }
  }
});

// DELETE /api/storage-locations/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.storageLocation.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Storage location deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Storage location not found',
      });
    } else if (error.code === 'P2003') {
      // Foreign key constraint violation
      res.status(400).json({
        success: false,
        error: 'Cannot delete storage location because it is being used by materials',
      });
    } else {
      next(error);
    }
  }
});

export default router;
