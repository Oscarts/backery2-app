import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';

// Middleware
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

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

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

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

  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/raw-materials', rawMaterialRoutes);
  app.use('/api/finished-products', finishedProductRoutes);
  app.use('/api/recipes', recipeRoutes);
  app.use('/api/production', productionRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/contamination', contaminationRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/suppliers', supplierRoutes);
  app.use('/api/storage-locations', storageLocationRoutes);
  app.use('/api/units', unitRoutes);
  app.use('/api/quality-statuses', qualityStatusRoutes);
  app.use('/api/production/step-templates', productionStepTemplateRoutes);
  app.use('/api/customers', customerRoutes);
  app.use('/api/customer-orders', customerOrderRoutes);

  // Error handling middleware
  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;