import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs';
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

    // Structured debug log for login attempts (avoid logging passwords)
    const attemptLog = JSON.stringify({
      event: 'login_attempt',
      email,
      ip: req.ip,
      time: new Date().toISOString(),
    });
    console.log(attemptLog);
    try {
      fs.appendFileSync('/tmp/backery-auth.log', attemptLog + '\n');
    } catch (err) {
      // ignore file write errors in environments where /tmp is not writable
    }

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    // Find user with client and role information
    let user;
    const searchEmail = email.toLowerCase();
    const searchLog = JSON.stringify({ event: 'login_search_email', originalEmail: email, searchEmail, time: new Date().toISOString() });
    console.log(searchLog);
    try { fs.appendFileSync('/tmp/backery-auth.log', searchLog + '\n'); } catch { }

    try {
      user = await prisma.user.findUnique({
        where: { email: searchEmail },
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

      const queryLog = JSON.stringify({ event: 'login_query_result', searchEmail, userFound: !!user, userId: user?.id, time: new Date().toISOString() });
      console.log(queryLog);
      try { fs.appendFileSync('/tmp/backery-auth.log', queryLog + '\n'); } catch { }
    } catch (findErr) {
      const errLog = JSON.stringify({ event: 'login_find_error', email, error: String(findErr), time: new Date().toISOString() });
      console.error(errLog, findErr);
      try { fs.appendFileSync('/tmp/backery-auth.log', errLog + '\n'); } catch { }
      res.status(500).json({ success: false, error: 'Internal server error' });
      return;
    }

    if (!user) {
      console.log('Login failed: user not found for email', email);
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
      return;
    }

    const foundLog = JSON.stringify({
      event: 'login_user_found',
      userId: user.id,
      email: user.email,
      clientId: user.clientId,
      isActive: user.isActive,
    });
    console.log(foundLog);
    try { fs.appendFileSync('/tmp/backery-auth.log', foundLog + '\n'); } catch { }

    // Check if user is active
    if (!user.isActive) {
      console.log('❌ User inactive');
      res.status(401).json({
        success: false,
        error: 'Account is inactive',
      });
      return;
    }

    const activeUserLog = JSON.stringify({ event: 'login_user_active', userId: user.id });
    console.log(activeUserLog);
    try { fs.appendFileSync('/tmp/backery-auth.log', activeUserLog + '\n'); } catch { }

    // Check if client is active
    if (!user.client.isActive) {
      console.log('❌ Client inactive:', user.client.name);
      res.status(401).json({
        success: false,
        error: 'Organization account is inactive',
      });
      return;
    }

    const activeClientLog = JSON.stringify({ event: 'login_client_active', clientId: user.client.id, clientName: user.client.name });
    console.log(activeClientLog);
    try { fs.appendFileSync('/tmp/backery-auth.log', activeClientLog + '\n'); } catch { }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    const pwLog = JSON.stringify({ event: 'login_password_check', userId: user.id, valid: isPasswordValid });
    console.log(pwLog);
    try { fs.appendFileSync('/tmp/backery-auth.log', pwLog + '\n'); } catch { }

    if (!isPasswordValid) {
      console.log('❌ Invalid password');
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
