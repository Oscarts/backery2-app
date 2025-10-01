import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check if there's sufficient inventory for an order
 */
export const checkInventoryAvailability = async (orderId: string) => {
  const order = await prisma.customerOrder.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const insufficientProducts: Array<{
    productId: string;
    productName: string;
    required: number;
    available: number;
    shortage: number;
  }> = [];

  for (const item of order.items) {
    const product = await prisma.finishedProduct.findUnique({
      where: { id: item.productId },
    });

    if (!product) {
      insufficientProducts.push({
        productId: item.productId,
        productName: item.productName,
        required: item.quantity,
        available: 0,
        shortage: item.quantity,
      });
      continue;
    }

    const available = product.quantity - product.reservedQuantity;
    if (available < item.quantity) {
      insufficientProducts.push({
        productId: item.productId,
        productName: item.productName,
        required: item.quantity,
        available,
        shortage: item.quantity - available,
      });
    }
  }

  return {
    canFulfill: insufficientProducts.length === 0,
    insufficientProducts,
  };
};

/**
 * Reserve inventory for a confirmed order
 * Uses transaction to ensure atomicity
 */
export const reserveInventory = async (orderId: string) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.customerOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'DRAFT') {
      throw new Error('Can only reserve inventory for DRAFT orders');
    }

    // Check availability first
    for (const item of order.items) {
      const product = await tx.finishedProduct.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product ${item.productName} not found`);
      }

      const available = product.quantity - product.reservedQuantity;
      if (available < item.quantity) {
        throw new Error(
          `Insufficient inventory for ${item.productName}. Available: ${available}, Required: ${item.quantity}`
        );
      }
    }

    // Reserve inventory
    for (const item of order.items) {
      await tx.finishedProduct.update({
        where: { id: item.productId },
        data: {
          reservedQuantity: {
            increment: item.quantity,
          },
        },
      });
    }

    // Update order status
    await tx.customerOrder.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });

    return { success: true, message: 'Inventory reserved successfully' };
  });
};

/**
 * Release inventory reservations (when reverting to DRAFT)
 * Uses transaction to ensure atomicity
 */
export const releaseInventory = async (orderId: string) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.customerOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'CONFIRMED') {
      throw new Error('Can only release inventory for CONFIRMED orders');
    }

    // Release inventory
    for (const item of order.items) {
      const product = await tx.finishedProduct.findUnique({
        where: { id: item.productId },
      });

      if (product) {
        await tx.finishedProduct.update({
          where: { id: item.productId },
          data: {
            reservedQuantity: {
              decrement: Math.min(item.quantity, product.reservedQuantity),
            },
          },
        });
      }
    }

    // Update order status
    await tx.customerOrder.update({
      where: { id: orderId },
      data: { status: 'DRAFT' },
    });

    return { success: true, message: 'Inventory released successfully' };
  });
};

/**
 * Consume inventory for a fulfilled order
 * Decrements both quantity and reservedQuantity
 * Uses transaction to ensure atomicity
 */
export const consumeInventory = async (orderId: string) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.customerOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'CONFIRMED') {
      throw new Error('Can only fulfill CONFIRMED orders');
    }

    // Consume inventory
    for (const item of order.items) {
      const product = await tx.finishedProduct.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product ${item.productName} not found`);
      }

      // Ensure we don't go negative
      const actualQuantity = Math.min(item.quantity, product.quantity);
      const actualReserved = Math.min(item.quantity, product.reservedQuantity);

      await tx.finishedProduct.update({
        where: { id: item.productId },
        data: {
          quantity: {
            decrement: actualQuantity,
          },
          reservedQuantity: {
            decrement: actualReserved,
          },
        },
      });
    }

    // Update order status
    await tx.customerOrder.update({
      where: { id: orderId },
      data: { status: 'FULFILLED' },
    });

    return { success: true, message: 'Order fulfilled successfully' };
  });
};
