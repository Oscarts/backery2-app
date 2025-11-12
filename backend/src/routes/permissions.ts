import express from 'express';
import { getAllPermissions } from '../controllers/roleController';
import { requirePermission } from '../middleware/permissions';

const router = express.Router();

/**
 * @route GET /api/permissions
 * @desc Get all available permissions
 * @access Private (requires roles:view permission)
 */
router.get('/', requirePermission('roles', 'view'), getAllPermissions);

export default router;
