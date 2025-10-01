import express from 'express';
import * as customerController from '../controllers/customerController';

const router = express.Router();

/**
 * @route GET /api/customers
 * @desc Get all customers with optional search
 * @access Public
 */
router.get('/', customerController.getCustomers);

/**
 * @route GET /api/customers/:id
 * @desc Get customer by ID
 * @access Public
 */
router.get('/:id', customerController.getCustomerById);

/**
 * @route POST /api/customers
 * @desc Create a new customer
 * @access Public
 */
router.post('/', customerController.createCustomer);

/**
 * @route PUT /api/customers/:id
 * @desc Update a customer
 * @access Public
 */
router.put('/:id', customerController.updateCustomer);

/**
 * @route DELETE /api/customers/:id
 * @desc Delete a customer (only if no orders)
 * @access Public
 */
router.delete('/:id', customerController.deleteCustomer);

export default router;
