import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  confirmOrder,
  revertToDraft,
  fulfillOrder,
  checkInventory,
} from '../src/controllers/customerOrderController';
import {
  cleanupTestData,
  createTestCustomer,
  createTestProduct,
  createTestOrder,
  disconnectPrisma,
  getPrismaClient,
} from './helpers/testHelpers';

const prisma = getPrismaClient();

// Create Express app for testing
const app = express();
app.use(express.json());

// Setup routes
app.get('/api/customer-orders', getOrders);
app.get('/api/customer-orders/:id', getOrderById);
app.get('/api/customer-orders/:id/inventory-check', checkInventory);
app.post('/api/customer-orders', createOrder);
app.put('/api/customer-orders/:id', updateOrder);
app.delete('/api/customer-orders/:id', deleteOrder);
app.post('/api/customer-orders/:id/confirm', confirmOrder);
app.post('/api/customer-orders/:id/revert-draft', revertToDraft);
app.post('/api/customer-orders/:id/fulfill', fulfillOrder);

describe('Customer Order API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  describe('GET /api/customer-orders', () => {
    it('should return empty list when no orders exist', async () => {
      const response = await request(app)
        .get('/api/customer-orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return list of orders', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 5,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 25.0,
          linePrice: 35.0,
        },
      ]);

      const response = await request(app)
        .get('/api/customer-orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('orderNumber');
      expect(response.body.data[0]).toHaveProperty('customer');
      expect(response.body.data[0]).toHaveProperty('items');
      expect(response.body.data[0].status).toBe('DRAFT');
    });

    it('should filter orders by status', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const items = [
        {
          productId: product.id,
          productName: product.name,
          quantity: 5,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 25.0,
          linePrice: 35.0,
        },
      ];

      await createTestOrder(customer.id, items, { status: 'DRAFT' });
      await createTestOrder(customer.id, items, { status: 'CONFIRMED' });
      await createTestOrder(customer.id, items, { status: 'FULFILLED' });

      const response = await request(app)
        .get('/api/customer-orders?status=DRAFT')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('DRAFT');
    });

    it('should filter orders by customerId', async () => {
      const customer1 = await createTestCustomer();
      const customer2 = await createTestCustomer();
      const product = await createTestProduct();

      const items = [
        {
          productId: product.id,
          productName: product.name,
          quantity: 5,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 25.0,
          linePrice: 35.0,
        },
      ];

      await createTestOrder(customer1.id, items);
      await createTestOrder(customer2.id, items);
      await createTestOrder(customer2.id, items);

      const response = await request(app)
        .get(`/api/customer-orders?customerId=${customer2.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].customerId).toBe(customer2.id);
      expect(response.body.data[1].customerId).toBe(customer2.id);
    });

    it('should search orders by order number', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const items = [
        {
          productId: product.id,
          productName: product.name,
          quantity: 5,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 25.0,
          linePrice: 35.0,
        },
      ];

      const order = await createTestOrder(customer.id, items);

      const response = await request(app)
        .get(`/api/customer-orders?search=${order.orderNumber}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].orderNumber).toBe(order.orderNumber);
    });

    it('should search orders by customer name', async () => {
      const customer = await createTestCustomer({ name: 'Unique Customer Name' });
      const product = await createTestProduct();

      const items = [
        {
          productId: product.id,
          productName: product.name,
          quantity: 5,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 25.0,
          linePrice: 35.0,
        },
      ];

      await createTestOrder(customer.id, items);

      const response = await request(app)
        .get('/api/customer-orders?search=Unique')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].customer.name).toContain('Unique');
    });

    it('should return orders sorted by createdAt desc', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const items = [
        {
          productId: product.id,
          productName: product.name,
          quantity: 5,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 25.0,
          linePrice: 35.0,
        },
      ];

      const order1 = await createTestOrder(customer.id, items);
      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));
      const order2 = await createTestOrder(customer.id, items);

      const response = await request(app)
        .get('/api/customer-orders')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      // Most recent should be first
      expect(response.body.data[0].id).toBe(order2.id);
      expect(response.body.data[1].id).toBe(order1.id);
    });
  });

  describe('GET /api/customer-orders/:id', () => {
    it('should return order by ID with full details', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 5,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 25.0,
          linePrice: 35.0,
        },
      ]);

      const response = await request(app)
        .get(`/api/customer-orders/${order.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(order.id);
      expect(response.body.data).toHaveProperty('customer');
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should return 404 if order not found', async () => {
      const response = await request(app)
        .get('/api/customer-orders/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });
  });

  describe('POST /api/customer-orders', () => {
    it('should create order with valid data', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const orderData = {
        customerId: customer.id,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priceMarkupPercentage: 30,
        notes: 'Test order',
        items: [
          {
            productId: product.id,
            productName: product.name,
            quantity: 10,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
          },
        ],
      };

      const response = await request(app)
        .post('/api/customer-orders')
        .send(orderData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orderNumber');
      expect(response.body.data.status).toBe('DRAFT');
      expect(response.body.data.customerId).toBe(customer.id);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.message).toBe('Order created successfully');
    });

    it('should return 400 if customerId is missing', async () => {
      const response = await request(app)
        .post('/api/customer-orders')
        .send({
          expectedDeliveryDate: new Date(),
          items: [],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer ID is required');
    });

    it('should return 400 if expectedDeliveryDate is missing', async () => {
      const customer = await createTestCustomer();

      const response = await request(app)
        .post('/api/customer-orders')
        .send({
          customerId: customer.id,
          items: [],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 if items array is empty', async () => {
      const customer = await createTestCustomer();

      const response = await request(app)
        .post('/api/customer-orders')
        .send({
          customerId: customer.id,
          expectedDeliveryDate: new Date(),
          items: [],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should generate unique order number', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const orderData = {
        customerId: customer.id,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [
          {
            productId: product.id,
            productName: product.name,
            quantity: 5,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
          },
        ],
      };

      const response1 = await request(app)
        .post('/api/customer-orders')
        .send(orderData)
        .expect(200);

      const response2 = await request(app)
        .post('/api/customer-orders')
        .send(orderData)
        .expect(200);

      expect(response1.body.data.orderNumber).not.toBe(response2.body.data.orderNumber);
    });

    it('should calculate costs correctly', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const orderData = {
        customerId: customer.id,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priceMarkupPercentage: 30,
        items: [
          {
            productId: product.id,
            productName: product.name,
            quantity: 10,
            unitProductionCost: 5.0,
            unitPrice: 6.5,
          },
        ],
      };

      const response = await request(app)
        .post('/api/customer-orders')
        .send(orderData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalProductionCost).toBe(50.0); // 10 * 5.0
      expect(response.body.data.totalPrice).toBe(65.0); // 10 * 6.5
    });

    it('should handle multiple items in order', async () => {
      const customer = await createTestCustomer();
      const product1 = await createTestProduct();
      const product2 = await createTestProduct();

      const orderData = {
        customerId: customer.id,
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: [
          {
            productId: product1.id,
            productName: product1.name,
            quantity: 5,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
          },
          {
            productId: product2.id,
            productName: product2.name,
            quantity: 3,
            unitProductionCost: 10.0,
            unitPrice: 13.0,
          },
        ],
      };

      const response = await request(app)
        .post('/api/customer-orders')
        .send(orderData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.totalProductionCost).toBe(55.0); // (5*5) + (3*10)
      expect(response.body.data.totalPrice).toBe(74.0); // (5*7) + (3*13)
    });
  });

  describe('PUT /api/customer-orders/:id', () => {
    it('should update DRAFT order with all fields', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 5,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 25.0,
          linePrice: 35.0,
        },
      ]);

      const newDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const response = await request(app)
        .put(`/api/customer-orders/${order.id}`)
        .send({
          expectedDeliveryDate: newDate,
          notes: 'Updated notes',
          totalPrice: 50.0,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toBe('Updated notes');
      expect(response.body.data.totalPrice).toBe(50.0);
      expect(response.body.message).toBe('Order updated successfully');
    });

    it('should return 404 if order not found', async () => {
      const response = await request(app)
        .put('/api/customer-orders/non-existent-id')
        .send({ notes: 'Test' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });

    it('should prevent modification of FULFILLED orders', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product.id,
            productName: product.name,
            quantity: 5,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 25.0,
            linePrice: 35.0,
          },
        ],
        { status: 'FULFILLED' }
      );

      const response = await request(app)
        .put(`/api/customer-orders/${order.id}`)
        .send({ notes: 'Should not update' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot modify fulfilled orders');
    });

    it('should allow limited updates to CONFIRMED orders', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product.id,
            productName: product.name,
            quantity: 5,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 25.0,
            linePrice: 35.0,
          },
        ],
        { status: 'CONFIRMED' }
      );

      const response = await request(app)
        .put(`/api/customer-orders/${order.id}`)
        .send({
          notes: 'Updated notes for confirmed order',
          totalPrice: 100.0,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notes).toBe('Updated notes for confirmed order');
      expect(response.body.data.totalPrice).toBe(100.0);
    });
  });

  describe('DELETE /api/customer-orders/:id', () => {
    it('should delete DRAFT order', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 5,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 25.0,
          linePrice: 35.0,
        },
      ]);

      const response = await request(app)
        .delete(`/api/customer-orders/${order.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Order deleted successfully');

      // Verify order is deleted
      const deleted = await prisma.customerOrder.findUnique({
        where: { id: order.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 if order not found', async () => {
      const response = await request(app)
        .delete('/api/customer-orders/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Order not found');
    });

    it('should prevent deletion of CONFIRMED orders', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product.id,
            productName: product.name,
            quantity: 5,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 25.0,
            linePrice: 35.0,
          },
        ],
        { status: 'CONFIRMED' }
      );

      const response = await request(app)
        .delete(`/api/customer-orders/${order.id}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Only DRAFT orders can be deleted');
    });

    it('should prevent deletion of FULFILLED orders', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product.id,
            productName: product.name,
            quantity: 5,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 25.0,
            linePrice: 35.0,
          },
        ],
        { status: 'FULFILLED' }
      );

      const response = await request(app)
        .delete(`/api/customer-orders/${order.id}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Only DRAFT orders can be deleted');
    });
  });

  describe('POST /api/customer-orders/:id/confirm (Status Transitions)', () => {
    it('should confirm order and reserve inventory', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 0 });

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 10,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 50.0,
          linePrice: 70.0,
        },
      ]);

      const response = await request(app)
        .post(`/api/customer-orders/${order.id}/confirm`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CONFIRMED');
      expect(response.body.message).toContain('confirmed');

      // Verify inventory was reserved
      const updatedProduct = await prisma.finishedProduct.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.reservedQuantity).toBe(10);
    });

    it('should return 400 if insufficient inventory', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 5, reservedQuantity: 0 });

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 10, // More than available
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 50.0,
          linePrice: 70.0,
        },
      ]);

      const response = await request(app)
        .post(`/api/customer-orders/${order.id}/confirm`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Insufficient inventory');
    });
  });

  describe('POST /api/customer-orders/:id/revert-draft', () => {
    it('should revert order to draft and release inventory', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 10 });

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

      const response = await request(app)
        .post(`/api/customer-orders/${order.id}/revert-draft`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('DRAFT');
      expect(response.body.message).toContain('reverted');

      // Verify inventory was released
      const updatedProduct = await prisma.finishedProduct.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.reservedQuantity).toBe(0);
    });
  });

  describe('POST /api/customer-orders/:id/fulfill', () => {
    it('should fulfill order and consume inventory', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 10 });

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

      const response = await request(app)
        .post(`/api/customer-orders/${order.id}/fulfill`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('FULFILLED');
      expect(response.body.message).toContain('fulfilled');

      // Verify inventory was consumed
      const updatedProduct = await prisma.finishedProduct.findUnique({
        where: { id: product.id },
      });
      expect(updatedProduct?.quantity).toBe(90); // 100 - 10
      expect(updatedProduct?.reservedQuantity).toBe(0); // 10 - 10
    });
  });

  describe('GET /api/customer-orders/:id/inventory-check', () => {
    it('should return canFulfill true if sufficient inventory', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 0 });

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 10,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 50.0,
          linePrice: 70.0,
        },
      ]);

      const response = await request(app)
        .get(`/api/customer-orders/${order.id}/inventory-check`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.canFulfill).toBe(true);
      expect(response.body.data.insufficientProducts).toEqual([]);
    });

    it('should return canFulfill false if insufficient inventory', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 5, reservedQuantity: 0 });

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 10,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 50.0,
          linePrice: 70.0,
        },
      ]);

      const response = await request(app)
        .get(`/api/customer-orders/${order.id}/inventory-check`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.canFulfill).toBe(false);
      expect(response.body.data.insufficientProducts).toHaveLength(1);
      expect(response.body.data.insufficientProducts[0]).toMatchObject({
        productId: product.id,
        required: 10,
        available: 5,
        shortage: 5,
      });
    });

    it('should account for reserved inventory', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 95 });

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          quantity: 10,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 50.0,
          linePrice: 70.0,
        },
      ]);

      const response = await request(app)
        .get(`/api/customer-orders/${order.id}/inventory-check`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.canFulfill).toBe(false);
      expect(response.body.data.insufficientProducts[0].available).toBe(5); // 100 - 95
    });
  });

  describe('Order Lifecycle (Integration)', () => {
    it('should complete full order lifecycle: DRAFT → CONFIRMED → FULFILLED', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 0 });

      // 1. Create order (DRAFT)
      const createResponse = await request(app)
        .post('/api/customer-orders')
        .send({
          customerId: customer.id,
          expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          items: [
            {
              productId: product.id,
              productName: product.name,
              quantity: 20,
              unitProductionCost: 5.0,
              unitPrice: 7.0,
            },
          ],
        })
        .expect(200);

      const orderId = createResponse.body.data.id;
      expect(createResponse.body.data.status).toBe('DRAFT');

      // 2. Confirm order (DRAFT → CONFIRMED)
      const confirmResponse = await request(app)
        .post(`/api/customer-orders/${orderId}/confirm`)
        .expect(200);

      expect(confirmResponse.body.data.status).toBe('CONFIRMED');

      // Verify inventory reserved
      let productState = await prisma.finishedProduct.findUnique({
        where: { id: product.id },
      });
      expect(productState?.quantity).toBe(100);
      expect(productState?.reservedQuantity).toBe(20);

      // 3. Fulfill order (CONFIRMED → FULFILLED)
      const fulfillResponse = await request(app)
        .post(`/api/customer-orders/${orderId}/fulfill`)
        .expect(200);

      expect(fulfillResponse.body.data.status).toBe('FULFILLED');

      // Verify inventory consumed
      productState = await prisma.finishedProduct.findUnique({
        where: { id: product.id },
      });
      expect(productState?.quantity).toBe(80); // 100 - 20
      expect(productState?.reservedQuantity).toBe(0); // 20 - 20
    });

    it('should handle revert: CONFIRMED → DRAFT', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct({ quantity: 100, reservedQuantity: 0 });

      // Create and confirm order
      const createResponse = await request(app)
        .post('/api/customer-orders')
        .send({
          customerId: customer.id,
          expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          items: [
            {
              productId: product.id,
              productName: product.name,
              quantity: 15,
              unitProductionCost: 5.0,
              unitPrice: 7.0,
            },
          ],
        })
        .expect(200);

      const orderId = createResponse.body.data.id;

      await request(app)
        .post(`/api/customer-orders/${orderId}/confirm`)
        .expect(200);

      // Verify inventory reserved
      let productState = await prisma.finishedProduct.findUnique({
        where: { id: product.id },
      });
      expect(productState?.reservedQuantity).toBe(15);

      // Revert to draft
      const revertResponse = await request(app)
        .post(`/api/customer-orders/${orderId}/revert-draft`)
        .expect(200);

      expect(revertResponse.body.data.status).toBe('DRAFT');

      // Verify inventory released
      productState = await prisma.finishedProduct.findUnique({
        where: { id: product.id },
      });
      expect(productState?.quantity).toBe(100);
      expect(productState?.reservedQuantity).toBe(0);
    });
  });
});
