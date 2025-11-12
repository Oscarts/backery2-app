import express from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import { requirePermission } from '../middleware/permissions';

const router = express.Router();

/**
 * @route GET /api/users
 * @desc Get all users in current client
 * @access Private (requires users:view permission)
 */
router.get('/', requirePermission('users', 'view'), getAllUsers);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private (requires users:view permission)
 */
router.get('/:id', requirePermission('users', 'view'), getUserById);

/**
 * @route POST /api/users
 * @desc Create a new user
 * @access Private (requires users:create permission)
 */
router.post('/', requirePermission('users', 'create'), createUser);

/**
 * @route PUT /api/users/:id
 * @desc Update a user
 * @access Private (requires users:edit permission)
 */
router.put('/:id', requirePermission('users', 'edit'), updateUser);

/**
 * @route DELETE /api/users/:id
 * @desc Delete a user
 * @access Private (requires users:delete permission)
 */
router.delete('/:id', requirePermission('users', 'delete'), deleteUser);

export default router;
