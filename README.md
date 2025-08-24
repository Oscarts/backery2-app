# Bakery Inventory Management System

A comprehensive inventory management web application specifically designed for bakery and chocolate businesses. This system tracks raw materials, intermediate products, and finished goods with features for expiration tracking, recipe management, contamination monitoring, and production planning.

## Features

### Core Inventory Management
- **Raw Materials**: Track ingredients with batch numbers, expiration dates, suppliers, and storage locations
- **Intermediate Products**: Monitor semi-processed items with quality control status
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

```
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
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bakery-inventory
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up the database**
   ```bash
   # Copy environment variables
   cp backend/.env.example backend/.env
   
   # Edit backend/.env with your database credentials
   # DATABASE_URL="postgresql://username:password@localhost:5432/bakery_inventory"
   
   # Generate Prisma client and run migrations
   npm run db:generate
   npm run db:migrate
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

### Available Scripts

#### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both frontend and backend for production
- `npm run install:all` - Install dependencies for all packages

#### Database Commands
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

#### Frontend (from frontend/ directory)
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

#### Backend (from backend/ directory)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server

## Development Phases

The application is being developed in phases:

### ✅ Phase 1: Foundation
- [x] Project structure and build system
- [x] Basic UI layout and navigation
- [x] Database schema design
- [x] Authentication framework
- [x] Development environment setup

### 🚧 Phase 2: Core Inventory (In Progress)
- [ ] Raw materials CRUD operations
- [ ] Intermediate products management
- [ ] Finished products tracking
- [ ] Basic inventory dashboard
- [ ] Expiration tracking and alerts

### 📋 Phase 3: Recipe Management (Planned)
- [ ] Recipe creation and editing
- [ ] Recipe-ingredient relationships
- [ ] Recipe scaling functionality
- [ ] Cost calculation features

### 📋 Phase 4: Production Planning (Planned)
- [ ] "What can I make" analyzer
- [ ] Order fulfillment calculator
- [ ] Production time estimation
- [ ] Basic production scheduling

### 📋 Phase 5: Contamination Tracking (Planned)
- [ ] Contamination incident reporting
- [ ] Batch traceability system
- [ ] Impact analysis and alerts
- [ ] Resolution tracking

### 📋 Phase 6: Advanced Features (Planned)
- [ ] Advanced reporting and analytics
- [ ] Data export/import functionality
- [ ] System customization options
- [ ] Performance optimization

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/bakery_inventory"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# CORS
CORS_ORIGIN="http://localhost:3000"
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh JWT token

### Inventory Management
- `GET/POST /api/raw-materials` - Raw materials CRUD
- `GET/POST /api/intermediate-products` - Intermediate products CRUD
- `GET/POST /api/finished-products` - Finished products CRUD

### Recipes & Production
- `GET/POST /api/recipes` - Recipe management
- `POST /api/production/what-can-i-make` - Production analysis
- `POST /api/production/order-fulfillment` - Order planning

### Analytics
- `GET /api/dashboard/summary` - Dashboard data
- `GET /api/reports/expiration` - Expiration reports
- `GET /api/reports/inventory-valuation` - Inventory value

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email [your-email] or create an issue in the repository.

---

**Note**: This is a development version. Features are being implemented progressively according to the development phases outlined above.
