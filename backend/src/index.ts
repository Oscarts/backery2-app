import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from './routes/auth';
import rawMaterialRoutes from './routes/rawMaterials';
import intermediateProductRoutes from './routes/intermediateProducts';
import finishedProductRoutes from './routes/finishedProducts';
import recipeRoutes from './routes/recipes';
import productionRoutes from './routes/production';
import contaminationRoutes from './routes/contamination';
import dashboardRoutes from './routes/dashboard';
import reportsRoutes from './routes/reports';
import categoryRoutes from './routes/categories';
import supplierRoutes from './routes/suppliers';
import storageLocationRoutes from './routes/storageLocations';
import unitRoutes from './routes/units';
import qualityStatusRoutes from './routes/qualityStatuses';
import productionStepTemplateRoutes from './routes/productionStepTemplates';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3002',
  credentials: true
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/raw-materials', rawMaterialRoutes);
app.use('/api/intermediate-products', intermediateProductRoutes);
app.use('/api/finished-products', finishedProductRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/contamination', contaminationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/storage-locations', storageLocationRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/quality-statuses', qualityStatusRoutes);
app.use('/api/production/step-templates', productionStepTemplateRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('HTTP server closed.');

    try {
      await prisma.$disconnect();
      console.log('Database connection closed.');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
