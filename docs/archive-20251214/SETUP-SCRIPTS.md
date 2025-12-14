# Bakery Inventory Management Setup Scripts

This document explains the scripts available to help you set up and run the bakery inventory management system.

## Available Scripts

### 1. `start-with-data.sh`

This script sets up and runs the application while preserving existing data in the database.

```bash
sh start-with-data.sh
```

**What it does:**

- Installs all dependencies
- Sets up environment files if they don't exist
- Checks database connection
- Generates Prisma client
- Applies any pending migrations (without resetting data)
- Checks if the database is already seeded
- Seeds the database only if it's empty
- Starts both frontend and backend servers

Use this script for your daily development when you want to keep your existing data.

### 2. `reset-and-start.sh`

This script completely resets the database and starts fresh with seed data.

```bash
sh reset-and-start.sh
```

**What it does:**

- Installs all dependencies
- Sets up environment files if they don't exist
- Checks database connection
- Generates Prisma client
- **Resets the database** (deletes all data)
- Applies all migrations
- Seeds the database with fresh data
- Starts both frontend and backend servers

Use this script when your database is in a bad state or when you want to start fresh.

### 3. `check-database.sh`

This script runs a diagnostic check on the database to see if it contains data.

```bash
sh check-database.sh
```

**What it does:**

- Connects to the database
- Counts entries in major tables
- Checks if seed script configuration is correct
- Provides recommendations if issues are found

Use this script to diagnose data issues.

## Troubleshooting

### 1. Port Already in Use

If you see an error like:

```bash
Error: listen EADDRINUSE: address already in use :::8000
```

It means there's already a server running on the specified port. You can either:

- Close the existing server
- Change the port in the `.env` file

### 2. Database Connection Issues

If the script fails to connect to the database:

- Ensure PostgreSQL is running
- Check the connection string in the `.env` file
- Verify that the database exists

### 3. Seed Errors

If you encounter unique constraint errors during seeding, it means the data already exists. You can:

- Use `reset-and-start.sh` to completely reset the database
- Manually delete the conflicting records
