# Bakery Inventory Management System

A comprehensive inventory management solution for bakery and chocolate businesses.

## 🚀 Quick Start

Use our setup scripts for easy deployment:

```bash
# Start with existing data (recommended for daily use)
sh start-with-data.sh

# Reset database and start fresh
sh reset-and-start.sh

# Check database status
sh check-database.sh
```

For detailed information about these scripts, see [SETUP-SCRIPTS.md](./SETUP-SCRIPTS.md) and [Running with Data](./docs/running-with-data.md).

## 📚 Documentation

### Required Reading Before Development

**MANDATORY READING ORDER:**

1. **[Project Overview](./docs/project-overview.md)** - Understand what we're building and current status
2. **[Development Guidelines](./docs/development-guidelines.md)** - Critical coding standards and testing requirements
3. **[Technical Architecture](./docs/technical-architecture.md)** - System structure and technology stack
4. **[API Reference](./docs/api-reference.md)** - Backend endpoints and data models
5. **[UI Guidelines](./docs/ui-guidelines.md)** - Frontend patterns and design standards

### Additional Documentation

- [Running with Data](./docs/running-with-data.md) - How to run the app with proper data setup
- [Data Persistence](./docs/data-persistence.md) - Database schema and data handling
- [Development Progress](./docs/development-progress.md) - Feature completion tracking
- [Environment Configuration](./docs/env.md) - Environment setup details
- [Test Strategy](./docs/testing/test-strategy.md) - Testing approach and practices
- [Contributing Guide](./docs/CONTRIBUTING.md) - How to contribute to the project

## 🎯 Key Principles

- **Always use Real API** - Never mock data, always connect to actual database
- **Test-Driven Development** - Every feature must have unit tests
- **Documentation First** - Read docs before coding, update docs after coding
- **Consistency** - Follow established patterns for UI, API, and code structure

## 📁 Project Structure

- `frontend/` - React TypeScript frontend with Material UI
- `backend/` - Express TypeScript backend with Prisma ORM
- `docs/` - Project documentation
- `*.sh` - Utility scripts for setup and maintenance

## ✨ Features

- Raw materials inventory tracking
- Intermediate products management
- Finished products catalog
- Recipe management
- Quality status monitoring
- Storage location management
- Supplier management
- Dashboard with inventory alerts

## 💻 Technical Stack

- **Frontend**: React, TypeScript, Material UI, Redux
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT

## 🚨 Critical Guidelines

- Backend server must run on `http://localhost:8000`
- Frontend uses `realApi.ts` - never `mockApi.ts`
- All features require unit tests before marking as complete
- Update development progress tracking after every completed feature

## 🛠️ Development Requirements

For local development, ensure you have:

1. Node.js (v16+)
2. npm (v7+)
3. PostgreSQL (v13+)

## 📞 Need Help?

Check the relevant documentation section first. If the information isn't there, it should be added to maintain project knowledge.

## License

Copyright © 2025 Bakery Inventory Management
