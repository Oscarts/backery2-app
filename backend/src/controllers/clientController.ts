import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedDefaultClientData, ensureCommonUnits } from '../utils/seedDefaultClientData';

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
          include: {
            customRole: {
              select: {
                id: true,
                name: true,
              },
            },
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
      where: { email: adminEmail.toLowerCase() },
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

    // Get System client to access role templates
    const systemClient = await prisma.client.findUnique({
      where: { slug: 'system' },
    });

    if (!systemClient) {
      return res.status(500).json({
        success: false,
        error: 'System client not found',
      });
    }

    // Get all role templates from System client
    const roleTemplates = await prisma.role.findMany({
      where: {
        clientId: systemClient.id,
        isSystem: true,
        name: { not: 'Super Admin' }, // Exclude Super Admin role
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    console.log(`📋 Copying ${roleTemplates.length} role templates to ${client.name}...`);

    // Copy each template role to the new client with all permissions
    let adminRole = null;
    for (const template of roleTemplates) {
      const newRole = await prisma.role.create({
        data: {
          name: template.name,
          description: template.description,
          isSystem: false, // Client roles are not system roles
          clientId: client.id,
          permissions: {
            create: template.permissions.map((rp: any) => ({
              permissionId: rp.permission.id,
            })),
          },
        },
      });

      console.log(`   ✅ Created ${template.name} role with ${template.permissions.length} permissions`);

      // Save Admin role reference for creating admin user
      if (template.name === 'Admin') {
        adminRole = newRole;
      }
    }

    if (!adminRole) {
      return res.status(500).json({
        success: false,
        error: 'Admin role template not found',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail.toLowerCase(),
        passwordHash,
        firstName: adminFirstName,
        lastName: adminLastName,
        roleId: adminRole.id,
        clientId: client.id,
        isActive: true,
      },
    });

    // Ensure common units exist (global, not client-specific)
    await ensureCommonUnits();

    // Seed default data for the new client
    const defaultDataResult = await seedDefaultClientData(client.id);

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
        defaultData: defaultDataResult,
      },
      message: `Client created successfully with default data: ${defaultDataResult.categories} categories, ${defaultDataResult.suppliers} supplier, ${defaultDataResult.storageLocations} storage locations, ${defaultDataResult.qualityStatuses} quality statuses`,
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

/**
 * POST /api/admin/create-admin
 * Create an admin user for a client
 */
export const createAdminUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, firstName, lastName, clientId } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !clientId) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required',
      });
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
      });
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'A user with this email already exists',
      });
    }

    // Find the Admin role for this client
    const adminRole = await prisma.role.findFirst({
      where: {
        clientId,
        name: 'Admin',
      },
    });

    if (!adminRole) {
      return res.status(404).json({
        success: false,
        error: 'Admin role not found for this client',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        clientId,
        roleId: adminRole.id,
        isActive: true,
      },
      include: {
        customRole: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'Admin user created successfully',
    });
  } catch (error) {
    next(error);
  }
};
