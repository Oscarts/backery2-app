import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/customers
 * Get all customers with optional search filtering
 */
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const where = search
      ? {
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
        OR: [
          { name: { contains: search as string, mode: 'insensitive' as const } },
          { email: { contains: search as string, mode: 'insensitive' as const } },
          { phone: { contains: search as string, mode: 'insensitive' as const } },
        ],
      }
      : {
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
      };

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    res.json({
      success: true,
      data: customers
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers',
      details: error.message
    });
  }
};

/**
 * GET /api/customers/:id
 * Get a specific customer by ID with order count
 */
export const getCustomerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
      },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer',
      details: error.message
    });
  }
};

/**
 * POST /api/customers
 * Create a new customer
 */
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, isActive } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required'
      });
    }

    // Check for duplicate email if provided
    if (email) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          email: email.toLowerCase(),
          clientId: req.user!.clientId, // CRITICAL: Filter by tenant
        },
      });

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          error: 'A customer with this email already exists',
        });
      }
    }

    // Get clientId from authenticated user (required for multi-tenant isolation)
    const clientId = (req.user as any)?.clientId || (global as any).__currentClientId;

    if (!clientId) {
      console.error('POST /api/customers - No clientId available!');
      return res.status(500).json({
        success: false,
        error: 'Client ID not found in request'
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email ? email.toLowerCase().trim() : null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        isActive: isActive ?? true,
        clientId, // Explicitly add clientId
      },
    });

    res.json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer',
      details: error.message
    });
  }
};

/**
 * PUT /api/customers/:id
 * Update an existing customer
 */
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, isActive } = req.body;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    // Validation
    if (name && name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Customer name cannot be empty'
      });
    }

    // Check for duplicate email if changed
    if (email && email !== existingCustomer.email) {
      const duplicateEmail = await prisma.customer.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: id },
          clientId: req.user!.clientId, // CRITICAL: Filter by tenant
        },
      });

      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          error: 'A customer with this email already exists',
        });
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        email: email ? email.toLowerCase().trim() : undefined,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        isActive,
      },
    });

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update customer',
      details: error.message
    });
  }
};

/**
 * DELETE /api/customers/:id
 * Delete a customer (only if no orders exist)
 */
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
      },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    // Prevent deletion if customer has orders
    if (customer._count.orders > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete customer with ${customer._count.orders} existing order(s)`,
      });
    }

    await prisma.customer.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer',
      details: error.message
    });
  }
};
