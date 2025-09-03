# Bakery Inventory Management System

A comprehensive inventory management solution for bakery and chocolate businesses.

## Quick Start

Use our setup scripts for easy deployment:

```bash
# Start with existing data (recommended for daily use)
sh start-with-data.sh

# Reset database and start fresh
sh reset-and-start.sh

# Check database status
sh check-database.sh
```

## Project Structure

- `frontend/` - React TypeScript frontend with Material UI
- `backend/` - Express TypeScript backend with Prisma ORM
- `docs/` - Project documentation
- `*.sh` - Utility scripts for setup and maintenance

## Documentation

For detailed information, refer to the following documentation:

- [Running with Data](./docs/running-with-data.md) - How to run the app with proper data setup
- [Development Guidelines](./docs/development-guidelines.md) - Coding standards and practices
- [Project Overview](./docs/project-overview.md) - System architecture and features
- [API Reference](./docs/api-reference.md) - Backend API endpoints and usage
- [Data Persistence](./docs/data-persistence.md) - Database schema and data handling

## Features

- Raw materials inventory tracking
- Intermediate products management
- Finished products catalog
- Recipe management
- Quality status monitoring
- Storage location management
- Supplier management
- Dashboard with inventory alerts

## Technical Stack

- **Frontend**: React, TypeScript, Material UI, Redux
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT

## Development

For local development, ensure you have:

1. Node.js (v16+)
2. npm (v7+)
3. PostgreSQL (v13+)

## License

Copyright © 2025 Bakery Inventory Management
