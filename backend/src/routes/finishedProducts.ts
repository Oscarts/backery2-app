import { Router } from 'express';
import { finishedProductController } from '../controllers/finishedProductController';

const router = Router();

// Basic CRUD operations
router.get('/', finishedProductController.getAll);
router.get('/expiring', finishedProductController.getExpiring);
router.get('/low-stock', finishedProductController.getLowStock);
router.get('/:id', finishedProductController.getById);
router.post('/', finishedProductController.create);
router.put('/:id', finishedProductController.update);
router.delete('/:id', finishedProductController.delete);

// Reservation management
router.put('/:id/reserve', finishedProductController.reserveQuantity);
router.put('/:id/release', finishedProductController.releaseReservation);

export default router;
