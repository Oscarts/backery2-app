import { Router } from 'express';
import { prisma } from '../app';

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

// PUT /api/categories/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, description } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Name and type are required',
      });
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, type, description },
    });

    res.json({
      success: true,
      data: category,
      message: 'Category updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
      });
    }

    // Check if category is being used by other entities
    const [rawMaterialsCount, intermediateProductsCount, finishedProductsCount, recipesCount] = await Promise.all([
      prisma.rawMaterial.count({ where: { categoryId: id } }),
      prisma.intermediateProduct.count({ where: { categoryId: id } }),
      prisma.finishedProduct.count({ where: { categoryId: id } }),
      prisma.recipe.count({ where: { categoryId: id } }),
    ]);

    const totalUsage = rawMaterialsCount + intermediateProductsCount + finishedProductsCount + recipesCount;
    
    if (totalUsage > 0) {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete category as it is being used by other items',
        details: {
          rawMaterials: rawMaterialsCount,
          intermediateProducts: intermediateProductsCount,
          finishedProducts: finishedProductsCount,
          recipes: recipesCount,
        },
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
