import { PrismaClient } from '@prisma/client';
import {
  checkInventoryAvailability,
  reserveInventory,
  releaseInventory,
  consumeInventory,
} from '../src/services/inventoryReservationService';
import {
  cleanupTestData,
  createTestCustomer,
  createTestProduct,
  createTestOrder,
  disconnectPrisma,
  getPrismaClient,
} from './helpers/testHelpers';

const prisma = getPrismaClient();

describe('Inventory Reservation Service', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  describe('checkInventoryAvailability', () => {
    it('should return canFulfill true when sufficient inventory exists', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 0 });

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 50,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 250.0,
          linePrice: 350.0,
        },
      ]);

      const result = await checkInventoryAvailability(order.id);

      expect(result.canFulfill).toBe(true);
      expect(result.insufficientProducts).toEqual([]);
    });

    it('should return canFulfill false when insufficient inventory', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 30, reservedQuantity: 0 });

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 50,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 250.0,
          linePrice: 350.0,
        },
      ]);

      const result = await checkInventoryAvailability(order.id);

      expect(result.canFulfill).toBe(false);
      expect(result.insufficientProducts).toHaveLength(1);
      expect(result.insufficientProducts[0]).toMatchObject({
        productId: product.id,
        productName: product.name,
        required: 50,
        available: 30,
        shortage: 20,
      });
    });

    it('should account for reserved inventory when checking availability', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 80 });

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 25,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 125.0,
          linePrice: 175.0,
        },
      ]);

      const result = await checkInventoryAvailability(order.id);

      expect(result.canFulfill).toBe(false);
      expect(result.insufficientProducts[0].available).toBe(20); // 100 - 80
    });

    it('should check all items in multi-item order', async () => {
      const customer = await createTestCustomer();
      const product1 = await createTestProduct({ quantity: 100, reservedQuantity: 0 });
      const product2 = await createTestProduct({ quantity: 10, reservedQuantity: 0 });

      const order = await createTestOrder(customer.id, [
        {
          productId: product1.id,
          productName: product1.name,
          quantity: 50,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 250.0,
          linePrice: 350.0,
        },
        {
          productId: product2.id,
          productName: product2.name,
          quantity: 20,
          unitProductionCost: 10.0,
          unitPrice: 13.0,
          lineProductionCost: 200.0,
          linePrice: 260.0,
        },
      ]);

      const result = await checkInventoryAvailability(order.id);

      expect(result.canFulfill).toBe(false);
      expect(result.insufficientProducts).toHaveLength(1);
      expect(result.insufficientProducts[0].productId).toBe(product2.id);
    });

    it('should handle missing product gracefully', async () => {
      const customer = await createTestCustomer();
      
      const order = await createTestOrder(customer.id, [
        {
          productId: 'non-existent-id',
          productName: 'Non-existent Product',
          quantity: 10,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 50.0,
          linePrice: 70.0,
        },
      ]);

      const result = await checkInventoryAvailability(order.id);

      expect(result.canFulfill).toBe(false);
      expect(result.insufficientProducts).toHaveLength(1);
      expect(result.insufficientProducts[0]).toMatchObject({
        productId: 'non-existent-id',
        available: 0,
        shortage: 10,
      });
    });

    it('should throw error if order not found', async () => {
      await expect(checkInventoryAvailability('non-existent-order')).rejects.toThrow(
        'Order not found'
      );
    });
  });

  describe('reserveInventory', () => {
    it('should reserve inventory and update order status to CONFIRMED', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 0 });

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 30,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 150.0,
          linePrice: 210.0,
        },
      ]);

      const result = await reserveInventory(order.id);

      expect(result.success).toBe(true);
      expect(result.message).toContain('reserved');

      // Check product inventory
      const updatedProduct = await prisma.finishedProduct.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.quantity).toBe(100); // Unchanged
      expect(updatedProduct?.reservedQuantity).toBe(30); // Increased

      // Check order status
      const updatedOrder = await prisma.customerOrder.findUnique({
        where: { id: order.id },
      });
      expect(updatedOrder?.status).toBe('CONFIRMED');
    });

    it('should reserve inventory for multiple items', async () => {
      const customer = await createTestCustomer();
      const product1 = await createTestProduct({ quantity: 100, reservedQuantity: 10 });
      const product2 = await createTestProduct({ quantity: 50, reservedQuantity: 5 });

      const order = await createTestOrder(customer.id, [
        {
          productId: product1.id,
          productName: product1.name,
          quantity: 20,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 100.0,
          linePrice: 140.0,
        },
        {
          productId: product2.id,
          productName: product2.name,
          quantity: 15,
          unitProductionCost: 10.0,
          unitPrice: 13.0,
          lineProductionCost: 150.0,
          linePrice: 195.0,
        },
      ]);

      const result = await reserveInventory(order.id);

      expect(result.success).toBe(true);

      const updatedProduct1 = await prisma.finishedProduct.findUnique({
        where: { id: product1.id },
      });
      expect(updatedProduct1?.reservedQuantity).toBe(30); // 10 + 20

      const updatedProduct2 = await prisma.finishedProduct.findUnique({
        where: { id: product2.id },
      });
      expect(updatedProduct2?.reservedQuantity).toBe(20); // 5 + 15
    });

    it('should throw error if insufficient inventory', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 20, reservedQuantity: 0 });

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 30,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 150.0,
          linePrice: 210.0,
        },
      ]);

      await expect(reserveInventory(order.id)).rejects.toThrow('Insufficient inventory');
    });

    it('should throw error if product not found', async () => {
      const customer = await createTestCustomer();

      const order = await createTestOrder(customer.id, [
        {
          productId: 'non-existent-product',
          productName: 'Missing Product',
          quantity: 10,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 50.0,
          linePrice: 70.0,
        },
      ]);

      await expect(reserveInventory(order.id)).rejects.toThrow('not found');
    });

    it('should throw error if order not in DRAFT status', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 0 });

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product.id,
            productName: product.name,
            quantity: 10,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 50.0,
            linePrice: 70.0,
          },
        ],
        { status: 'CONFIRMED' }
      );

      await expect(reserveInventory(order.id)).rejects.toThrow('DRAFT orders');
    });

    it('should rollback transaction if any item fails', async () => {
      const customer = await createTestCustomer();
      const product1 = await createTestProduct({ quantity: 100, reservedQuantity: 0 });
      const product2 = await createTestProduct({ quantity: 5, reservedQuantity: 0 });

      const order = await createTestOrder(customer.id, [
        {
          productId: product1.id,
          productName: product1.name,
          quantity: 20,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 100.0,
          linePrice: 140.0,
        },
        {
          productId: product2.id,
          productName: product2.name,
          quantity: 10, // Insufficient
          unitProductionCost: 10.0,
          unitPrice: 13.0,
          lineProductionCost: 100.0,
          linePrice: 130.0,
        },
      ]);

      await expect(reserveInventory(order.id)).rejects.toThrow();

      // Verify NO inventory was reserved (transaction rolled back)
      const product1AfterError = await prisma.finishedProduct.findUnique({
        where: { id: product1.id },
      });
      expect(product1AfterError?.reservedQuantity).toBe(0);

      // Verify order status unchanged
      const orderAfterError = await prisma.customerOrder.findUnique({
        where: { id: order.id },
      });
      expect(orderAfterError?.status).toBe('DRAFT');
    });
  });

  describe('releaseInventory', () => {
    it('should release reserved inventory and update order to DRAFT', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 30 });

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product.id,
            productName: product.name,
            quantity: 30,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 150.0,
            linePrice: 210.0,
          },
        ],
        { status: 'CONFIRMED' }
      );

      const result = await releaseInventory(order.id);

      expect(result.success).toBe(true);
      expect(result.message).toContain('released');

      // Check product inventory
      const updatedProduct = await prisma.finishedProduct.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.quantity).toBe(100); // Unchanged
      expect(updatedProduct?.reservedQuantity).toBe(0); // Decreased by 30

      // Check order status
      const updatedOrder = await prisma.customerOrder.findUnique({
        where: { id: order.id },
      });
      expect(updatedOrder?.status).toBe('DRAFT');
    });

    it('should release inventory for multiple items', async () => {
      const customer = await createTestCustomer();
      const product1 = await createTestProduct({ quantity: 100, reservedQuantity: 25 });
      const product2 = await createTestProduct({ quantity: 50, reservedQuantity: 15 });

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product1.id,
            productName: product1.name,
            quantity: 25,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 125.0,
            linePrice: 175.0,
          },
          {
            productId: product2.id,
            productName: product2.name,
            quantity: 15,
            unitProductionCost: 10.0,
            unitPrice: 13.0,
            lineProductionCost: 150.0,
            linePrice: 195.0,
          },
        ],
        { status: 'CONFIRMED' }
      );

      const result = await releaseInventory(order.id);

      expect(result.success).toBe(true);

      const updatedProduct1 = await prisma.finishedProduct.findUnique({
        where: { id: product1.id },
      });
      expect(updatedProduct1?.reservedQuantity).toBe(0); // 25 - 25

      const updatedProduct2 = await prisma.finishedProduct.findUnique({
        where: { id: product2.id },
      });
      expect(updatedProduct2?.reservedQuantity).toBe(0); // 15 - 15
    });

    it('should throw error if order not in CONFIRMED status', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 0 });

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product.id,
            productName: product.name,
            quantity: 10,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 50.0,
            linePrice: 70.0,
          },
        ],
        { status: 'DRAFT' }
      );

      await expect(releaseInventory(order.id)).rejects.toThrow('CONFIRMED orders');
    });

    it('should handle missing product gracefully', async () => {
      const customer = await createTestCustomer();

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: 'non-existent-product',
            productName: 'Missing Product',
            quantity: 10,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 50.0,
            linePrice: 70.0,
          },
        ],
        { status: 'CONFIRMED' }
      );

      // Should not throw - service handles missing products
      const result = await releaseInventory(order.id);
      expect(result.success).toBe(true);
    });

    it('should not allow negative reserved quantity', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 5 });

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product.id,
            productName: product.name,
            quantity: 10, // More than currently reserved
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 50.0,
            linePrice: 70.0,
          },
        ],
        { status: 'CONFIRMED' }
      );

      const result = await releaseInventory(order.id);

      expect(result.success).toBe(true);

      const updatedProduct = await prisma.finishedProduct.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.reservedQuantity).toBe(0); // Should be 0, not negative
    });
  });

  describe('consumeInventory', () => {
    it('should consume inventory and update order to FULFILLED', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 20 });

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product.id,
            productName: product.name,
            quantity: 20,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 100.0,
            linePrice: 140.0,
          },
        ],
        { status: 'CONFIRMED' }
      );

      const result = await consumeInventory(order.id);

      expect(result.success).toBe(true);
      expect(result.message).toContain('fulfilled');

      // Check product inventory
      const updatedProduct = await prisma.finishedProduct.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.quantity).toBe(80); // 100 - 20
      expect(updatedProduct?.reservedQuantity).toBe(0); // 20 - 20

      // Check order status
      const updatedOrder = await prisma.customerOrder.findUnique({
        where: { id: order.id },
      });
      expect(updatedOrder?.status).toBe('FULFILLED');
    });

    it('should consume inventory for multiple items', async () => {
      const customer = await createTestCustomer();
      const product1 = await createTestProduct({ quantity: 100, reservedQuantity: 30 });
      const product2 = await createTestProduct({ quantity: 50, reservedQuantity: 10 });

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product1.id,
            productName: product1.name,
            quantity: 30,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 150.0,
            linePrice: 210.0,
          },
          {
            productId: product2.id,
            productName: product2.name,
            quantity: 10,
            unitProductionCost: 10.0,
            unitPrice: 13.0,
            lineProductionCost: 100.0,
            linePrice: 130.0,
          },
        ],
        { status: 'CONFIRMED' }
      );

      const result = await consumeInventory(order.id);

      expect(result.success).toBe(true);

      const updatedProduct1 = await prisma.finishedProduct.findUnique({
        where: { id: product1.id },
      });
      expect(updatedProduct1?.quantity).toBe(70); // 100 - 30
      expect(updatedProduct1?.reservedQuantity).toBe(0); // 30 - 30

      const updatedProduct2 = await prisma.finishedProduct.findUnique({
        where: { id: product2.id },
      });
      expect(updatedProduct2?.quantity).toBe(40); // 50 - 10
      expect(updatedProduct2?.reservedQuantity).toBe(0); // 10 - 10
    });

    it('should throw error if product not found', async () => {
      const customer = await createTestCustomer();

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: 'non-existent-product',
            productName: 'Missing Product',
            quantity: 10,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 50.0,
            linePrice: 70.0,
          },
        ],
        { status: 'CONFIRMED' }
      );

      await expect(consumeInventory(order.id)).rejects.toThrow('not found');
    });

    it('should throw error if order not in CONFIRMED status', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 0 });

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product.id,
            productName: product.name,
            quantity: 10,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 50.0,
            linePrice: 70.0,
          },
        ],
        { status: 'DRAFT' }
      );

      await expect(consumeInventory(order.id)).rejects.toThrow('CONFIRMED orders');
    });

    it('should not allow negative quantities', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 5, reservedQuantity: 3 });

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product.id,
            productName: product.name,
            quantity: 10, // More than available
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 50.0,
            linePrice: 70.0,
          },
        ],
        { status: 'CONFIRMED' }
      );

      const result = await consumeInventory(order.id);

      expect(result.success).toBe(true);

      const updatedProduct = await prisma.finishedProduct.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.quantity).toBe(0); // 5 - 5 (max available)
      expect(updatedProduct?.reservedQuantity).toBe(0); // 3 - 3 (max reserved)
    });

    it('should rollback transaction if any item fails', async () => {
      const customer = await createTestCustomer();
      const product1 = await createTestProduct({ quantity: 100, reservedQuantity: 20 });

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product1.id,
            productName: product1.name,
            quantity: 20,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 100.0,
            linePrice: 140.0,
          },
          {
            productId: 'non-existent-product',
            productName: 'Missing Product',
            quantity: 10,
            unitProductionCost: 10.0,
            unitPrice: 13.0,
            lineProductionCost: 100.0,
            linePrice: 130.0,
          },
        ],
        { status: 'CONFIRMED' }
      );

      await expect(consumeInventory(order.id)).rejects.toThrow();

      // Verify NO inventory was consumed (transaction rolled back)
      const product1AfterError = await prisma.finishedProduct.findUnique({
        where: { id: product1.id },
      });
      expect(product1AfterError?.quantity).toBe(100);
      expect(product1AfterError?.reservedQuantity).toBe(20);

      // Verify order status unchanged
      const orderAfterError = await prisma.customerOrder.findUnique({
        where: { id: order.id },
      });
      expect(orderAfterError?.status).toBe('CONFIRMED');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent reservations correctly', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 0 });

      const order1 = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 60,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 300.0,
          linePrice: 420.0,
        },
      ]);

      const order2 = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 60,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 300.0,
          linePrice: 420.0,
        },
      ]);

      // First reservation should succeed
      await reserveInventory(order1.id);

      // Second reservation should fail (insufficient remaining inventory)
      await expect(reserveInventory(order2.id)).rejects.toThrow('Insufficient inventory');

      // Verify only first order was reserved
      const finalProduct = await prisma.finishedProduct.findUnique({
        where: { id: product.id },
      });
      expect(finalProduct?.reservedQuantity).toBe(60);
    });
  });
});
