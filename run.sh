#!/bin/bash

# Print commands before executing and exit on any error
set -ex

echo "🚀 Starting Bakery App Setup..."

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

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
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
fi

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate reset --force

# Seed the database
echo "🌱 Seeding the database..."
npx prisma db seed

# Go back to root directory
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
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
