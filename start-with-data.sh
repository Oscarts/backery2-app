#!/bin/bash

# Print commands before executing and exit on any error
set -ex

echo "🚀 Starting Bakery App with Complete Data Setup..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup backend environment
cd backend
echo "🔧 Setting up backend..."

# Install backend dependencies
npm install

# Setup environment if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating backend .env file..."
    echo "DATABASE_URL=\"postgresql://postgres:postgres@localhost:5432/bakery_db\"" > .env
    echo "JWT_SECRET=\"your-secret-key\"" >> .env
    echo "PORT=8000" >> .env
fi

# Database operations
echo "🗃️ Setting up database..."

# Check if PostgreSQL is running
if command_exists pg_isready; then
    if ! pg_isready; then
        echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
        exit 1
    fi
else
    echo "⚠️ pg_isready command not found. Assuming PostgreSQL is running..."
fi

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Fix Prisma seed configuration
echo "🛠️ Setting up seed configuration..."
if ! grep -q "prisma" package.json || ! grep -q "seed" package.json; then
    # Add prisma.seed to package.json if not present
    TMP_FILE=$(mktemp)
    jq '.prisma = {"seed": "tsx prisma/seed.ts"}' package.json > "$TMP_FILE" && mv "$TMP_FILE" package.json
fi

# Check if database is already seeded
echo "🔍 Checking if database is already seeded..."
CATEGORY_COUNT=$(cd .. && npx -y tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  try {
    const count = await prisma.category.count();
    console.log(count);
  } catch (error) {
    console.log(0);
  } finally {
    await prisma.\$disconnect();
  }
}
check();
" 2>/dev/null || echo 0)

if [ "$CATEGORY_COUNT" -gt "0" ]; then
  echo "✅ Database already contains data. Skipping seed."
else
  # Seed the database
  echo "🌱 Seeding the database..."
  npx prisma db seed
fi

# Go back to root directory
cd ..

# Setup frontend environment
echo "🔧 Setting up frontend..."
cd frontend

# Install frontend dependencies
npm install

# Create frontend environment if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating frontend .env file..."
    echo "VITE_API_URL=http://localhost:8000" > .env
fi

# Go back to root directory
cd ..

# Start development servers
echo "🚀 Starting development servers..."
npm run dev

echo "✅ Setup complete! The app should be running at:"
echo "Frontend: http://localhost:3002"
echo "Backend: http://localhost:8000"
