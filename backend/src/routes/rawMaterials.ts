import { Router } from 'express';
import { rawMaterialController } from '../controllers/rawMaterialController';

const router = Router();

// GET /api/raw-materials
router.get('/', rawMaterialController.getAll);

// GET /api/raw-materials/expiring
router.get('/expiring', rawMaterialController.getExpiring);

// GET /api/raw-materials/low-stock
router.get('/low-stock', rawMaterialController.getLowStock);

// POST /api/raw-materials
router.post('/', rawMaterialController.create);

// GET /api/raw-materials/:id
router.get('/:id', rawMaterialController.getById);

// PUT /api/raw-materials/:id
router.put('/:id', rawMaterialController.update);

// DELETE /api/raw-materials/:id
router.delete('/:id', rawMaterialController.delete);

// PUT /api/raw-materials/:id/contaminate
router.put('/:id/contaminate', rawMaterialController.markContaminated);

export default router;
