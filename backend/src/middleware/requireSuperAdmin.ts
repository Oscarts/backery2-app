import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware to require Super Admin role
 * Following CODE_GUIDELINES.md - Only Super Admin can manage global settings
 * 
 * Super Admin characteristics:
 * - roleId exists and points to a role
 * - Role name is "Super Admin"
 * - Role isSystem = true
 * - Belongs to System client (slug: 'system')
 */
export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    if (!user || !user.roleId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Authentication required',
      });
    }

    // Get user's role with client information
    const role = await prisma.role.findUnique({
      where: { id: user.roleId },
      include: {
        client: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: Invalid role',
      });
    }

    // Verify Super Admin role
    // Must have all three conditions:
    // 1. Role name is "Super Admin"
    // 2. Role is marked as system role (isSystem = true)
    // 3. Belongs to System client
    const isSuperAdmin =
      role.name === 'Super Admin' &&
      role.isSystem === true &&
      role.client.slug === 'system';

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: This action requires Super Admin privileges',
        message: 'Only platform administrators can manage global settings',
      });
    }

    // User is Super Admin - proceed
    next();
  } catch (error) {
    console.error('Error in requireSuperAdmin middleware:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
