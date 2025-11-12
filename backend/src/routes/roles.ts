import express from 'express';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
} from '../controllers/roleController';
import { requirePermission } from '../middleware/permissions';

const router = express.Router();

/**
 * @route GET /api/roles
 * @desc Get all roles in current client
 * @access Private (requires roles:view permission)
 */
router.get('/', requirePermission('roles', 'view'), getAllRoles);

/**
 * @route GET /api/roles/:id
 * @desc Get role by ID
 * @access Private (requires roles:view permission)
 */
router.get('/:id', requirePermission('roles', 'view'), getRoleById);

/**
 * @route POST /api/roles
 * @desc Create a new role
 * @access Private (requires roles:create permission)
 */
router.post('/', requirePermission('roles', 'create'), createRole);

/**
 * @route PUT /api/roles/:id
 * @desc Update a role
 * @access Private (requires roles:edit permission)
 */
router.put('/:id', requirePermission('roles', 'edit'), updateRole);

/**
 * @route DELETE /api/roles/:id
 * @desc Delete a role
 * @access Private (requires roles:delete permission)
 */
router.delete('/:id', requirePermission('roles', 'delete'), deleteRole);

export default router;
