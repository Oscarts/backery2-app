import createApp, { prisma } from './app';

const PORT = process.env.PORT || 8000;

// Create the Express app
const app = createApp();

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
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
}

export default app;
