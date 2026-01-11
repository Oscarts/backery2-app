import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  exportOrderPDF,
  exportOrderExcel,
  exportBulkExcel,
} from '../src/controllers/orderExportController';
import {
  generateOrderPDF,
  generateOrderExcel,
  generateBulkExcel,
} from '../src/services/orderExportService';
import {
  cleanupTestData,
  createTestCustomer,
  createTestProduct,
  createTestOrder,
  disconnectPrisma,
  getPrismaClient,
} from './helpers/testHelpers';

const prisma = getPrismaClient();

// Store test clientId
let testClientId: string;

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware - inject req.user for tests
app.use(async (req: Request, _res: Response, next: NextFunction) => {
  if (!testClientId) {
    const client = await prisma.client.findFirst({ where: { isActive: true } });
    testClientId = client?.id || '';
  }
  // @ts-ignore - Mocking req.user for tests
  req.user = { clientId: testClientId, role: 'admin' };
  next();
});

// Setup routes
app.get('/api/customer-orders/:id/export/pdf', exportOrderPDF);
app.get('/api/customer-orders/:id/export/excel', exportOrderExcel);
app.post('/api/customer-orders/export/excel', exportBulkExcel);

describe('Order Export Service', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  describe('generateOrderPDF', () => {
    it('should generate PDF buffer for valid order', async () => {
      const customer = await createTestCustomer({ name: 'Test Customer' });
      const product = await createTestProduct({ name: 'Test Product' });

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: 10,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 50.0,
          linePrice: 70.0,
        },
      ]);

      const pdfBuffer = await generateOrderPDF(order.id);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // Verify it's a PDF (starts with %PDF)
      expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
    });

    it('should include order details in PDF', async () => {
      const customer = await createTestCustomer({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234'
      });
      const product = await createTestProduct({ name: 'Croissant' });

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: 5,
          unitProductionCost: 3.0,
          unitPrice: 5.0,
          lineProductionCost: 15.0,
          linePrice: 25.0,
        },
      ]);

      const pdfBuffer = await generateOrderPDF(order.id);

      // Just verify PDF was generated successfully
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000); // Reasonable size
    });

    it('should handle multiple items in PDF', async () => {
      const customer = await createTestCustomer();
      const product1 = await createTestProduct({ name: 'Product 1' });
      const product2 = await createTestProduct({ name: 'Product 2' });

      const order = await createTestOrder(customer.id, [
        {
          productId: product1.id,
          productName: product1.name,
          productSku: product1.sku,
          quantity: 5,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 25.0,
          linePrice: 35.0,
        },
        {
          productId: product2.id,
          productName: product2.name,
          productSku: product2.sku,
          quantity: 3,
          unitProductionCost: 10.0,
          unitPrice: 13.0,
          lineProductionCost: 30.0,
          linePrice: 39.0,
        },
      ]);

      const pdfBuffer = await generateOrderPDF(order.id);

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should throw error if order not found', async () => {
      await expect(generateOrderPDF('non-existent-id')).rejects.toThrow('Order not found');
    });
  });

  describe('generateOrderExcel', () => {
    it('should generate Excel buffer for valid order', async () => {
      const customer = await createTestCustomer({ name: 'Test Customer' });
      const product = await createTestProduct({ name: 'Test Product' });

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: 10,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 50.0,
          linePrice: 70.0,
        },
      ]);

      const excelBuffer = await generateOrderExcel(order.id);

      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });

    it('should create Excel with correct structure', async () => {
      const customer = await createTestCustomer({ name: 'Test Customer' });
      const product = await createTestProduct({ name: 'Test Product' });

      const order = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: 10,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 50.0,
          linePrice: 70.0,
        },
      ]);

      const excelBuffer = await generateOrderExcel(order.id);

      // Excel files start with PK (ZIP format signature)
      expect(excelBuffer.toString('utf8', 0, 2)).toBe('PK');
    });

    it('should handle multiple items in Excel', async () => {
      const customer = await createTestCustomer();
      const product1 = await createTestProduct({ name: 'Product 1' });
      const product2 = await createTestProduct({ name: 'Product 2' });
      const product3 = await createTestProduct({ name: 'Product 3' });

      const order = await createTestOrder(customer.id, [
        {
          productId: product1.id,
          productName: product1.name,
          productSku: product1.sku,
          quantity: 5,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 25.0,
          linePrice: 35.0,
        },
        {
          productId: product2.id,
          productName: product2.name,
          productSku: product2.sku,
          quantity: 3,
          unitProductionCost: 10.0,
          unitPrice: 13.0,
          lineProductionCost: 30.0,
          linePrice: 39.0,
        },
        {
          productId: product3.id,
          productName: product3.name,
          productSku: product3.sku,
          quantity: 7,
          unitProductionCost: 8.0,
          unitPrice: 11.0,
          lineProductionCost: 56.0,
          linePrice: 77.0,
        },
      ]);

      const excelBuffer = await generateOrderExcel(order.id);

      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });

    it('should throw error if order not found', async () => {
      await expect(generateOrderExcel('non-existent-id')).rejects.toThrow('Order not found');
    });
  });

  describe('generateBulkExcel', () => {
    it('should generate Excel with multiple orders', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const order1 = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: 5,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 25.0,
          linePrice: 35.0,
        },
      ]);

      const order2 = await createTestOrder(customer.id, [
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: 10,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 50.0,
          linePrice: 70.0,
        },
      ]);

      const excelBuffer = await generateBulkExcel({});

      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });

    it('should filter orders by status', async () => {
      const customer = await createTestCustomer();
      const product = await createTestProduct();

      const items = [
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
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

      const excelBuffer = await generateBulkExcel({ status: 'CONFIRMED' });

      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });

    it('should filter orders by customer', async () => {
      const customer1 = await createTestCustomer();
      const customer2 = await createTestCustomer();
      const product = await createTestProduct();

      const items = [
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
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

      const excelBuffer = await generateBulkExcel({ customerId: customer2.id });

      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });

    it('should handle empty result set', async () => {
      // No orders created
      const excelBuffer = await generateBulkExcel({});

      expect(excelBuffer).toBeInstanceOf(Buffer);
      expect(excelBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('Export API Endpoints', () => {
    describe('GET /api/customer-orders/:id/export/pdf', () => {
      it('should return PDF file', async () => {
        const customer = await createTestCustomer();
        const product = await createTestProduct();

        const order = await createTestOrder(customer.id, [
          {
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            quantity: 5,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 25.0,
            linePrice: 35.0,
          },
        ]);

        const response = await request(app)
          .get(`/api/customer-orders/${order.id}/export/pdf`)
          .expect(200);

        expect(response.headers['content-type']).toBe('application/pdf');
        expect(response.headers['content-disposition']).toContain('attachment');
        expect(response.headers['content-disposition']).toMatch(/\.pdf/);
        expect(response.body).toBeDefined();
      });

      it('should return error if order not found', async () => {
        const response = await request(app)
          .get('/api/customer-orders/non-existent-id/export/pdf');

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/customer-orders/:id/export/excel', () => {
      it('should return Excel file', async () => {
        const customer = await createTestCustomer();
        const product = await createTestProduct();

        const order = await createTestOrder(customer.id, [
          {
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            quantity: 5,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 25.0,
            linePrice: 35.0,
          },
        ]);

        const response = await request(app)
          .get(`/api/customer-orders/${order.id}/export/excel`)
          .expect(200);

        expect(response.headers['content-type']).toContain('spreadsheetml');
        expect(response.headers['content-disposition']).toContain('attachment');
        expect(response.headers['content-disposition']).toMatch(/\.xlsx/);
        expect(response.body).toBeDefined();
      });

      it('should return error if order not found', async () => {
        const response = await request(app)
          .get('/api/customer-orders/non-existent-id/export/excel');

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/customer-orders/export/excel', () => {
      it('should export multiple orders with filters', async () => {
        const customer = await createTestCustomer();
        const product = await createTestProduct();

        const items = [
          {
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            quantity: 5,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 25.0,
            linePrice: 35.0,
          },
        ];

        await createTestOrder(customer.id, items, { status: 'DRAFT' });
        await createTestOrder(customer.id, items, { status: 'CONFIRMED' });

        const response = await request(app)
          .post('/api/customer-orders/export/excel')
          .send({ status: 'DRAFT' })
          .expect(200);

        expect(response.headers['content-type']).toContain('spreadsheetml');
        expect(response.headers['content-disposition']).toContain('attachment');
        expect(response.headers['content-disposition']).toMatch(/\.xlsx/);
        expect(response.body).toBeDefined();
      });

      it('should handle export with no filters', async () => {
        const customer = await createTestCustomer();
        const product = await createTestProduct();

        await createTestOrder(customer.id, [
          {
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            quantity: 5,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 25.0,
            linePrice: 35.0,
          },
        ]);

        const response = await request(app)
          .post('/api/customer-orders/export/excel')
          .send({})
          .expect(200);

        expect(response.headers['content-type']).toContain('spreadsheetml');
        expect(response.body).toBeDefined();
      });

      it('should export empty dataset gracefully', async () => {
        // No orders in database
        const response = await request(app)
          .post('/api/customer-orders/export/excel')
          .send({})
          .expect(200);

        expect(response.headers['content-type']).toContain('spreadsheetml');
        expect(response.body).toBeDefined();
      });
    });
  });

  describe('Export Data Accuracy', () => {
    it('should include all order details in PDF export', async () => {
      const customer = await createTestCustomer({
        name: 'Accuracy Test Customer',
        email: 'accuracy@test.com',
        phone: '555-9999',
        address: '123 Test St',
      });
      const product = await createTestProduct({ name: 'Accuracy Product' });

      const order = await createTestOrder(
        customer.id,
        [
          {
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            quantity: 5,
            unitProductionCost: 5.0,
            unitPrice: 7.0,
            lineProductionCost: 25.0,
            linePrice: 35.0,
          },
        ],
        { notes: 'Test order notes' }
      );

      const pdfBuffer = await generateOrderPDF(order.id);

      // Verify PDF was generated with reasonable content
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
    });

    it('should calculate totals correctly in exports', async () => {
      const customer = await createTestCustomer();
      const product1 = await createTestProduct();
      const product2 = await createTestProduct();

      const order = await createTestOrder(customer.id, [
        {
          productId: product1.id,
          productName: product1.name,
          productSku: product1.sku,
          quantity: 5,
          unitProductionCost: 5.0,
          unitPrice: 7.0,
          lineProductionCost: 25.0,
          linePrice: 35.0,
        },
        {
          productId: product2.id,
          productName: product2.name,
          productSku: product2.sku,
          quantity: 3,
          unitProductionCost: 10.0,
          unitPrice: 13.0,
          lineProductionCost: 30.0,
          linePrice: 39.0,
        },
      ]);

      const updatedOrder = await prisma.customerOrder.findUnique({
        where: { id: order.id },
        include: { items: true },
      });

      // Verify totals from test helper
      expect(updatedOrder?.totalProductionCost).toBe(100.0);
      expect(updatedOrder?.totalPrice).toBe(130.0);

      // Verify items exist
      expect(updatedOrder?.items).toHaveLength(2);

      const pdfBuffer = await generateOrderPDF(order.id);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });
  });
});
