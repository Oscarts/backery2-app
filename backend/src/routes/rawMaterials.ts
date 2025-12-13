import { Router } from 'express';
import { rawMaterialController } from '../controllers/rawMaterialController';

const router = Router();

/**
 * @swagger
 * /raw-materials:
 *   get:
 *     summary: Get all raw materials
 *     description: Retrieve all raw materials for the current tenant with optional filtering
 *     tags: [Raw Materials]
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
 *         description: Filter by category
 *       - in: query
 *         name: supplierId
 *         schema:
 *           type: string
 *         description: Filter by supplier
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
 *         description: List of raw materials
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
 *                     $ref: '#/components/schemas/RawMaterial'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', rawMaterialController.getAll);

/**
 * @swagger
 * /raw-materials/sku-suggestions:
 *   get:
 *     summary: Get SKU suggestions
 *     description: Get SKU suggestions based on partial name input
 *     tags: [Raw Materials]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial name to search for
 *     responses:
 *       200:
 *         description: List of SKU suggestions
 */
router.get('/sku-suggestions', rawMaterialController.getSkuSuggestions);

// GET /api/raw-materials/sku-mappings
router.get('/sku-mappings', rawMaterialController.getSkuMappings);

// GET /api/raw-materials/sku-mappings/:name/usage
router.get('/sku-mappings/:name/usage', rawMaterialController.checkSkuUsage);

// DELETE /api/raw-materials/sku-mappings/:name
router.delete('/sku-mappings/:name', rawMaterialController.deleteSkuMappingEndpoint);

/**
 * @swagger
 * /raw-materials/defaults:
 *   get:
 *     summary: Get default values
 *     description: Get default values for raw material creation (suppliers, storage locations, etc.)
 *     tags: [Raw Materials]
 *     responses:
 *       200:
 *         description: Default values
 */
router.get('/defaults', rawMaterialController.getDefaults);

/**
 * @swagger
 * /raw-materials/generate-batch-number:
 *   get:
 *     summary: Generate batch number
 *     description: Generate a unique batch number based on supplier and date
 *     tags: [Raw Materials]
 *     parameters:
 *       - in: query
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Generated batch number
 */
router.get('/generate-batch-number', rawMaterialController.generateBatchNumberEndpoint);

/**
 * @swagger
 * /raw-materials/expiring:
 *   get:
 *     summary: Get expiring materials
 *     description: Get raw materials expiring within a specified number of days
 *     tags: [Raw Materials]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: List of expiring materials
 */
router.get('/expiring', rawMaterialController.getExpiring);

/**
 * @swagger
 * /raw-materials/low-stock:
 *   get:
 *     summary: Get low stock materials
 *     description: Get raw materials with quantity below reorder level
 *     tags: [Raw Materials]
 *     responses:
 *       200:
 *         description: List of low stock materials
 */
router.get('/low-stock', rawMaterialController.getLowStock);

/**
 * @swagger
 * /raw-materials:
 *   post:
 *     summary: Create raw material
 *     description: Create a new raw material inventory entry
 *     tags: [Raw Materials]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RawMaterialCreate'
 *     responses:
 *       201:
 *         description: Raw material created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RawMaterial'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', rawMaterialController.create);

/**
 * @swagger
 * /raw-materials/{id}:
 *   get:
 *     summary: Get raw material by ID
 *     description: Retrieve a specific raw material by its ID
 *     tags: [Raw Materials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Raw material details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RawMaterial'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', rawMaterialController.getById);

/**
 * @swagger
 * /raw-materials/{id}:
 *   put:
 *     summary: Update raw material
 *     description: Update an existing raw material
 *     tags: [Raw Materials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RawMaterialCreate'
 *     responses:
 *       200:
 *         description: Raw material updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', rawMaterialController.update);

/**
 * @swagger
 * /raw-materials/{id}:
 *   delete:
 *     summary: Delete raw material
 *     description: Delete a raw material (soft delete or hard delete based on usage)
 *     tags: [Raw Materials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Raw material deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', rawMaterialController.delete);

/**
 * @swagger
 * /raw-materials/{id}/contaminate:
 *   put:
 *     summary: Mark as contaminated
 *     description: Mark a raw material as contaminated
 *     tags: [Raw Materials]
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Material marked as contaminated
 */
router.put('/:id/contaminate', rawMaterialController.markContaminated);

export default router;
