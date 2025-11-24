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

// GET /api/suppliers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: 'Supplier not found',
      });
    }

    res.json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/suppliers
router.post('/', async (req, res, next) => {
  try {
    const { name, contactInfo, address, isActive } = req.body;

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

    const supplier = await prisma.supplier.create({
      data: { name, contactInfo, address, isActive: isActive ?? true, clientId },
    });

    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Unique constraint violation
      res.status(400).json({
        success: false,
        error: 'A supplier with this name already exists'
      });
    } else {
      next(error);
    }
  }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, contactInfo, address, isActive } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
    if (address !== undefined) updateData.address = address;
    if (isActive !== undefined) updateData.isActive = isActive;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Supplier not found',
      });
    } else if (error.code === 'P2002') {
      // Unique constraint violation
      res.status(400).json({
        success: false,
        error: 'A supplier with this name already exists'
      });
    } else {
      next(error);
    }
  }
});

// DELETE /api/suppliers/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.supplier.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Supplier not found',
      });
    } else if (error.code === 'P2003') {
      // Foreign key constraint violation
      res.status(400).json({
        success: false,
        error: 'Cannot delete supplier because it is being used by raw materials',
      });
    } else {
      next(error);
    }
  }
});

export default router;
