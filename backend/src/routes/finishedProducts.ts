import { Router } from 'express';
import { finishedProductController } from '../controllers/finishedProductController';
import { getFinishedProductMaterials } from '../controllers/productionRunController';
import { normalizeUnitsMiddleware } from '../middleware/unitValidation';

const router = Router();

/**
 * @swagger
 * /finished-products:
 *   get:
 *     summary: Get all finished products
 *     description: Retrieve all finished products for the current tenant with optional filtering
 *     tags: [Finished Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or SKU
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of finished products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FinishedProduct'
 */
router.get('/', finishedProductController.getAll);

/**
 * @swagger
 * /finished-products/defaults:
 *   get:
 *     summary: Get default values for creation
 *     tags: [Finished Products]
 *     responses:
 *       200:
 *         description: Default values (recipes, storage locations, etc.)
 */
router.get('/defaults', finishedProductController.getDefaults);

/**
 * @swagger
 * /finished-products/expiring:
 *   get:
 *     summary: Get expiring products
 *     description: Get products expiring within specified days
 *     tags: [Finished Products]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: List of expiring products
 */
router.get('/expiring', finishedProductController.getExpiring);

/**
 * @swagger
 * /finished-products/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Finished Products]
 *     responses:
 *       200:
 *         description: List of low stock products
 */
router.get('/low-stock', finishedProductController.getLowStock);

/**
 * @swagger
 * /finished-products/{id}:
 *   get:
 *     summary: Get finished product by ID
 *     tags: [Finished Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Finished product details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', finishedProductController.getById);

/**
 * @swagger
 * /finished-products/{id}/materials:
 *   get:
 *     summary: Get material traceability
 *     description: Get all raw materials used to produce this finished product (traceability)
 *     tags: [Finished Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Material breakdown with costs
 */
router.get('/:id/materials', (req, res) => {
	(req as any).params.finishedProductId = req.params.id;
	return getFinishedProductMaterials(req as any, res as any);
});

/**
 * @swagger
 * /finished-products:
 *   post:
 *     summary: Create finished product
 *     description: Create a new finished product (usually from production)
 *     tags: [Finished Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, quantity, unit, salePrice, batchNumber, productionDate, expirationDate, shelfLife]
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               salePrice:
 *                 type: number
 *               costToProduce:
 *                 type: number
 *               markupPercentage:
 *                 type: number
 *               batchNumber:
 *                 type: string
 *               productionDate:
 *                 type: string
 *                 format: date-time
 *               expirationDate:
 *                 type: string
 *                 format: date-time
 *               shelfLife:
 *                 type: integer
 *               recipeId:
 *                 type: string
 *               storageLocationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Finished product created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', normalizeUnitsMiddleware, finishedProductController.create);

/**
 * @swagger
 * /finished-products/{id}:
 *   put:
 *     summary: Update finished product
 *     tags: [Finished Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', normalizeUnitsMiddleware, finishedProductController.update);

/**
 * @swagger
 * /finished-products/{id}:
 *   delete:
 *     summary: Delete finished product
 *     tags: [Finished Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', finishedProductController.delete);

/**
 * @swagger
 * /finished-products/{id}/reserve:
 *   put:
 *     summary: Reserve quantity
 *     description: Reserve product quantity for an order
 *     tags: [Finished Products]
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
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Quantity reserved
 */
router.put('/:id/reserve', finishedProductController.reserveQuantity);

/**
 * @swagger
 * /finished-products/{id}/release:
 *   put:
 *     summary: Release reservation
 *     description: Release previously reserved quantity
 *     tags: [Finished Products]
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
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Reservation released
 */
router.put('/:id/release', finishedProductController.releaseReservation);

export default router;
