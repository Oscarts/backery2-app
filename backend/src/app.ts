import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

// Middleware
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { setupTenantIsolation } from './middleware/tenantIsolation';
import { authenticate, optionalAuthenticate } from './middleware/auth';
import { tenantContext } from './middleware/tenantIsolation';

// Routes  
import categoryRoutes from './routes/categories';
import rawMaterialRoutes from './routes/rawMaterials';
import finishedProductRoutes from './routes/finishedProducts';
import recipeRoutes from './routes/recipes';
import productionRoutes from './routes/production';
import dashboardRoutes from './routes/dashboard';
import authRoutes from './routes/auth';
import contaminationRoutes from './routes/contamination';
import reportsRoutes from './routes/reports';
import supplierRoutes from './routes/suppliers';
import storageLocationRoutes from './routes/storageLocations';
import unitRoutes from './routes/units';
import qualityStatusRoutes from './routes/qualityStatuses';
import productionStepTemplateRoutes from './routes/productionStepTemplates';
import customerRoutes from './routes/customers';
import customerOrderRoutes from './routes/customer-orders';
import userRoutes from './routes/users';
import roleRoutes from './routes/roles';
import permissionRoutes from './routes/permissions';
import clientRoutes from './routes/clients';
import { createAdminUser } from './controllers/clientController';

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Setup tenant isolation middleware on Prisma
setupTenantIsolation(prisma);

// Create Express app
const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
  app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Increased limit for image uploads

  // Only use morgan in development to avoid cluttering test output
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  // Routes
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // API Documentation - available without authentication
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'RapidPro API Documentation',
  }));

  // Serve OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Public routes (no authentication required)
  app.use('/api/auth', authRoutes);

  // Protected routes (require authentication and tenant isolation)
  app.use('/api/units', authenticate, unitRoutes); // Global reference data - Super Admin only for write operations
  app.use('/api/categories', authenticate, tenantContext, categoryRoutes);
  app.use('/api/raw-materials', authenticate, tenantContext, rawMaterialRoutes);
  app.use('/api/finished-products', authenticate, tenantContext, finishedProductRoutes);
  app.use('/api/recipes', authenticate, tenantContext, recipeRoutes);
  app.use('/api/production', authenticate, tenantContext, productionRoutes);
  app.use('/api/dashboard', authenticate, tenantContext, dashboardRoutes);
  app.use('/api/contamination', authenticate, tenantContext, contaminationRoutes);
  app.use('/api/reports', authenticate, tenantContext, reportsRoutes);
  app.use('/api/suppliers', authenticate, tenantContext, supplierRoutes);
  app.use('/api/storage-locations', authenticate, tenantContext, storageLocationRoutes);
  app.use('/api/quality-statuses', authenticate, tenantContext, qualityStatusRoutes);
  app.use('/api/production/step-templates', authenticate, tenantContext, productionStepTemplateRoutes);
  app.use('/api/customers', authenticate, tenantContext, customerRoutes);
  app.use('/api/customer-orders', authenticate, tenantContext, customerOrderRoutes);
  app.use('/api/users', authenticate, tenantContext, userRoutes);
  app.use('/api/roles', authenticate, tenantContext, roleRoutes);
  app.use('/api/permissions', authenticate, tenantContext, permissionRoutes);
  app.use('/api/admin/clients', authenticate, clientRoutes); // Super admin only, no tenant context
  app.post('/api/admin/create-admin', authenticate, createAdminUser); // Create admin user for a client

  // Error handling middleware
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;