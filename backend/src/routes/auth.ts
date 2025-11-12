import { Router } from 'express';
import { login, register, getProfile, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', authenticate, getProfile);

// User management route (requires permission)
router.post('/register', authenticate, requirePermission('users', 'create'), register);

export default router;
