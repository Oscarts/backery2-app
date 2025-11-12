import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extended user information in the request
export interface AuthUser {
  id: string;
  email: string;
  clientId: string;
  roleId: string | null;
  role: string; // Legacy: ADMIN, STAFF, CUSTOM
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  clientId: string;
  roleId: string | null;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token with user and client information
 */
export const generateToken = (user: AuthUser): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    clientId: user.clientId,
    roleId: user.roleId,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as string });
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

/**
 * Authentication middleware
 * Extracts and verifies JWT token, attaches user info to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No authentication token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token);

      // Attach user info to request
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        clientId: decoded.clientId,
        roleId: decoded.roleId,
        role: decoded.role,
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token expired',
        });
      } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication middleware
 * Tries to authenticate but continues even if no token is provided
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = verifyToken(token);

        req.user = {
          id: decoded.userId,
          email: decoded.email,
          clientId: decoded.clientId,
          roleId: decoded.roleId,
          role: decoded.role,
        };
      } catch (error) {
        // Silently fail for optional auth
      }
    }

    next();
  } catch (error) {
    next(); // Continue even if there's an error
  }
};
