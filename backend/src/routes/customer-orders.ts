import express from 'express';
import * as customerOrderController from '../controllers/customerOrderController';
import * as orderExportController from '../controllers/orderExportController';

const router = express.Router();

/**
 * @swagger
 * /customer-orders:
 *   get:
 *     summary: Get all customer orders
 *     description: Retrieve all orders with optional filtering
 *     tags: [Customer Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, CONFIRMED, FULFILLED, CANCELLED]
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of orders
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
 *                     $ref: '#/components/schemas/CustomerOrder'
 */
router.get('/', customerOrderController.getOrders);

/**
 * @swagger
 * /customer-orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Customer Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', customerOrderController.getOrderById);

/**
 * @swagger
 * /customer-orders/{id}/inventory-check:
 *   get:
 *     summary: Check inventory for order
 *     description: Check if inventory is available to fulfill order
 *     tags: [Customer Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventory check result
 */
router.get('/:id/inventory-check', customerOrderController.checkInventory);

/**
 * @swagger
 * /customer-orders:
 *   post:
 *     summary: Create customer order
 *     description: Create a new customer order (starts as DRAFT)
 *     tags: [Customer Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, items]
 *             properties:
 *               customerId:
 *                 type: string
 *               deliveryDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     finishedProductId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitPrice:
 *                       type: number
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/', customerOrderController.createOrder);

/**
 * @swagger
 * /customer-orders/{id}:
 *   put:
 *     summary: Update customer order
 *     description: Update order (only DRAFT orders can be fully modified)
 *     tags: [Customer Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', customerOrderController.updateOrder);

/**
 * @swagger
 * /customer-orders/{id}:
 *   delete:
 *     summary: Delete customer order
 *     description: Delete order (DRAFT only)
 *     tags: [Customer Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order deleted
 *       400:
 *         description: Cannot delete non-draft order
 */
router.delete('/:id', customerOrderController.deleteOrder);

/**
 * @swagger
 * /customer-orders/{id}/confirm:
 *   post:
 *     summary: Confirm order
 *     description: Confirm order (DRAFT → CONFIRMED), reserves inventory
 *     tags: [Customer Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order confirmed, inventory reserved
 *       400:
 *         description: Insufficient inventory
 */
router.post('/:id/confirm', customerOrderController.confirmOrder);

/**
 * @swagger
 * /customer-orders/{id}/revert-draft:
 *   post:
 *     summary: Revert to draft
 *     description: Revert order to draft (CONFIRMED → DRAFT), releases inventory
 *     tags: [Customer Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order reverted, inventory released
 */
router.post('/:id/revert-draft', customerOrderController.revertToDraft);

/**
 * @swagger
 * /customer-orders/{id}/fulfill:
 *   post:
 *     summary: Fulfill order
 *     description: Fulfill order (CONFIRMED → FULFILLED), consumes inventory
 *     tags: [Customer Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order fulfilled, inventory consumed
 */
router.post('/:id/fulfill', customerOrderController.fulfillOrder);

/**
 * @swagger
 * /customer-orders/{id}/export/pdf:
 *   get:
 *     summary: Export order as PDF
 *     tags: [Customer Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/export/pdf', orderExportController.exportOrderPDF);

/**
 * @swagger
 * /customer-orders/{id}/export/excel:
 *   get:
 *     summary: Export order as Excel
 *     tags: [Customer Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Excel file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/export/excel', orderExportController.exportOrderExcel);

/**
 * @swagger
 * /customer-orders/{id}/export/word:
 *   get:
 *     summary: Export order as Word document
 *     description: Export as professional French proforma/devis with TVA
 *     tags: [Customer Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Word document
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/:id/export/word', orderExportController.exportOrderWord);

/**
 * @swagger
 * /customer-orders/export/excel:
 *   post:
 *     summary: Bulk export orders as Excel
 *     description: Export multiple orders with filters
 *     tags: [Customer Orders]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               dateFrom:
 *                 type: string
 *                 format: date
 *               dateTo:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Excel file with multiple orders
 */
router.post('/export/excel', orderExportController.exportBulkExcel);

export default router;
