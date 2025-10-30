import { Router } from 'express';
import {
    getProductionRuns,
    getProductionRunById,
    createProductionRun,
    updateProductionRun,
    deleteProductionRun,
    getDashboardProductionRuns,
    getProductionStats,
    getCompletedProductionRuns,
    allocateProductionMaterials,
    getProductionMaterials,
    recordMaterialConsumption,
    getFinishedProductMaterials
} from '../controllers/productionRunController';
import {
    getProductionSteps,
    getProductionStepById,
    updateProductionStep,
    startProductionStep,
    completeProductionStep,
    logQualityCheckpoint,
    addProductionStep,
    removeProductionStep
} from '../controllers/productionStepController';
import { normalizeUnitsMiddleware } from '../middleware/unitValidation';

const router = Router();

// Production Run routes
router.get('/runs', getProductionRuns);
router.get('/runs/dashboard', getDashboardProductionRuns);
router.get('/runs/stats', getProductionStats);
router.get('/runs/completed', getCompletedProductionRuns);
router.get('/runs/:id', getProductionRunById);
router.post('/runs', normalizeUnitsMiddleware, createProductionRun);
router.put('/runs/:id', normalizeUnitsMiddleware, updateProductionRun);
router.delete('/runs/:id', deleteProductionRun);

// Production Step routes
router.get('/runs/:productionRunId/steps', getProductionSteps);
router.get('/steps/:id', getProductionStepById);
router.put('/steps/:id', updateProductionStep);
router.post('/steps/:id/start', startProductionStep);
router.post('/steps/:id/complete', completeProductionStep);
router.post('/steps/:id/quality-check', logQualityCheckpoint);

// Dynamic step management routes
router.post('/runs/:productionRunId/steps', addProductionStep);
router.delete('/steps/:stepId', removeProductionStep);

// Material tracking routes
router.post('/runs/:productionRunId/materials/allocate', allocateProductionMaterials);
router.get('/runs/:productionRunId/materials', getProductionMaterials);
router.post('/runs/:productionRunId/materials/consume', recordMaterialConsumption);
router.get('/finished-products/:finishedProductId/materials', getFinishedProductMaterials);

// Legacy route for backward compatibility
router.post('/what-can-i-make', (req, res) => res.json({ message: 'Production planning API - to be implemented' }));

export default router;
