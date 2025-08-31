# Bakery Inventory Management System

A comprehensive inventory management web application specifically designed for bakery and chocolate businesses. This full-stack system tracks raw materials, intermediate products, and finished goods with real-time database persistence, comprehensive CRUD operations, and a professional Material-UI interface.

## 📚 Documentation

**BEFORE CODING:** Read the documentation in this order:

1. **[Project Overview](./docs/project-overview.md)** - What we're building and current status
2. **[Development Guidelines](./docs/development-guidelines.md)** - CRITICAL coding standards and testing requirements
3. **[Technical Architecture](./docs/technical-architecture.md)** - System structure and database schema
4. **[API Reference](./docs/api-reference.md)** - Backend endpoints and data models
5. **[UI Guidelines](./docs/ui-guidelines.md)** - Frontend patterns and design standards
6. **[Development Progress](./docs/development-progress.md)** - Completed features and tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd backery2-app
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up the database:**

   ```bash
   cd backend
   npx prisma db push
   npx prisma db seed
   ```

4. **Start development servers:**

   ```bash
   npm run dev
   ```

   This starts:
   - Frontend: <http://localhost:3002>
   - Backend: <http://localhost:8000>

### Verify Installation

Check that everything is working:

- Frontend loads at <http://localhost:3002>
- Backend health check: <http://localhost:8000/health>
- Run API tests: `cd backend && node test-quality-api.js`

## 🎯 Current Status

**Production Ready Core Systems** - All major inventory management features completed with comprehensive testing and professional UI.

### ✅ Completed Features

- Complete inventory management (Raw Materials, Intermediate Products, Finished Products)
- Recipe management with cost analysis and "What Can I Make?" functionality
- Quality tracking and contamination management
- Professional dashboard with real-time analytics
- Settings management for all configuration
- Comprehensive API testing infrastructure
- Mobile-responsive Material-UI interface

### 🎯 Recent Achievements (August 2025)

- Enhanced Finished Products table with Production Date and Storage Location columns
- Improved form accessibility by moving action buttons to the top
- Implemented comprehensive development tracking system
- Created streamlined documentation structure
- Organized code and archived unused files

## 🛡️ Development Standards

### Critical Guidelines

- **Real API Only:** Always use `realApi.ts`, never `mockApi.ts`
- **Testing Required:** Every feature must have unit tests
- **Documentation:** Update docs with every feature
- **Progress Tracking:** Document completed work

### Quality Gates

- ✅ All tests pass (backend and frontend)
- ✅ No TypeScript errors
- ✅ Responsive design verified
- ✅ Real API integration confirmed
- ✅ Documentation updated

## 🔧 Technology Stack

### Frontend

- React 18 with TypeScript
- Material-UI for professional design
- Vite for development and building
- React Router for navigation

### Backend

- Node.js with Express and TypeScript
- Prisma ORM with PostgreSQL
- RESTful API architecture
- Comprehensive error handling

### Development Tools

- TypeScript for type safety
- ESLint for code quality
- Custom test scripts for API testing
- Hot reload for development

## 📁 Project Structure

```
backery2-app/
├── docs/                    # 📚 Complete documentation
├── frontend/               # React TypeScript application
├── backend/               # Express.js API server
├── archive/              # Archived files and old docs
├── package.json          # Project dependencies and scripts
└── README.md            # This file
```

## 🧪 Testing

### API Testing

```bash
cd backend
node test-quality-api.js        # Test quality endpoints
node test-contamination-api.js  # Test contamination features
node run-all-tests.js          # Run all API tests
```

### Frontend Testing

```bash
cd frontend
npm run test                    # Run component tests
```

## 🚀 Deployment

### Development

- Frontend and backend run locally with hot reload
- PostgreSQL database for persistent data
- Environment-based configuration

### Production (Planned)

- Static frontend deployment (Vercel/Netlify)
- Backend hosting (Railway/Heroku)
- Managed PostgreSQL database

## � Contributing

1. **Read Documentation First:** Understanding the system is crucial
2. **Follow Guidelines:** Adhere to development standards
3. **Write Tests:** Every feature requires testing
4. **Update Docs:** Keep documentation current
5. **Track Progress:** Document completed work

## � Support

- **Documentation Issues:** Update the relevant docs section
- **Technical Questions:** Check API Reference and Technical Architecture
- **Development Help:** Review Development Guidelines and completed features

---

**This system provides a complete, production-ready inventory management solution for bakery businesses with professional UI, comprehensive testing, and detailed documentation.**

- 🔧 **Testing Infrastructure** - Added Jest configuration and setup for comprehensive frontend testing

**🚧 NEXT DEVELOPMENT PRIORITIES:**

- Production planning and scheduling system based on recipes and current inventory
- Advanced inventory analytics with trend analysis and forecasting
- Supplier management enhancement with purchase order automation
- Mobile application development for warehouse operations
- Quality control workflow automation
- Enhanced testing infrastructure with end-to-end tests

## Features

### ✅ Implemented & Working

#### **Intermediate Products Management**

- Complete CRUD operations (Create, Read, Update, Delete)
- Real-time database persistence with PostgreSQL
- Material-UI interface with responsive design
- Advanced filtering by category, status, and search terms
- Date pickers for production and expiration dates
- Units dropdown with comprehensive weight/volume/count categories
- Batch number tracking and validation
- Quality status and contamination monitoring

#### **Raw Materials Management**

- Complete CRUD operations (Create, Read, Update, Delete)
- Supplier integration with full contact management
- Contamination tracking and safety protocols
- Reorder level alerts and inventory management
- Batch number validation and traceability
- Expiration date monitoring with visual alerts
- Cost per unit tracking and pricing management
- Storage location assignment and tracking
- Real-time updates with React Query integration

#### **Finished Products Management**

- Complete CRUD operations (Create, Read, Update, Delete)
- Unique SKU management and validation system
- Pricing system with sale price and cost-to-produce tracking
- Production and expiration date management with shelf life calculations
- Batch number tracking and traceability
- Advanced inventory management with quantity reservations
- Reserve/release system for order management
- Storage location assignment and packaging information
- Category integration with finished product types
- Advanced search and filtering (name, SKU, batch, category, expiration status)
- Summary dashboard with total, expiring, low stock, and reserved items
- Stock monitoring with low stock alerts and visual indicators
- Expiration alerts with days-until-expiration countdown
- Responsive Material-UI interface with professional forms and tables
- Real-time updates with React Query integration

#### **Recipe Management System**

- Complete CRUD operations (Create, Read, Update, Delete)
- Multi-ingredient recipe creation with raw materials and intermediate products
- Comprehensive ingredient selection with quantity and unit management
- Interactive "What Can I Make?" feature with ingredient availability analysis
- Detailed ingredient information dialog with quantity requirements and availability status
- Instructions management with step-by-step procedures
- Recipe categorization and organization
- Yield quantity and unit specification
- Preparation and cooking time tracking
- Recipe versioning and active/inactive status management
- Cost analysis functionality with ingredient cost breakdown
- "What Can I Make?" analyzer - discover recipes based on available inventory
- Recipe editing with improved UI - ingredients list displayed prominently
- Advanced ingredient form with proper label positioning and Material-UI components
- Real-time ingredient availability checking
- Recipe search and filtering capabilities
- Professional Material-UI interface with tabbed navigation
- Responsive design with mobile-friendly forms
- React Query integration for real-time updates

#### **Units Management System**

- Comprehensive units database (weight, volume, count categories)
- Admin interface for adding/editing units
- Editable dropdowns throughout the application
- Real-time updates across all inventory forms

#### **Database Architecture**

- PostgreSQL database with Prisma ORM
- Complete entity relationships and foreign key constraints
- Database migrations and seeding system
- Type-safe database operations with generated Prisma client

#### **API Infrastructure**

- Express.js REST API with TypeScript
- Real-time CRUD endpoints for all entities
- Comprehensive error handling and validation
- CORS configuration for frontend integration
- API testing dashboard with visual feedback

#### **Development Environment**

- Hot reload for both frontend and backend
- Concurrent development servers (Frontend: 3002, Backend: 8000)
- TypeScript compilation and type checking
- Comprehensive tooling and scripts

### 🚧 Planned Features

#### **Core Inventory Management**

- **Raw Materials**: Track ingredients with batch numbers, expiration dates, suppliers, and storage locations
- **Finished Products**: Manage final products with SKUs, pricing, and packaging information

### Recipe Management

- Create and edit recipes with detailed ingredient lists
- Cost calculation based on current ingredient prices
- Recipe scaling for different batch sizes
- Production time estimates

### Production Planning

- **"What Can I Make"** analyzer - see what products you can make with current inventory
- Order fulfillment calculator
- Production scheduling and batch tracking
- Yield tracking and optimization

### Contamination Tracking

- Report and track contamination incidents
- Forward and backward batch traceability
- Impact assessment for affected products
- Quarantine and resolution management

### Analytics & Reporting

- Real-time dashboard with key metrics
- Expiration alerts and low stock warnings
- Inventory valuation reports
- Production efficiency analytics
- Custom report generation

## Technology Stack

### Frontend

- **React 18** with TypeScript
- **Material-UI (MUI)** for responsive design
- **React Router** for navigation
- **React Query/TanStack Query** for data fetching
- **Zustand** for state management
- **Vite** for build tooling

### Backend

- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **Prisma ORM** with PostgreSQL database
- **JWT** authentication
- **Joi** for data validation
- **bcryptjs** for password hashing

### Database

- **PostgreSQL** with comprehensive schema
- **Prisma** for database migrations and type generation
- Optimized indexes for performance
- ACID compliance for data integrity

## Project Structure

```text
bakery-inventory/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # State management
│   │   ├── utils/          # Helper functions
│   │   ├── types/          # TypeScript definitions
│   │   └── theme/          # Material-UI theme
│   ├── package.json
│   └── vite.config.ts
├── backend/                 # Node.js Express backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Database models
│   │   ├── middleware/     # Auth, validation, etc.
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   └── types/          # TypeScript interfaces
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── package.json
│   └── tsconfig.json
└── package.json            # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Docker Compose included)
- Git

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/Oscarts/backery2-app.git
   cd backery2-app
   ```

2. **Start the database**

   ```bash
   # Start PostgreSQL with Docker Compose
   docker-compose up -d
   ```

3. **Install dependencies and setup**

   ```bash
   # Install all dependencies
   npm install
   cd frontend && npm install
   cd ../backend && npm install

   # Setup the database
   npx prisma generate
   npx prisma db push
   npx ts-node prisma/seed.ts
   ```

4. **Start the development servers**

   ```bash
   # From the root directory
   npm run dev
   ```

   This will start:
   - Frontend: <http://localhost:3002>
   - Backend: <http://localhost:8000>
   - Database: PostgreSQL on <http://localhost:5432>

5. **Test the system**

   Navigate to <http://localhost:3002/api-test> to run the comprehensive API test suite and verify everything is working correctly.

### Environment Setup

The system uses the following default configuration:

- **Frontend**: React + TypeScript + Vite on port 3002
- **Backend**: Express + TypeScript + Prisma on port 8000  
- **Database**: PostgreSQL on port 5432 (via Docker)

### Available Scripts

#### Root Level

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production

#### Backend Commands (from backend/ directory)

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema to database
- `npx ts-node prisma/seed.ts` - Seed database with sample data
- `npx prisma studio` - Open Prisma Studio

#### Frontend Commands (from frontend/ directory)

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Development Status & Roadmap

The application is currently in active development with a working foundation:

### ✅ Phase 1: Foundation & Core System (COMPLETED)

- [x] Project structure and build system
- [x] PostgreSQL database with Prisma ORM
- [x] Express.js API with TypeScript
- [x] React frontend with Material-UI
- [x] Database schema and migrations
- [x] Development environment with hot reload

### ✅ Phase 2: Core Inventory Systems (COMPLETED)

- [x] **Intermediate products management (FULL CRUD)**
- [x] **Raw materials management (FULL CRUD)**
- [x] **Units management system**
- [x] **Settings management (Categories, Suppliers, Storage Locations)**
- [x] **API testing dashboard**
- [x] **Real-time database persistence**
- [x] **Advanced search and filtering**
- [x] **Contamination tracking and alerts**
- [x] **Reorder level management**

### 🚧 Phase 3: Complete Production System (NEXT PRIORITY)

- [ ] Finished products management
- [ ] Enhanced inventory dashboard with real-time metrics
- [ ] Recipe management system
- [ ] Production planning and scheduling

### 📋 Phase 3: Recipe & Production Management (PLANNED)

- [ ] Recipe creation and editing
- [ ] Recipe-ingredient relationships
- [ ] Recipe scaling functionality
- [ ] Cost calculation features
- [ ] Basic production planning

### 📋 Phase 4: Advanced Features (PLANNED)

- [ ] Production scheduling
- [ ] Batch traceability
- [ ] Quality control workflows
- [ ] Advanced reporting and analytics
- [ ] User authentication and permissions

## Environment Variables

### Backend Configuration

The backend uses PostgreSQL with Docker Compose (no manual setup required):

```env
# Database (auto-configured with Docker Compose)
DATABASE_URL="postgresql://username:password@localhost:5432/bakery_inventory"

# Server Configuration  
PORT=8000
NODE_ENV="development"

# CORS Configuration
CORS_ORIGIN="http://localhost:3002"
```

### Development Ports

- **Frontend**: <http://localhost:3002> (Vite dev server)
- **Backend**: <http://localhost:8000> (Express API)
- **Database**: PostgreSQL on localhost:5432
- **API Testing**: <http://localhost:3002/api-test>

## API Endpoints

### Currently Implemented

#### **Intermediate Products**

- `GET /api/intermediate-products` - Get all intermediate products
- `POST /api/intermediate-products` - Create new intermediate product
- `GET /api/intermediate-products/:id` - Get specific intermediate product
- `PUT /api/intermediate-products/:id` - Update intermediate product
- `DELETE /api/intermediate-products/:id` - Delete intermediate product

#### **Categories**

- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

#### **Storage Locations**

- `GET /api/storage-locations` - Get all storage locations
- `POST /api/storage-locations` - Create new storage location
- `PUT /api/storage-locations/:id` - Update storage location
- `DELETE /api/storage-locations/:id` - Delete storage location

#### **Units**

- `GET /api/units` - Get all units
- `POST /api/units` - Create new unit
- `PUT /api/units/:id` - Update unit
- `DELETE /api/units/:id` - Delete unit (soft delete)

### Planned Endpoints

#### **Raw Materials**

- `GET/POST /api/raw-materials` - Raw materials CRUD

#### **Finished Products**

- `GET/POST /api/finished-products` - Finished products CRUD

#### **Recipes & Production**

- `GET/POST /api/recipes` - Recipe management
- `POST /api/production/what-can-i-make` - Production analysis
- `POST /api/production/order-fulfillment` - Order planning

#### **Analytics**

- `GET /api/dashboard/summary` - Dashboard data
- `GET /api/reports/expiration` - Expiration reports
- `GET /api/reports/inventory-valuation` - Inventory value

## Contributing

This project is currently in active development. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Repository Information

- **GitHub**: <https://github.com/Oscarts/backery2-app>
- **Owner**: Oscarts
- **Current Branch**: main
- **Last Updated**: August 25, 2025

## Support

For questions or issues:

1. Check the API testing dashboard at <http://localhost:3002/api-test>
2. Review the database with Prisma Studio: `npx prisma studio`
3. Create an issue in the GitHub repository

---

**Note**: This system is currently in active development with working intermediate products management and a complete database backend. The foundation is solid and ready for continued feature development.
