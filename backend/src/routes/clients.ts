import express from 'express';
import {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  createAdminUser,
} from '../controllers/clientController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = express.Router();

/**
 * Super Admin Client Management Routes
 * All routes require authentication and super admin privileges
 */

// Get all clients
router.get('/', authenticate, requirePermission('clients', 'view'), getAllClients);

// Get client by ID
router.get('/:id', authenticate, requirePermission('clients', 'view'), getClientById);

// Create new client
router.post('/', authenticate, requirePermission('clients', 'create'), createClient);

// Update client
router.put('/:id', authenticate, requirePermission('clients', 'edit'), updateClient);

// Delete client
router.delete('/:id', authenticate, requirePermission('clients', 'delete'), deleteClient);

export default router;
