#!/bin/bash

# Deployment preparation script for Bakery Inventory Management System
# Created: August 30, 2025

echo "🚀 Starting deployment preparation..."

# Build the frontend
echo "📦 Building frontend..."
cd ./frontend
npm run build
BUILD_STATUS=$?

if [ $BUILD_STATUS -ne 0 ]; then
  echo "❌ Frontend build failed with status $BUILD_STATUS"
  exit 1
else
  echo "✅ Frontend built successfully"
fi

# Build the backend
echo "📦 Building backend..."
cd ../backend
npm run build
BUILD_STATUS=$?

if [ $BUILD_STATUS -ne 0 ]; then
  echo "❌ Backend build failed with status $BUILD_STATUS"
  exit 1
else
  echo "✅ Backend built successfully"
fi

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy
MIGRATE_STATUS=$?

if [ $MIGRATE_STATUS -ne 0 ]; then
  echo "❌ Database migration failed with status $MIGRATE_STATUS"
  exit 1
else
  echo "✅ Database migrations applied successfully"
fi

# Back to root
cd ..

echo "✅ Deployment preparation completed successfully"
echo "🚀 The application is ready for deployment"
