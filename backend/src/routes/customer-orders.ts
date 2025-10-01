import express from 'express';
import * as customerOrderController from '../controllers/customerOrderController';
import * as orderExportController from '../controllers/orderExportController';

const router = express.Router();

/**
 * @route GET /api/customer-orders
 * @desc Get all customer orders with optional filtering
 * @access Public
 */
router.get('/', customerOrderController.getOrders);

/**
 * @route GET /api/customer-orders/:id
 * @desc Get order by ID
 * @access Public
 */
router.get('/:id', customerOrderController.getOrderById);

/**
 * @route GET /api/customer-orders/:id/inventory-check
 * @desc Check inventory availability for an order
 * @access Public
 */
router.get('/:id/inventory-check', customerOrderController.checkInventory);

/**
 * @route POST /api/customer-orders
 * @desc Create a new customer order
 * @access Public
 */
router.post('/', customerOrderController.createOrder);

/**
 * @route PUT /api/customer-orders/:id
 * @desc Update a customer order
 * @access Public
 */
router.put('/:id', customerOrderController.updateOrder);

/**
 * @route DELETE /api/customer-orders/:id
 * @desc Delete a customer order (DRAFT only)
 * @access Public
 */
router.delete('/:id', customerOrderController.deleteOrder);

/**
 * @route POST /api/customer-orders/:id/confirm
 * @desc Confirm order (DRAFT → CONFIRMED, reserves inventory)
 * @access Public
 */
router.post('/:id/confirm', customerOrderController.confirmOrder);

/**
 * @route POST /api/customer-orders/:id/revert-draft
 * @desc Revert order to draft (CONFIRMED → DRAFT, releases inventory)
 * @access Public
 */
router.post('/:id/revert-draft', customerOrderController.revertToDraft);

/**
 * @route POST /api/customer-orders/:id/fulfill
 * @desc Fulfill order (CONFIRMED → FULFILLED, consumes inventory)
 * @access Public
 */
router.post('/:id/fulfill', customerOrderController.fulfillOrder);

/**
 * @route GET /api/customer-orders/:id/export/pdf
 * @desc Export single order as PDF
 * @access Public
 */
router.get('/:id/export/pdf', orderExportController.exportOrderPDF);

/**
 * @route GET /api/customer-orders/:id/export/excel
 * @desc Export single order as Excel
 * @access Public
 */
router.get('/:id/export/excel', orderExportController.exportOrderExcel);

/**
 * @route POST /api/customer-orders/export/excel
 * @desc Export multiple orders as Excel with filters
 * @access Public
 */
router.post('/export/excel', orderExportController.exportBulkExcel);

export default router;
