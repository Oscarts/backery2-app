import { Router } from 'express';
import { finishedProductController } from '../controllers/finishedProductController';
import { getFinishedProductMaterials } from '../controllers/productionRunController';

const router = Router();

// Basic CRUD operations
router.get('/', finishedProductController.getAll);
router.get('/expiring', finishedProductController.getExpiring);
router.get('/low-stock', finishedProductController.getLowStock);
router.get('/:id', finishedProductController.getById);
// Traceability / material breakdown (was only exposed via production controller earlier)
router.get('/:id/materials', (req, res) => {
	// Reuse existing logic implemented for finished product material traceability
	// productionRunController expects param finishedProductId
	(req as any).params.finishedProductId = req.params.id;
	return getFinishedProductMaterials(req as any, res as any);
});
router.post('/', finishedProductController.create);
router.put('/:id', finishedProductController.update);
router.delete('/:id', finishedProductController.delete);

// Reservation management
router.put('/:id/reserve', finishedProductController.reserveQuantity);
router.put('/:id/release', finishedProductController.releaseReservation);

export default router;
