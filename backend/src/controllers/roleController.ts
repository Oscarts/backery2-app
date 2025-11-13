import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/roles
 * Get all roles in the current client (or all clients if Super Admin)
 */
export const getAllRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if user is from System client (Super Admin)
    const systemClient = await prisma.client.findUnique({
      where: { slug: 'system' },
    });

    const isSuperAdmin = systemClient && req.user!.clientId === systemClient.id;

    // If Super Admin, get ALL roles from ALL clients
    // Otherwise, get only roles from the user's client
    const roles = await prisma.role.findMany({
      where: isSuperAdmin ? {} : {
        clientId: req.user!.clientId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: [
        { client: { name: 'asc' } },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/roles/:id
 * Get a specific role by ID
 */
export const getRoleById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if user is from System client (Super Admin)
    const systemClient = await prisma.client.findUnique({
      where: { slug: 'system' },
    });

    const isSuperAdmin = systemClient && req.user!.clientId === systemClient.id;

    const role = await prisma.role.findFirst({
      where: isSuperAdmin
        ? { id } // Super Admin can access any role
        : {
            id,
            clientId: req.user!.clientId, // Regular users only their client's roles
          },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/roles
 * Create a new role
 */
export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, permissionIds } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Role name is required',
      });
    }

    // Check if role name already exists for this client
    const existingRole = await prisma.role.findFirst({
      where: {
        name,
        clientId: req.user!.clientId,
      },
    });

    if (existingRole) {
      return res.status(400).json({
        success: false,
        error: 'Role name already exists',
      });
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name,
        description,
        clientId: req.user!.clientId,
        permissions: permissionIds
          ? {
              create: permissionIds.map((permissionId: string) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/roles/:id
 * Update a role
 */
export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description, permissionIds } = req.body;

    // Check if user is from System client (Super Admin)
    const systemClient = await prisma.client.findUnique({
      where: { slug: 'system' },
    });

    const isSuperAdmin = systemClient && req.user!.clientId === systemClient.id;

    // Check if role exists and belongs to same client (or any client if Super Admin)
    const existingRole = await prisma.role.findFirst({
      where: isSuperAdmin
        ? { id } // Super Admin can update any role
        : {
            id,
            clientId: req.user!.clientId, // Regular users only their client's roles
          },
    });

    if (!existingRole) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    // Prevent modifying Super Admin role
    if (existingRole.name === 'Super Admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify Super Admin role',
      });
    }

    // Only Super Admin can modify template roles (isSystem roles in System client)
    if (existingRole.isSystem && !isSuperAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Only Super Admin can modify template roles',
      });
    }

    // If name is being changed, check it's not taken
    if (name && name !== existingRole.name) {
      const nameTaken = await prisma.role.findFirst({
        where: {
          name,
          clientId: req.user!.clientId,
        },
      });

      if (nameTaken) {
        return res.status(400).json({
          success: false,
          error: 'Role name already in use',
        });
      }
    }

    // Update role
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Handle permission updates
    if (permissionIds) {
      // Delete existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Add new permissions
      updateData.permissions = {
        create: permissionIds.map((permissionId: string) => ({
          permissionId,
        })),
      };
    }

    const role = await prisma.role.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/roles/:id
 * Delete a role
 */
export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if user is from System client (Super Admin)
    const systemClient = await prisma.client.findUnique({
      where: { slug: 'system' },
    });

    const isSuperAdmin = systemClient && req.user!.clientId === systemClient.id;

    // Check if role exists and belongs to same client (or any client if Super Admin)
    const role = await prisma.role.findFirst({
      where: isSuperAdmin
        ? { id } // Super Admin can delete any role
        : {
            id,
            clientId: req.user!.clientId, // Regular users only their client's roles
          },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    // Prevent deleting Super Admin role and other critical system roles
    if (role.name === 'Super Admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete Super Admin role',
      });
    }

    // Only Super Admin can delete template roles
    if (role.isSystem && !isSuperAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Only Super Admin can delete template roles',
      });
    }

    // Prevent deleting roles that have users
    if (role._count.users > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete role with ${role._count.users} assigned users`,
      });
    }

    await prisma.role.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/permissions
 * Get all available permissions
 */
export const getAllPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Group permissions by resource
    const groupedPermissions = permissions.reduce((acc: any, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {});

    res.json({
      success: true,
      data: permissions,
      grouped: groupedPermissions,
    });
  } catch (error) {
    next(error);
  }
};
