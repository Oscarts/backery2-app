import express from 'express';
import { skuReferenceController } from '../controllers/skuReferenceController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/sku-references:
 *   get:
 *     summary: Get all SKU references
 *     description: Retrieve all SKU references for the authenticated client with optional filtering
 *     tags: [SKU References]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, SKU, or description
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: storageLocationId
 *         schema:
 *           type: string
 *         description: Filter by storage location ID
 *     responses:
 *       200:
 *         description: List of SKU references
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
 *                     $ref: '#/components/schemas/SkuReference'
 */
router.get('/', skuReferenceController.getAll);

/**
 * @swagger
 * /api/sku-references/{id}:
 *   get:
 *     summary: Get SKU reference by ID
 *     description: Retrieve a single SKU reference with usage details
 *     tags: [SKU References]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SKU reference ID
 *     responses:
 *       200:
 *         description: SKU reference details
 *       404:
 *         description: SKU reference not found
 */
router.get('/:id', skuReferenceController.getById);

/**
 * @swagger
 * /api/sku-references:
 *   post:
 *     summary: Create a new SKU reference
 *     description: Create a new SKU reference template for raw materials and finished products
 *     tags: [SKU References]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product/material name (must be unique per client)
 *               sku:
 *                 type: string
 *                 description: SKU code (auto-generated if not provided)
 *               description:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *                 description: Default price per unit
 *               unit:
 *                 type: string
 *                 description: Default unit (kg, L, pcs, etc.)
 *               reorderLevel:
 *                 type: number
 *                 description: Minimum stock level
 *               storageLocationId:
 *                 type: string
 *                 description: Default storage location ID
 *               categoryId:
 *                 type: string
 *                 description: Category ID
 *     responses:
 *       201:
 *         description: SKU reference created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate name or SKU
 */
router.post('/', skuReferenceController.create);

/**
 * @swagger
 * /api/sku-references/{id}:
 *   put:
 *     summary: Update a SKU reference
 *     description: Update an existing SKU reference template
 *     tags: [SKU References]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SKU reference ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               sku:
 *                 type: string
 *               description:
 *                 type: string
 *               unitPrice:
 *                 type: number
 *               unit:
 *                 type: string
 *               reorderLevel:
 *                 type: number
 *               storageLocationId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: SKU reference updated successfully
 *       404:
 *         description: SKU reference not found
 *       409:
 *         description: Duplicate name or SKU
 */
router.put('/:id', skuReferenceController.update);

/**
 * @swagger
 * /api/sku-references/{id}:
 *   delete:
 *     summary: Delete a SKU reference
 *     description: Delete a SKU reference if it's not in use
 *     tags: [SKU References]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SKU reference ID
 *     responses:
 *       200:
 *         description: SKU reference deleted successfully
 *       404:
 *         description: SKU reference not found
 *       409:
 *         description: SKU reference is in use and cannot be deleted
 */
router.delete('/:id', skuReferenceController.deleteSkuReference);

/**
 * @swagger
 * /api/sku-references/{id}/usage:
 *   get:
 *     summary: Check SKU reference usage
 *     description: Get detailed usage information for a SKU reference
 *     tags: [SKU References]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SKU reference ID
 *     responses:
 *       200:
 *         description: Usage information
 *       404:
 *         description: SKU reference not found
 */
router.get('/:id/usage', skuReferenceController.checkUsage);

export default router;
