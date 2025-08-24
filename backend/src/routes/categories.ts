import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    const type = req.query.type as string;
    const where = type ? { type: type as any } : {};
    
    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/categories
router.post('/', async (req, res, next) => {
  try {
    const { name, type, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name and type are required',
      });
    }

    const category = await prisma.category.create({
      data: { name, type, description },
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
