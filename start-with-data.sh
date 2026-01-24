#!/bin/bash

# Safe mode: exit on error but don't print every command (reduces noise)
set -e

echo "🚀 Starting Bakery App (Preserving Existing Data)..."

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

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup backend environment
cd backend
echo "🔧 Setting up backend..."

# Install backend dependencies
npm install

# Setup environment if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating backend .env file..."
    echo "DATABASE_URL=\"postgresql://oscar@localhost:5432/bakery_inventory\"" > .env
    echo "JWT_SECRET=\"your-secret-key-min-32-chars-long-12345\"" >> .env
    echo "PORT=8000" >> .env
    echo "NODE_ENV=development" >> .env
fi

# Database operations
echo "🗃️ Checking database connection..."

# Check if PostgreSQL is running
if command_exists pg_isready; then
    if ! pg_isready -h localhost -p 5432; then
        echo "❌ PostgreSQL is not running on localhost:5432. Please start PostgreSQL first."
        exit 1
    fi
else
    echo "⚠️ pg_isready command not found. Checking with psql..."
    if ! psql "postgresql://oscar@localhost:5432/bakery_inventory" -c "\q" 2>/dev/null; then
        echo "❌ Cannot connect to database. Please ensure PostgreSQL is running."
        exit 1
    fi
fi

# Generate Prisma client (required after schema changes)
echo "🔄 Generating Prisma client..."
npx prisma generate

# Run database migrations (non-destructive - only applies new migrations)
echo "🔄 Applying pending migrations (preserves existing data)..."
npx prisma migrate deploy

# Check if database needs initial seeding
echo "🔍 Checking database state..."
CLIENT_COUNT=$(psql "postgresql://oscar@localhost:5432/bakery_inventory" -t -c "SELECT COUNT(*) FROM client;" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$CLIENT_COUNT" = "0" ]; then
  echo "📊 Database is empty. Running initial seed..."
  npx prisma db seed
else
  echo "✅ Database contains data ($CLIENT_COUNT clients). Preserving existing data."
  echo "💡 To reset database, use: ./reset-and-start.sh"
fi

if [ "$CLIENT_COUNT" = "0" ]; then
  echo "📊 Database is empty. Running initial seed..."
  npx prisma db seed
else
  echo "✅ Database contains data ($CLIENT_COUNT clients). Preserving existing data."
  echo "💡 To reset database, use: ./reset-and-start.sh"
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
echo ""
echo "🚀 Starting development servers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Backend: http://localhost:8000"
echo "✨ Frontend: http://localhost:3002"
echo "✨ Health: http://localhost:8000/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
npm run dev
