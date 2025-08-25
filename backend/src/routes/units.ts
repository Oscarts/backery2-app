import express from 'express';
import { getAllUnits, getUnitById, createUnit, updateUnit, deleteUnit } from '../controllers/unitController';

const router = express.Router();

// GET /api/units - Get all units
router.get('/', getAllUnits);

// GET /api/units/:id - Get unit by ID
router.get('/:id', getUnitById);

// POST /api/units - Create new unit
router.post('/', createUnit);

// PUT /api/units/:id - Update unit
router.put('/:id', updateUnit);

// DELETE /api/units/:id - Delete unit
router.delete('/:id', deleteUnit);

export default router;
