# Bakery Inventory Management System

> **Production Ready** | **Version 1.0.0** | **September 2025**

A comprehensive, full-stack inventory management solution designed specifically for bakery and chocolate businesses with real-time production tracking, quality management, and business analytics.

## ✨ Key Features

- 🍞 **Complete Inventory Management** - Raw materials, intermediate products, and finished goods
- 🏭 **Production Workflow Engine** - Real-time production run tracking with customizable steps
- 📊 **Business Analytics** - Real-time dashboard with inventory metrics and production insights
- 🔍 **Quality Management** - Comprehensive quality tracking and contamination monitoring
- 📝 **Recipe Management** - Cost analysis and "What Can I Make?" functionality
- 🔐 **User Authentication** - JWT-based security with role-based access control
- 🎉 **Interactive UI** - Material-UI design with celebration animations and responsive layout

## 🚀 Quick Start

### Automated Setup (Recommended)

```bash
# Clone the repository
git clone [repository-url]
cd backery2-app

# Start with existing data (recommended for daily use)
./start-with-data.sh

# OR reset database and start fresh
./reset-and-start.sh

# OR just run development servers
npm run dev
```

**Access the application:**

- **Frontend**: <http://localhost:3002>
- **Backend API**: <http://localhost:8000>
- **Health Check**: <http://localhost:8000/health>

### Technology Stack

- **Frontend**: React 18 + TypeScript + Material-UI + Vite
- **Backend**: Express.js + TypeScript + Prisma ORM
- **Database**: PostgreSQL with Docker support
- **Authentication**: JWT with bcrypt password hashing
- **State Management**: React Query + Zustand
- **Testing**: Jest with comprehensive API testing

## 📚 Documentation

### Essential Reading for Development

**MANDATORY READING ORDER:**

1. **[Project Overview](./docs/project-overview.md)** - Complete project description and current status
2. **[Development Guidelines](./docs/development-guidelines.md)** - Critical coding standards and testing requirements
3. **[Technical Architecture](./docs/technical-architecture.md)** - System architecture and technology details
4. **[API Reference](./docs/api-reference.md)** - Complete backend API documentation
5. **[UI Guidelines](./docs/ui-guidelines.md)** - Frontend design patterns and Material-UI standards

### Additional Documentation

- [Running with Data](./docs/running-with-data.md) - Detailed setup and data management guide
- [Data Persistence](./docs/data-persistence.md) - Database schema and relationships
- [Development Progress](./docs/development-progress.md) - Feature completion tracking
- [Environment Configuration](./docs/env.md) - Environment setup and configuration
- [Test Strategy](./docs/testing/test-strategy.md) - Testing approach and best practices
- [Contributing Guide](./docs/CONTRIBUTING.md) - Guidelines for contributing to the project
- [Changelog](./docs/CHANGELOG.md) - Version history and feature releases

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
