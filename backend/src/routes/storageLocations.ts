import { Router } from 'express';
import { prisma } from '../index';

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

    const storageLocation = await prisma.storageLocation.create({
      data: { name, type, description, capacity },
    });

    res.status(201).json({
      success: true,
      data: storageLocation,
      message: 'Storage location created successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
