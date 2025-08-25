import { Router } from 'express';
import { intermediateProductController } from '../controllers/intermediateProductController';

const router = Router();

// GET /api/intermediate-products - Get all intermediate products
router.get('/', intermediateProductController.getAll);

// GET /api/intermediate-products/:id - Get a specific intermediate product
router.get('/:id', intermediateProductController.getById);

// POST /api/intermediate-products - Create a new intermediate product
router.post('/', intermediateProductController.create);

// PUT /api/intermediate-products/:id - Update an intermediate product
router.put('/:id', intermediateProductController.update);

// DELETE /api/intermediate-products/:id - Delete an intermediate product
router.delete('/:id', intermediateProductController.delete);

export default router;
