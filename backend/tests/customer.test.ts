import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../src/controllers/customerController';
import { cleanupTestData, createTestCustomer, createTestOrder, disconnectPrisma } from './helpers/testHelpers';

const prisma = new PrismaClient();

// Create Express app for testing
const app = express();
app.use(express.json());

// Setup routes
app.get('/api/customers', getCustomers);
app.get('/api/customers/:id', getCustomerById);
app.post('/api/customers', createCustomer);
app.put('/api/customers/:id', updateCustomer);
app.delete('/api/customers/:id', deleteCustomer);

describe('Customer API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  describe('GET /api/customers', () => {
    it('should return empty list when no customers exist', async () => {
      const response = await request(app)
        .get('/api/customers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return list of customers', async () => {
      await createTestCustomer({ name: 'Customer 1' });
      await createTestCustomer({ name: 'Customer 2' });

      const response = await request(app)
        .get('/api/customers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('email');
      expect(response.body.data[0]).toHaveProperty('_count');
    });

    it('should filter customers by name search term', async () => {
      await createTestCustomer({ name: 'Alice Johnson' });
      await createTestCustomer({ name: 'Bob Smith' });
      await createTestCustomer({ name: 'Charlie Brown' });

      const response = await request(app)
        .get('/api/customers?search=Alice')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Alice Johnson');
    });

    it('should filter customers by email search term', async () => {
      await createTestCustomer({ 
        name: 'Test User', 
        email: 'test-unique@example.com' 
      });
      await createTestCustomer({ 
        name: 'Another User', 
        email: 'test-another@example.com' 
      });

      const response = await request(app)
        .get('/api/customers?search=unique')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].email).toBe('test-unique@example.com');
    });

    it('should filter customers by phone search term', async () => {
      await createTestCustomer({ 
        name: 'Customer 1', 
        phone: '555-1234' 
      });
      await createTestCustomer({ 
        name: 'Customer 2', 
        phone: '555-5678' 
      });

      const response = await request(app)
        .get('/api/customers?search=1234')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].phone).toBe('555-1234');
    });

    it('should return customers ordered by name ascending', async () => {
      await createTestCustomer({ name: 'Zebra Customer' });
      await createTestCustomer({ name: 'Alpha Customer' });
      await createTestCustomer({ name: 'Beta Customer' });

      const response = await request(app)
        .get('/api/customers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].name).toBe('Alpha Customer');
      expect(response.body.data[1].name).toBe('Beta Customer');
      expect(response.body.data[2].name).toBe('Zebra Customer');
    });

    it('should include order count for each customer', async () => {
      const customer = await createTestCustomer({ name: 'Customer with Orders' });
      await createTestOrder(customer.id);
      await createTestOrder(customer.id);

      const response = await request(app)
        .get('/api/customers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0]._count.orders).toBe(2);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return customer by ID', async () => {
      const customer = await createTestCustomer({ name: 'Test Customer' });

      const response = await request(app)
        .get(`/api/customers/${customer.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(customer.id);
      expect(response.body.data.name).toBe('Test Customer');
    });

    it('should return 404 if customer not found', async () => {
      const response = await request(app)
        .get('/api/customers/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer not found');
    });

    it('should include order count in customer details', async () => {
      const customer = await createTestCustomer({ name: 'Customer' });
      await createTestOrder(customer.id);

      const response = await request(app)
        .get(`/api/customers/${customer.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._count.orders).toBe(1);
    });
  });

  describe('POST /api/customers', () => {
    it('should create a new customer with all fields', async () => {
      const customerData = {
        name: 'New Customer',
        email: 'test-new@example.com',
        phone: '555-9999',
        address: '456 New Street',
        isActive: true,
      };

      const response = await request(app)
        .post('/api/customers')
        .send(customerData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Customer');
      expect(response.body.data.email).toBe('test-new@example.com');
      expect(response.body.data.phone).toBe('555-9999');
      expect(response.body.data.address).toBe('456 New Street');
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.message).toBe('Customer created successfully');
    });

    it('should create customer with only required name field', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({ name: 'Minimal Customer' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Minimal Customer');
      expect(response.body.data.email).toBeNull();
      expect(response.body.data.phone).toBeNull();
      expect(response.body.data.isActive).toBe(true);
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({ email: 'test-no-name@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer name is required');
    });

    it('should return 400 if name is empty string', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({ name: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer name is required');
    });

    it('should return 400 if email already exists', async () => {
      await createTestCustomer({ email: 'test-duplicate@example.com' });

      const response = await request(app)
        .post('/api/customers')
        .send({
          name: 'Duplicate Email Customer',
          email: 'test-duplicate@example.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('A customer with this email already exists');
    });

    it('should normalize email to lowercase', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({
          name: 'Customer',
          email: 'Test-UPPER@Example.COM',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test-upper@example.com');
    });

    it('should trim whitespace from name', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({
          name: '  Trimmed Name  ',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Trimmed Name');
    });

    it('should default isActive to true if not provided', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({
          name: 'Default Active Customer',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(true);
    });

    it('should allow creating inactive customer', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({
          name: 'Inactive Customer',
          isActive: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update customer with all fields', async () => {
      const customer = await createTestCustomer({ name: 'Original Name' });

      const response = await request(app)
        .put(`/api/customers/${customer.id}`)
        .send({
          name: 'Updated Name',
          email: 'test-updated@example.com',
          phone: '555-0000',
          address: 'New Address',
          isActive: false,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.email).toBe('test-updated@example.com');
      expect(response.body.data.phone).toBe('555-0000');
      expect(response.body.data.address).toBe('New Address');
      expect(response.body.data.isActive).toBe(false);
      expect(response.body.message).toBe('Customer updated successfully');
    });

    it('should return 404 if customer not found', async () => {
      const response = await request(app)
        .put('/api/customers/non-existent-id')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer not found');
    });

    it('should return 400 if name is empty string', async () => {
      const customer = await createTestCustomer({ name: 'Original Name' });

      const response = await request(app)
        .put(`/api/customers/${customer.id}`)
        .send({ name: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer name cannot be empty');
    });

    it('should prevent duplicate email when updating', async () => {
      const customer1 = await createTestCustomer({ email: 'test-existing@example.com' });
      const customer2 = await createTestCustomer({ email: 'test-other@example.com' });

      const response = await request(app)
        .put(`/api/customers/${customer2.id}`)
        .send({ email: 'test-existing@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('A customer with this email already exists');
    });

    it('should allow updating same customer email (no change)', async () => {
      const customer = await createTestCustomer({ 
        name: 'Customer',
        email: 'test-same@example.com' 
      });

      const response = await request(app)
        .put(`/api/customers/${customer.id}`)
        .send({ 
          name: 'Updated Name',
          email: 'test-same@example.com' 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test-same@example.com');
    });

    it('should normalize updated email to lowercase', async () => {
      const customer = await createTestCustomer({ name: 'Customer' });

      const response = await request(app)
        .put(`/api/customers/${customer.id}`)
        .send({ email: 'Updated-EMAIL@Example.COM' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('updated-email@example.com');
    });

    it('should update only provided fields', async () => {
      const customer = await createTestCustomer({ 
        name: 'Original Name',
        email: 'test-original@example.com',
        phone: '555-1111'
      });

      const response = await request(app)
        .put(`/api/customers/${customer.id}`)
        .send({ 
          name: 'New Name',
          email: customer.email,
          phone: customer.phone 
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Name');
      expect(response.body.data.email).toBe('test-original@example.com');
      expect(response.body.data.phone).toBe('555-1111');
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should delete customer with no orders', async () => {
      const customer = await createTestCustomer({ name: 'Deletable Customer' });

      const response = await request(app)
        .delete(`/api/customers/${customer.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Customer deleted successfully');

      // Verify customer is deleted
      const deleted = await prisma.customer.findUnique({
        where: { id: customer.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 if customer not found', async () => {
      const response = await request(app)
        .delete('/api/customers/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Customer not found');
    });

    it('should prevent deletion if customer has orders', async () => {
      const customer = await createTestCustomer({ name: 'Customer with Orders' });
      await createTestOrder(customer.id);
      await createTestOrder(customer.id);

      const response = await request(app)
        .delete(`/api/customers/${customer.id}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Cannot delete customer with 2 existing order(s)');

      // Verify customer still exists
      const stillExists = await prisma.customer.findUnique({
        where: { id: customer.id },
      });
      expect(stillExists).not.toBeNull();
    });

    it('should show correct order count in error message', async () => {
      const customer = await createTestCustomer({ name: 'Customer' });
      await createTestOrder(customer.id);

      const response = await request(app)
        .delete(`/api/customers/${customer.id}`)
        .expect(400);

      expect(response.body.error).toBe('Cannot delete customer with 1 existing order(s)');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long customer names', async () => {
      const longName = 'A'.repeat(500);
      const response = await request(app)
        .post('/api/customers')
        .send({ name: longName })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(longName);
    });

    it('should handle special characters in name', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({ name: "O'Brien & Sons Café" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("O'Brien & Sons Café");
    });

    it('should handle international characters in name', async () => {
      const response = await request(app)
        .post('/api/customers')
        .send({ name: 'José García Müller' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('José García Müller');
    });

    it('should handle null phone and address gracefully', async () => {
      const customer = await createTestCustomer({ 
        name: 'Customer',
        phone: '555-1234',
        address: '123 Street'
      });

      const response = await request(app)
        .put(`/api/customers/${customer.id}`)
        .send({ 
          phone: null,
          address: null
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.phone).toBeNull();
      expect(response.body.data.address).toBeNull();
    });

    it('should handle case-insensitive email search', async () => {
      await createTestCustomer({ 
        name: 'Customer',
        email: 'test-case@example.com' 
      });

      const response = await request(app)
        .get('/api/customers?search=CASE')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });
});
