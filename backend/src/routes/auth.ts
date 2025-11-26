import { Router } from 'express';
import { login, register, getProfile, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import normalizeRequest from '../middleware/normalizeRequest';

const router = Router();

// Apply request normalizations to auth routes
router.use(normalizeRequest);

// Debug route: echo request headers and body for login troubleshooting
router.post('/debug/echo-login', (req, res) => {
    res.json({
        headers: req.headers,
        body: req.body,
        contentType: req.get('content-type') || null,
    });
});

// Public routes
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', authenticate, getProfile);

// User management route (requires permission)
router.post('/register', authenticate, requirePermission('users', 'create'), register);

export default router;
