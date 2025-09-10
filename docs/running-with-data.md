# Running the Application with Data

This document provides comprehensive instructions for running the **Bakery Inventory Management System** with proper data setup and configuration.

## 🚀 Quick Start

The simplest way to run the application:

```bash
# Start development servers
npm run dev

# Access the application
# Frontend: http://localhost:3002
# Backend: http://localhost:8000
# Health Check: http://localhost:8000/health
```

## 📋 Setup Scripts

The project includes several automated scripts for different development scenarios:

### 1. `start-with-data.sh` - Preserve Data Setup

**Purpose**: Start the application while preserving existing database data.

```bash
./start-with-data.sh
```

**What it does:**

- ✅ Installs all dependencies (root, backend, and frontend workspaces)
- ✅ Sets up environment files (.env) if they don't exist
- ✅ Verifies PostgreSQL database connection
- ✅ Generates latest Prisma client with TypeScript types
- ✅ Applies any pending database migrations (without data loss)
- ✅ Intelligently seeds the database only if empty
- ✅ Starts both frontend (port 3002) and backend (port 8000) servers
- ✅ Provides health check confirmation

**Use this script for:**

- Daily development work
- When you want to preserve existing test data and production runs
- After making code changes that don't affect database schema
- Continuing work with existing inventory and production data

### 2. `reset-and-start.sh` - Fresh Start Setup

**Purpose**: Reset the database completely and start fresh with clean seed data.

```bash
./reset-and-start.sh
```

**What it does:**

- ✅ Installs all dependencies across workspaces
- ✅ Sets up environment configuration files
- ✅ Verifies database connectivity
- ✅ Generates fresh Prisma client
- ⚠️ **Completely resets the database** (deletes all existing data)
- ✅ Applies all migrations from scratch
- ✅ Seeds database with comprehensive test data including:
  - Raw materials with suppliers and expiration dates
  - Intermediate products with quality statuses
  - Finished products with pricing and inventory
  - Recipes with ingredients and instructions
  - Production runs with step tracking
  - Users and authentication data
- ✅ Starts development servers

**Use this script for:**

- When you need a fresh, clean database state
- After schema changes that require data reset
- When troubleshooting data integrity issues

### 3. `check-database.sh`

**Purpose**: Run diagnostics on the database to check for data issues.

```bash
sh check-database.sh
```

**What it does:**

- Connects to the database
- Counts records in key tables
- Checks if seed configuration is properly set up
- Provides recommendations for fixing issues

**Use this script for:**

- Troubleshooting data availability issues
- Verifying that seeding worked correctly
- Checking database connection status

## Database Seeding Process

The application uses Prisma ORM for database management, with seeds defined in `backend/prisma/seed.ts`. The seeding process:

1. Creates categories (raw materials, intermediate products, finished products)
2. Creates suppliers
3. Creates storage locations
4. Creates measurement units
5. Creates raw materials
6. Creates intermediate products
7. Creates finished products
8. Creates recipes and recipe ingredients

The seeds ensure that the application starts with a comprehensive set of sample data for all features to work properly.

## Environment Configuration

Database connection is configured through environment variables. By default, the scripts create:

**Backend (.env)**:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/bakery_db"
JWT_SECRET="your-secret-key"
PORT=8000
```

**Frontend (.env)**:

```env
VITE_API_URL=http://localhost:8000
```

If your PostgreSQL setup differs, modify these values in the respective .env files or in the setup scripts themselves.

## Troubleshooting

### Data Not Available in Frontend

If data isn't showing in the frontend application:

1. Run `sh check-database.sh` to verify data exists in the database
2. Check browser console for API errors
3. Verify backend is running (`http://localhost:8000/health` should return OK)
4. Ensure the correct frontend environment variables are set

### Database Connection Errors

If you encounter database connection errors:

1. Ensure PostgreSQL is running
2. Verify database exists (`bakery_db` by default)
3. Check credentials in `.env` file
4. Run `npx prisma db push` to sync schema if needed

### Seed Errors

When encountering seed errors (often unique constraint violations):

1. Use `reset-and-start.sh` for a clean slate
2. Check seed file for inconsistencies
3. Ensure the `prisma.seed` config in package.json points to the correct seed file

## Manual Database Operations

For direct database operations:

- **Prisma Studio**: `cd backend && npx prisma studio`
- **Reset Database**: `cd backend && npx prisma migrate reset --force`
- **Run Migrations**: `cd backend && npx prisma migrate deploy`
- **Manual Seed**: `cd backend && npx prisma db seed`

## Best Practices

1. Always run `check-database.sh` before reporting data issues
2. Use `start-with-data.sh` for normal development
3. Use `reset-and-start.sh` after schema changes
4. Never modify production data directly - use migrations and seeds
