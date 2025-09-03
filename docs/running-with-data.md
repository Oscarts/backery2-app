# Running the Application with Data

This document outlines how to properly run the Bakery Inventory Management application with complete data seeding and configuration.

## Setup Scripts

The project includes several scripts to help you set up and run the application properly:

### 1. `start-with-data.sh`

**Purpose**: Start the application while preserving existing database data.

```bash
sh start-with-data.sh
```

**What it does:**

- Installs all dependencies (root, backend, and frontend)
- Sets up environment files if they don't exist
- Checks database connection
- Generates Prisma client
- Applies any pending migrations (without resetting data)
- Intelligently seeds the database only if it's empty
- Starts both frontend and backend servers

**Use this script for:**

- Daily development work
- When you want to preserve existing test data
- After making changes that don't affect the database schema

### 2. `reset-and-start.sh`

**Purpose**: Reset the database and start fresh with clean seed data.

```bash
sh reset-and-start.sh
```

**What it does:**

- Installs all dependencies
- Sets up environment files if they don't exist
- Checks database connection
- Generates Prisma client
- **Completely resets the database** (deletes all data)
- Applies all migrations
- Seeds the database with fresh data
- Starts both frontend and backend servers

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
