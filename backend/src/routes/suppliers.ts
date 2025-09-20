import { Router } from 'express';
import { prisma } from '../app';

const router = Router();

// GET /api/suppliers
router.get('/', async (req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/suppliers
router.post('/', async (req, res, next) => {
  try {
    const { name, contactInfo, address } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required',
      });
    }

    const supplier = await prisma.supplier.create({
      data: { name, contactInfo, address },
    });

    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
