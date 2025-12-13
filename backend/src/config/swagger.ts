/**
 * Swagger/OpenAPI Configuration
 * 
 * This file configures the API documentation for RapidPro Bakery Management System.
 * Access the docs at /api-docs in development or production.
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RapidPro Bakery Management API',
      version,
      description: `
## Multi-Tenant Bakery Management System

A comprehensive API for managing bakery operations including:
- **Inventory Management**: Raw materials, finished products, storage locations
- **Production**: Recipes, production runs, step tracking
- **Sales**: Customers, orders, pricing
- **Administration**: Users, roles, permissions

### Authentication
All endpoints (except auth) require a valid JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your-token>
\`\`\`

### Multi-Tenancy
All data is isolated by client (tenant). The clientId is automatically extracted from the authenticated user's JWT token.
      `,
      contact: {
        name: 'RapidPro Support',
        email: 'support@rapidpro.app',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Base Path',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        // Common response schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        // Auth schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', format: 'password', example: 'password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
        // Raw Material schemas
        RawMaterial: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            name: { type: 'string', example: 'All-Purpose Flour' },
            sku: { type: 'string', example: 'ALL-PURPOSE-FLOUR' },
            description: { type: 'string' },
            quantity: { type: 'number', example: 100 },
            unit: { type: 'string', example: 'kg' },
            unitPrice: { type: 'number', example: 2.50 },
            reorderLevel: { type: 'number', example: 10 },
            batchNumber: { type: 'string', example: 'SUPP-20251201-001' },
            expirationDate: { type: 'string', format: 'date-time' },
            supplierId: { type: 'string' },
            storageLocationId: { type: 'string' },
            categoryId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        RawMaterialCreate: {
          type: 'object',
          required: ['name', 'quantity', 'unit', 'unitPrice', 'supplierId', 'storageLocationId', 'expirationDate', 'batchNumber'],
          properties: {
            name: { type: 'string', example: 'All-Purpose Flour' },
            sku: { type: 'string', example: 'ALL-PURPOSE-FLOUR' },
            description: { type: 'string' },
            quantity: { type: 'number', example: 100 },
            unit: { type: 'string', example: 'kg' },
            unitPrice: { type: 'number', example: 2.50 },
            reorderLevel: { type: 'number', example: 10 },
            batchNumber: { type: 'string' },
            expirationDate: { type: 'string', format: 'date-time' },
            supplierId: { type: 'string' },
            storageLocationId: { type: 'string' },
            categoryId: { type: 'string' },
          },
        },
        // Finished Product schemas
        FinishedProduct: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            name: { type: 'string', example: 'Sourdough Bread' },
            sku: { type: 'string', example: 'SOURDOUGH-BREAD' },
            description: { type: 'string' },
            quantity: { type: 'number', example: 50 },
            unit: { type: 'string', example: 'loaves' },
            salePrice: { type: 'number', example: 5.99 },
            costToProduce: { type: 'number', example: 2.50 },
            markupPercentage: { type: 'number', example: 50 },
            batchNumber: { type: 'string' },
            productionDate: { type: 'string', format: 'date-time' },
            expirationDate: { type: 'string', format: 'date-time' },
            shelfLife: { type: 'integer', example: 7 },
            recipeId: { type: 'string' },
            storageLocationId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Recipe schemas
        Recipe: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            name: { type: 'string', example: 'Classic Sourdough' },
            description: { type: 'string' },
            instructions: { type: 'string' },
            yieldQuantity: { type: 'number', example: 5 },
            yieldUnit: { type: 'string', example: 'loaves' },
            estimatedCost: { type: 'number', example: 10.00 },
            overheadPercentage: { type: 'number', example: 50 },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rawMaterialId: { type: 'string' },
                  quantity: { type: 'number' },
                  unit: { type: 'string' },
                },
              },
            },
          },
        },
        // Customer Order schemas
        CustomerOrder: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            orderNumber: { type: 'string', example: 'ORD-2025-001' },
            customerId: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled'] },
            totalAmount: { type: 'number', example: 125.50 },
            deliveryDate: { type: 'string', format: 'date-time' },
            notes: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  finishedProductId: { type: 'string' },
                  quantity: { type: 'number' },
                  unitPrice: { type: 'number' },
                },
              },
            },
          },
        },
        // Supplier schemas
        Supplier: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            name: { type: 'string', example: 'Premium Flour Co.' },
            contactInfo: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
              },
            },
            address: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        // Storage Location schemas
        StorageLocation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            name: { type: 'string', example: 'Main Warehouse' },
            type: { type: 'string', example: 'dry' },
            description: { type: 'string' },
            capacity: { type: 'string' },
          },
        },
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'cuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            roleId: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required or token invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, error: 'Unauthorized' },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, error: 'Forbidden: Insufficient permissions' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, error: 'Resource not found' },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { success: false, error: 'Validation error', details: [] },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Roles', description: 'Role and permission management' },
      { name: 'Raw Materials', description: 'Inventory - raw materials/ingredients' },
      { name: 'Finished Products', description: 'Inventory - finished products' },
      { name: 'Recipes', description: 'Recipe management' },
      { name: 'Production', description: 'Production runs and tracking' },
      { name: 'Customers', description: 'Customer management' },
      { name: 'Customer Orders', description: 'Order management' },
      { name: 'Suppliers', description: 'Supplier management' },
      { name: 'Storage Locations', description: 'Storage location management' },
      { name: 'Categories', description: 'Category management' },
      { name: 'Dashboard', description: 'Dashboard and analytics' },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
