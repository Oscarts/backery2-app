import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Helper function to check if user is a super admin (from system client)
 */
const isSuperAdmin = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { client: true },
  });
  return user?.client.slug === 'system';
};

/**
 * GET /api/users
 * Get all users in the current client (or all users for super admin)
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        clientId: req.user!.clientId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        customRole: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 * Get a specific user by ID
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if current user is super admin
    const userIsSuperAdmin = await isSuperAdmin(req.user!.id);

    // Build where clause based on permissions
    const whereClause: any = { id };
    if (!userIsSuperAdmin) {
      // Regular users can only view users in their own client
      whereClause.clientId = req.user!.clientId;
    }

    const user = await prisma.user.findFirst({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        customRole: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 * Create a new user
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, firstName, lastName, roleId, isActive = true } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !roleId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, password, firstName, lastName, roleId',
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already in use',
      });
    }

    // Check if user is from System client (Super Admin)
    const systemClient = await prisma.client.findUnique({
      where: { slug: 'system' },
    });

    const isSuperAdmin = systemClient && req.user!.clientId === systemClient.id;

    // Verify role exists and belongs to the same client (or any client if Super Admin)
    const role = await prisma.role.findFirst({
      where: isSuperAdmin
        ? { id: roleId } // Super Admin can use any role
        : {
          id: roleId,
          clientId: req.user!.clientId, // Regular users only their client's roles
        },
    });

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role ID',
      });
    }

    // Check user limit for the client
    // For Super Admin, use the role's client; for regular users, use their own client
    const targetClientId = isSuperAdmin ? role.clientId : req.user!.clientId;

    const client = await prisma.client.findUnique({
      where: { id: targetClientId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!client) {
      return res.status(400).json({
        success: false,
        error: 'Client not found',
      });
    }

    // Enforce maxUsers limit (skip for System client)
    if (client.slug !== 'system' && client._count.users >= client.maxUsers) {
      return res.status(403).json({
        success: false,
        error: `User limit reached. Your plan allows ${client.maxUsers} users. Please upgrade your subscription to add more users.`,
        currentUsers: client._count.users,
        maxUsers: client.maxUsers,
        plan: client.subscriptionPlan,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in the target client
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        firstName,
        lastName,
        roleId,
        clientId: targetClientId,
        isActive,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        customRole: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id
 * Update a user
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { email, password, firstName, lastName, roleId, isActive } = req.body;

    // Check if current user is super admin
    const userIsSuperAdmin = await isSuperAdmin(req.user!.id);

    // Build where clause based on permissions
    const whereClause: any = { id };
    if (!userIsSuperAdmin) {
      // Regular users can only update users in their own client
      whereClause.clientId = req.user!.clientId;
    }

    // Check if user exists (and belongs to same client if not super admin)
    const existingUser = await prisma.user.findFirst({
      where: whereClause,
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // If email is being changed, check it's not taken
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (emailTaken) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use',
        });
      }
    }

    // If role is being changed, verify it exists and belongs to same client (or any if Super Admin)
    if (roleId) {
      // Check if user is from System client (Super Admin)
      const systemClient = await prisma.client.findUnique({
        where: { slug: 'system' },
      });

      const isSuperAdmin = systemClient && req.user!.clientId === systemClient.id;

      const role = await prisma.role.findFirst({
        where: isSuperAdmin
          ? { id: roleId } // Super Admin can use any role
          : {
            id: roleId,
            clientId: req.user!.clientId, // Regular users only their client's roles
          },
      });

      if (!role) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role ID',
        });
      }
    }

    // Build update data
    const updateData: any = {};
    if (email) updateData.email = email.toLowerCase();
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (roleId) updateData.roleId = roleId;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        customRole: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id
 * Delete a user
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if current user is super admin
    const userIsSuperAdmin = await isSuperAdmin(req.user!.id);

    // Build where clause based on permissions
    const whereClause: any = { id };
    if (!userIsSuperAdmin) {
      // Regular users can only delete users in their own client
      whereClause.clientId = req.user!.clientId;
    }

    // Check if user exists (and belongs to same client if not super admin)
    const user = await prisma.user.findFirst({
      where: whereClause,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Prevent deleting yourself
    if (user.id === req.user!.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
