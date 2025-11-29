import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  checkInventoryAvailability,
  reserveInventory,
  releaseInventory,
  consumeInventory,
} from '../services/inventoryReservationService';

const prisma = new PrismaClient();

/**
 * Generate unique order number
 * Format: ORD-YYYYMM-####
 */
const generateOrderNumber = async (clientId: string): Promise<string> => {
  const today = new Date();
  const prefix = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;

  const lastOrder = await prisma.customerOrder.findFirst({
    where: {
      orderNumber: { startsWith: prefix },
      clientId, // CRITICAL: Filter by tenant for unique numbering
    },
    orderBy: { orderNumber: 'desc' },
  });

  const sequence = lastOrder ? parseInt(lastOrder.orderNumber.split('-')[2]) + 1 : 1;

  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};

/**
 * GET /api/customer-orders
 * Get all customer orders with optional filtering
 */
export const getOrders = async (req: Request, res: Response) => {
  try {
    const { status, customerId, startDate, endDate, search } = req.query;

    const where: any = {
      clientId: req.user!.clientId, // CRITICAL: Filter by tenant
    };

    // Status filter
    if (status) {
      where.status = status;
    }

    // Customer filter
    if (customerId) {
      where.customerId = customerId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.expectedDeliveryDate = {};
      if (startDate) {
        where.expectedDeliveryDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.expectedDeliveryDate.lte = new Date(endDate as string);
      }
    }

    // Search filter (order number or customer name)
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' as const } },
        { customer: { name: { contains: search as string, mode: 'insensitive' as const } } },
      ];
    }

    const orders = await prisma.customerOrder.findMany({
      where,
      include: {
        customer: true,
        items: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      details: error.message,
    });
  }
};

/**
 * GET /api/customer-orders/:id
 * Get a specific order by ID with full details
 */
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.customerOrder.findFirst({
      where: {
        id,
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
      },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
      details: error.message,
    });
  }
};

/**
 * POST /api/customer-orders
 * Create a new customer order
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { customerId, expectedDeliveryDate, priceMarkupPercentage, notes, items } = req.body;

    // Validation
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required',
      });
    }

    if (!expectedDeliveryDate) {
      return res.status(400).json({
        success: false,
        error: 'Expected delivery date is required',
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one order item is required',
      });
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    // Get clientId from authenticated user (required for multi-tenant isolation)  
    const clientId = (req.user as any)?.clientId || (global as any).__currentClientId;

    if (!clientId) {
      console.error('POST /api/customer-orders - No clientId available!');
      return res.status(500).json({
        success: false,
        error: 'Client ID not found in request'
      });
    }

    // Generate order number (tenant-specific)
    const orderNumber = await generateOrderNumber(clientId);

    // Calculate totals and fetch product details
    let totalProductionCost = 0;
    let totalPrice = 0;

    const orderItems = await Promise.all(
      items.map(async (item: any) => {
        // Fetch product details from database (with tenant filtering)
        const product = await prisma.finishedProduct.findFirst({
          where: {
            id: item.productId,
            clientId, // CRITICAL: Filter by tenant
          },
        });

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const unitProductionCost = product.costToProduce || 0;
        const lineProductionCost = unitProductionCost * item.quantity;
        const linePrice = item.unitPrice * item.quantity;
        totalProductionCost += lineProductionCost;
        totalPrice += linePrice;

        return {
          productId: item.productId,
          productName: product.name,
          productSku: product.sku || null,
          quantity: item.quantity,
          unitProductionCost,
          unitPrice: item.unitPrice,
          lineProductionCost,
          linePrice,
        };
      })
    );

    // Create order with items
    const order = await prisma.customerOrder.create({
      data: {
        orderNumber,
        expectedDeliveryDate: new Date(expectedDeliveryDate),
        priceMarkupPercentage: priceMarkupPercentage || 30,
        notes,
        totalProductionCost,
        totalPrice,
        clientId, // Explicitly add clientId for nested creation
        customer: {
          connect: { id: customerId },
        },
        items: {
          create: orderItems,
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    res.json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error.message,
    });
  }
};

/**
 * PUT /api/customer-orders/:id
 * Update a customer order (respects status rules)
 */
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { expectedDeliveryDate, priceMarkupPercentage, notes, totalPrice, items } = req.body;

    // Get existing order (with tenant filtering)
    const existingOrder = await prisma.customerOrder.findFirst({
      where: {
        id,
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
      },
      include: { items: true },
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // FULFILLED orders are immutable
    if (existingOrder.status === 'FULFILLED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify fulfilled orders',
      });
    }

    // CONFIRMED orders can only update price and notes
    if (existingOrder.status === 'CONFIRMED') {
      const order = await prisma.customerOrder.update({
        where: {
          id,
          clientId: req.user!.clientId, // CRITICAL: Filter by tenant
        },
        data: {
          totalPrice: totalPrice !== undefined ? totalPrice : undefined,
          notes: notes !== undefined ? notes : undefined,
        },
        include: {
          customer: true,
          items: true,
        },
      });

      return res.json({
        success: true,
        data: order,
        message: 'Order updated successfully',
      });
    }

    // DRAFT orders can be fully updated
    const updateData: any = {};

    if (expectedDeliveryDate) {
      updateData.expectedDeliveryDate = new Date(expectedDeliveryDate);
    }

    if (priceMarkupPercentage !== undefined) {
      updateData.priceMarkupPercentage = priceMarkupPercentage;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (totalPrice !== undefined) {
      updateData.totalPrice = totalPrice;
    }

    // If items are provided, update them
    if (items && items.length > 0) {
      // Delete existing items and create new ones
      await prisma.orderItem.deleteMany({
        where: { orderId: id },
      });

      let totalProductionCost = 0;
      let calculatedTotalPrice = 0;

      const orderItems = await Promise.all(items.map(async (item: any) => {
        // Fetch product to get production cost if not provided
        let unitProductionCost = item.unitProductionCost;
        let productName = item.productName;
        let productSku = item.productSku;

        if (!unitProductionCost || !productName) {
          const product = await prisma.finishedProduct.findFirst({
            where: {
              id: item.productId,
              clientId: req.user!.clientId, // CRITICAL: Filter by tenant
            },
            select: {
              name: true,
              sku: true,
              costToProduce: true,
            },
          });

          if (product) {
            unitProductionCost = unitProductionCost || product.costToProduce || 0;
            productName = productName || product.name;
            productSku = productSku || product.sku;
          }
        }

        const lineProductionCost = (unitProductionCost || 0) * item.quantity;
        const linePrice = item.unitPrice * item.quantity;
        totalProductionCost += lineProductionCost;
        calculatedTotalPrice += linePrice;

        return {
          productId: item.productId,
          productName: productName || 'Unknown Product',
          productSku: productSku || null,
          quantity: item.quantity,
          unitProductionCost: unitProductionCost || 0,
          unitPrice: item.unitPrice,
          lineProductionCost,
          linePrice,
        };
      }));

      updateData.totalProductionCost = totalProductionCost;
      if (totalPrice === undefined) {
        updateData.totalPrice = calculatedTotalPrice;
      }

      updateData.items = {
        create: orderItems,
      };
    } else {
      // If no items provided but updating other fields, ensure totalProductionCost is set
      if (updateData.totalPrice !== undefined && !updateData.totalProductionCost) {
        updateData.totalProductionCost = 0;
      }
    }

    const order = await prisma.customerOrder.update({
      where: {
        id,
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
      },
      data: updateData,
      include: {
        customer: true,
        items: true,
      },
    });

    res.json({
      success: true,
      data: order,
      message: 'Order updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order',
      details: error.message,
    });
  }
};

/**
 * DELETE /api/customer-orders/:id
 * Delete an order (DRAFT only)
 */
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.customerOrder.findFirst({
      where: {
        id,
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    if (order.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        error: 'Only DRAFT orders can be deleted',
      });
    }

    await prisma.customerOrder.delete({
      where: {
        id,
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
      },
    });

    res.json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete order',
      details: error.message,
    });
  }
};

/**
 * POST /api/customer-orders/:id/confirm
 * Confirm an order (DRAFT → CONFIRMED, reserves inventory)
 */
export const confirmOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await reserveInventory(id);

    const order = await prisma.customerOrder.findFirst({
      where: {
        id,
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
      },
      include: {
        customer: true,
        items: true,
      },
    });

    res.json({
      success: true,
      data: order,
      message: 'Order confirmed and inventory reserved',
    });
  } catch (error: any) {
    console.error('Error confirming order:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to confirm order',
    });
  }
};

/**
 * POST /api/customer-orders/:id/revert-draft
 * Revert order to draft (CONFIRMED → DRAFT, releases inventory)
 */
export const revertToDraft = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await releaseInventory(id);

    const order = await prisma.customerOrder.findFirst({
      where: {
        id,
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
      },
      include: {
        customer: true,
        items: true,
      },
    });

    res.json({
      success: true,
      data: order,
      message: 'Order reverted to draft and inventory released',
    });
  } catch (error: any) {
    console.error('Error reverting order:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to revert order',
    });
  }
};

/**
 * POST /api/customer-orders/:id/fulfill
 * Fulfill an order (CONFIRMED → FULFILLED, consumes inventory)
 */
export const fulfillOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await consumeInventory(id);

    const order = await prisma.customerOrder.findFirst({
      where: {
        id,
        clientId: req.user!.clientId, // CRITICAL: Filter by tenant
      },
      include: {
        customer: true,
        items: true,
      },
    });

    res.json({
      success: true,
      data: order,
      message: 'Order fulfilled successfully',
    });
  } catch (error: any) {
    console.error('Error fulfilling order:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to fulfill order',
    });
  }
};

/**
 * GET /api/customer-orders/:id/inventory-check
 * Check inventory availability for an order
 */
export const checkInventory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await checkInventoryAvailability(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error checking inventory:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check inventory',
    });
  }
};
