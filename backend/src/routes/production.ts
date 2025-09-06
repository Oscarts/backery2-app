import { Router } from 'express';
import {
    getProductionRuns,
    getProductionRunById,
    createProductionRun,
    updateProductionRun,
    deleteProductionRun,
    getDashboardProductionRuns
} from '../controllers/productionRunController';
import {
    getProductionSteps,
    getProductionStepById,
    updateProductionStep,
    startProductionStep,
    completeProductionStep
} from '../controllers/productionStepController';

const router = Router();

// Production Run routes
router.get('/runs', getProductionRuns);
router.get('/runs/dashboard', getDashboardProductionRuns);
router.get('/runs/:id', getProductionRunById);
router.post('/runs', createProductionRun);
router.put('/runs/:id', updateProductionRun);
router.delete('/runs/:id', deleteProductionRun);

// Production Step routes
router.get('/runs/:productionRunId/steps', getProductionSteps);
router.get('/steps/:id', getProductionStepById);
router.put('/steps/:id', updateProductionStep);
router.post('/steps/:id/start', startProductionStep);
router.post('/steps/:id/complete', completeProductionStep);

// Legacy route for backward compatibility
router.post('/what-can-i-make', (req, res) => res.json({ message: 'Production planning API - to be implemented' }));

export default router;
