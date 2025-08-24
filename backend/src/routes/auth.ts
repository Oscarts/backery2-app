import { Router } from 'express';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - to be implemented' });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint - to be implemented' });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout endpoint - to be implemented' });
});

// POST /api/auth/refresh-token
router.post('/refresh-token', (req, res) => {
  res.json({ message: 'Refresh token endpoint - to be implemented' });
});

export default router;
