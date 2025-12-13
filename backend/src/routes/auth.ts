import { Router } from 'express';
import { login, register, getProfile, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import normalizeRequest from '../middleware/normalizeRequest';
import { authLimiter, signupLimiter } from '../middleware/rateLimiter';

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

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate a user and receive a JWT token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Apply strict rate limiting to login endpoint (5 attempts per 15 min)
router.post('/login', authLimiter, login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout the current user (client-side token invalidation)
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', logout);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the profile of the authenticated user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/profile', authenticate, getProfile);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account (requires users:create permission)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, roleId]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               name:
 *                 type: string
 *               roleId:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
// Apply signup rate limiting (3 signups per hour per IP) + auth required
router.post('/register', signupLimiter, authenticate, requirePermission('users', 'create'), register);

export default router;
