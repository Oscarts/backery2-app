import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../app';
import { Prisma } from '@prisma/client';
import { generateToken, AuthUser } from '../middleware/auth';

/**
 * Login controller
 * Authenticates user and returns JWT token with multi-tenant info
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    // Find user with client and role information
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        client: true,
        customRole: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Account is inactive',
      });
      return;
    }

    // Check if client is active
    if (!user.client.isActive) {
      res.status(401).json({
        success: false,
        error: 'Organization account is inactive',
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      clientId: user.clientId,
      roleId: user.roleId,
    };

    const token = generateToken(authUser);

    // Prepare permissions array
    const permissions = user.customRole?.permissions.map((rp: any) => ({
      resource: rp.permission.resource,
      action: rp.permission.action,
      description: rp.permission.description,
    })) || [];

    // Return user data and token
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          client: {
            id: user.client.id,
            name: user.client.name,
            slug: user.client.slug,
          },
          customRole: user.customRole ? {
            id: user.customRole.id,
            name: user.customRole.name,
            description: user.customRole.description,
          } : null,
          permissions,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

/**
 * Register controller
 * Creates a new user account (requires proper authorization)
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName, clientId, roleId } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        error: 'Email, password, first name, and last name are required',
      });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Email already registered',
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        clientId: clientId || req.user?.clientId, // Use provided or authenticated user's client
        roleId: roleId || null,
        isActive: true,
      },
      include: {
        client: true,
        customRole: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          client: {
            id: user.client.id,
            name: user.client.name,
          },
          customRole: user.customRole ? {
            id: user.customRole.id,
            name: user.customRole.name,
          } : null,
        },
      },
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        client: true,
        customRole: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const permissions = user.customRole?.permissions.map((rp: any) => ({
      resource: rp.permission.resource,
      action: rp.permission.action,
    })) || [];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          client: {
            id: user.client.id,
            name: user.client.name,
            slug: user.client.slug,
          },
          customRole: user.customRole ? {
            id: user.customRole.id,
            name: user.customRole.name,
            description: user.customRole.description,
          } : null,
          permissions,
        },
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    next(error);
  }
};

/**
 * Logout controller (optional - mainly handled on frontend)
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // In a stateless JWT system, logout is mainly handled on the frontend
    // by removing the token from storage. However, we could implement
    // token blacklisting here if needed.

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
