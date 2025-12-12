import express from 'express';
import { getAllUnits, getUnitById, createUnit, updateUnit, deleteUnit } from '../controllers/unitController';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin';

const router = express.Router();

// GET /api/units - Get all units (available to all authenticated users)
router.get('/', getAllUnits);

// GET /api/units/:id - Get unit by ID (available to all authenticated users)
router.get('/:id', getUnitById);

// POST /api/units - Create new unit (Super Admin only)
router.post('/', requireSuperAdmin, createUnit);

// PUT /api/units/:id - Update unit (Super Admin only)
router.put('/:id', requireSuperAdmin, updateUnit);

// DELETE /api/units/:id - Delete unit (Super Admin only)
router.delete('/:id', requireSuperAdmin, deleteUnit);

export default router;
