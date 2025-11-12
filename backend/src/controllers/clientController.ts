import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * GET /api/admin/clients
 * Get all clients (Super Admin only)
 */
export const getAllClients = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        _count: {
          select: {
            users: true,
            roles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: clients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/clients/:id
 * Get a specific client by ID
 */
export const getClientById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: {
            users: true,
            roles: true,
          },
        },
      },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }

    res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/clients
 * Create a new client with admin user
 */
export const createClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      slug,
      email,
      phone,
      address,
      subscriptionPlan = 'PROFESSIONAL',
      maxUsers = 20,
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName,
    } = req.body;

    // Validate required fields
    if (!name || !slug || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Check if client already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        OR: [{ slug }, { name }],
      },
    });

    if (existingClient) {
      return res.status(400).json({
        success: false,
        error: 'Client with this name or slug already exists',
      });
    }

    // Check if admin email is already used
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already in use',
      });
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        name,
        slug,
        email,
        phone,
        address,
        isActive: true,
        subscriptionPlan: subscriptionPlan as any,
        maxUsers,
        subscriptionStatus: subscriptionPlan === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
        trialEndsAt: subscriptionPlan === 'TRIAL' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : null,
      },
    });

    // Get all permissions
    const permissions = await prisma.permission.findMany();

    // Create Admin role for the client
    const adminRole = await prisma.role.create({
      data: {
        name: 'Admin',
        description: 'Full access to all features',
        isSystem: true,
        clientId: client.id,
        permissions: {
          create: permissions.map((permission: any) => ({
            permissionId: permission.id,
          })),
        },
      },
    });

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        firstName: adminFirstName,
        lastName: adminLastName,
        roleId: adminRole.id,
        clientId: client.id,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        client,
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/clients/:id
 * Update a client
 */
export const updateClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      email,
      phone,
      address,
      subscriptionPlan,
      maxUsers,
      subscriptionStatus,
      isActive,
    } = req.body;

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }

    // Check if name or slug is being changed to an existing one
    if (name || slug) {
      const duplicate = await prisma.client.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(name ? [{ name }] : []),
            ...(slug ? [{ slug }] : []),
          ],
        },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          error: 'Client with this name or slug already exists',
        });
      }
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (subscriptionPlan !== undefined) updateData.subscriptionPlan = subscriptionPlan;
    if (maxUsers !== undefined) updateData.maxUsers = maxUsers;
    if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    // Update client
    const client = await prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            roles: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/clients/:id
 * Delete a client (cascade deletes all related data)
 */
export const deleteClient = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }

    // Prevent deleting System client
    if (client.slug === 'system') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete System client',
      });
    }

    // Delete client (cascade will delete all related data)
    await prisma.client.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
