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
    getFinishedProductMaterials,
    checkIngredientAvailability
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

/**
 * @swagger
 * /production/runs:
 *   get:
 *     summary: Get all production runs
 *     description: Retrieve production runs with optional status filtering
 *     tags: [Production]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *       - in: query
 *         name: recipeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of production runs
 */
router.get('/runs', getProductionRuns);

/**
 * @swagger
 * /production/runs/dashboard:
 *   get:
 *     summary: Get dashboard production data
 *     description: Get production runs optimized for dashboard display
 *     tags: [Production]
 *     responses:
 *       200:
 *         description: Dashboard production data
 */
router.get('/runs/dashboard', getDashboardProductionRuns);

/**
 * @swagger
 * /production/runs/stats:
 *   get:
 *     summary: Get production statistics
 *     description: Get aggregated production statistics
 *     tags: [Production]
 *     responses:
 *       200:
 *         description: Production statistics
 */
router.get('/runs/stats', getProductionStats);

/**
 * @swagger
 * /production/runs/completed:
 *   get:
 *     summary: Get completed production runs
 *     tags: [Production]
 *     responses:
 *       200:
 *         description: List of completed runs
 */
router.get('/runs/completed', getCompletedProductionRuns);

/**
 * @swagger
 * /production/runs/{id}:
 *   get:
 *     summary: Get production run by ID
 *     tags: [Production]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Production run details with steps
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/runs/:id', getProductionRunById);

/**
 * @swagger
 * /production/runs/check-availability:
 *   post:
 *     summary: Check ingredient availability
 *     description: Check if ingredients are available for a recipe quantity
 *     tags: [Production]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipeId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Availability check result
 */
router.post('/runs/check-availability', checkIngredientAvailability);

/**
 * @swagger
 * /production/runs:
 *   post:
 *     summary: Create production run
 *     description: Start a new production run from a recipe
 *     tags: [Production]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipeId, quantity]
 *             properties:
 *               recipeId:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 description: Number of batches to produce
 *               notes:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Production run created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/runs', normalizeUnitsMiddleware, createProductionRun);

/**
 * @swagger
 * /production/runs/{id}:
 *   put:
 *     summary: Update production run
 *     tags: [Production]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Run updated
 */
router.put('/runs/:id', normalizeUnitsMiddleware, updateProductionRun);

/**
 * @swagger
 * /production/runs/{id}:
 *   delete:
 *     summary: Delete/cancel production run
 *     tags: [Production]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Run deleted/cancelled
 */
router.delete('/runs/:id', deleteProductionRun);

/**
 * @swagger
 * /production/runs/{productionRunId}/steps:
 *   get:
 *     summary: Get production steps
 *     description: Get all steps for a production run
 *     tags: [Production]
 *     parameters:
 *       - in: path
 *         name: productionRunId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of production steps
 */
router.get('/runs/:productionRunId/steps', getProductionSteps);

/**
 * @swagger
 * /production/steps/{id}:
 *   get:
 *     summary: Get step by ID
 *     tags: [Production]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Step details
 */
router.get('/steps/:id', getProductionStepById);

/**
 * @swagger
 * /production/steps/{id}:
 *   put:
 *     summary: Update production step
 *     tags: [Production]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Step updated
 */
router.put('/steps/:id', updateProductionStep);

/**
 * @swagger
 * /production/steps/{id}/start:
 *   post:
 *     summary: Start production step
 *     description: Mark a step as started
 *     tags: [Production]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Step started
 */
router.post('/steps/:id/start', startProductionStep);

/**
 * @swagger
 * /production/steps/{id}/complete:
 *   post:
 *     summary: Complete production step
 *     description: Mark a step as completed
 *     tags: [Production]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Step completed
 */
router.post('/steps/:id/complete', completeProductionStep);

/**
 * @swagger
 * /production/steps/{id}/quality-check:
 *   post:
 *     summary: Log quality checkpoint
 *     description: Record a quality check for a production step
 *     tags: [Production]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               passed:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Quality check logged
 */
router.post('/steps/:id/quality-check', logQualityCheckpoint);

// Dynamic step management routes
router.post('/runs/:productionRunId/steps', addProductionStep);
router.delete('/steps/:stepId', removeProductionStep);

/**
 * @swagger
 * /production/runs/{productionRunId}/materials/allocate:
 *   post:
 *     summary: Allocate materials
 *     description: Allocate raw materials for production
 *     tags: [Production]
 *     parameters:
 *       - in: path
 *         name: productionRunId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Materials allocated
 */
router.post('/runs/:productionRunId/materials/allocate', allocateProductionMaterials);

/**
 * @swagger
 * /production/runs/{productionRunId}/materials:
 *   get:
 *     summary: Get allocated materials
 *     tags: [Production]
 *     parameters:
 *       - in: path
 *         name: productionRunId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of allocated materials
 */
router.get('/runs/:productionRunId/materials', getProductionMaterials);

/**
 * @swagger
 * /production/runs/{productionRunId}/materials/consume:
 *   post:
 *     summary: Record material consumption
 *     description: Record actual materials consumed during production
 *     tags: [Production]
 *     parameters:
 *       - in: path
 *         name: productionRunId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Consumption recorded
 */
router.post('/runs/:productionRunId/materials/consume', recordMaterialConsumption);

/**
 * @swagger
 * /production/finished-products/{finishedProductId}/materials:
 *   get:
 *     summary: Get materials for finished product
 *     description: Traceability - get all materials used to produce a finished product
 *     tags: [Production]
 *     parameters:
 *       - in: path
 *         name: finishedProductId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Material traceability data
 */
router.get('/finished-products/:finishedProductId/materials', getFinishedProductMaterials);

// Legacy route for backward compatibility
router.post('/what-can-i-make', (req, res) => res.json({ message: 'Production planning API - to be implemented' }));

export default router;
