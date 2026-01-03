# Bakery Inventory Management System

> **Production Ready** | **Version 1.0.0** | **September 2025**

A comprehensive, full-stack inventory management solution designed specifically for bakery and chocolate businesses with real-time production tracking, quality management, and business analytics.

## ✨ Key Features

- 🍞 **Complete Inventory Management** - Raw materials, intermediate products, and finished goods
- 🏭 **Production Workflow Engine** - Real-time production run tracking with customizable steps
- 📊 **Business Analytics** - Real-time dashboard with inventory metrics and production insights
- 🔍 **Quality Management** - Comprehensive quality tracking and contamination monitoring
- 📝 **Recipe Management** - Advanced cost calculation with overhead, SKU system, and "What Can I Make?" functionality
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

## 🗄️ Database Reset Procedures

### Essential Reading for Development

**MANDATORY READING ORDER:**

1. **[CODE_GUIDELINES.md](./CODE_GUIDELINES.md)** - Security audit checklist & data safety rules ⚠️
2. **[Development Guidelines](./docs/development-guidelines.md)** - Critical coding standards and testing requirements
3. **[Technical Architecture](./docs/technical-architecture.md)** - System architecture and schema design
4. **[API Reference](./docs/api-reference.md)** - Complete backend API documentation
5. **[Project Overview](./docs/project-overview.md)** - Complete project description and status

### Feature-Specific Guides

- **[Customer Orders Quick Start](./CUSTOMER_ORDERS_QUICK_START.md)** - Order management system
- **[Customer Orders Testing Guide](./CUSTOMER_ORDERS_TESTING_GUIDE.md)** - Testing procedures
- **[Role Templates Quick Start](./ROLE_TEMPLATES_QUICK_START.md)** - Permission system
- **[Unit Management System](./UNIT_MANAGEMENT_SYSTEM.md)** - Unit conversion and management
- **[Dynamic Step Management](./DYNAMIC_STEP_MANAGEMENT.md)** - Production workflow customization

### Operations & Maintenance

- **[Database Safety](./DATABASE_SAFETY.md)** - Backup/restore procedures ⚠️
- **[DEPLOYMENT_PRODUCTION.md](./DEPLOYMENT_PRODUCTION.md)** - 🚀 **Official Production Deployment** (Neon + Render + Vercel)
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Alternative deployment options (development/testing)
- **[Super Admin Guide](./SUPER_ADMIN_GUIDE.md)** - Platform administration
- **[Data Persistence](./docs/data-persistence.md)** - Database schema and relationships
- **[Troubleshooting VS Code](./docs/troubleshooting-vscode-freeze.md)** - Fix VS Code freezing and performance issues

### Deployment Checklist

**Ready to deploy to production?** Follow these steps:

1. ✅ Read [DEPLOYMENT_PRODUCTION.md](./DEPLOYMENT_PRODUCTION.md) completely
2. ✅ Create accounts: [Neon](https://neon.tech), [Render](https://render.com), [Vercel](https://vercel.com)
3. ✅ Set up Neon PostgreSQL database (Phase 1)
4. ✅ Deploy backend to Render (Phase 2)
5. ✅ Deploy frontend to Vercel (Phase 3)
6. ✅ Configure GitHub backups (Phase 4)
7. ✅ Run deployment verification script
8. ✅ Test production environment end-to-end

## 🎯 Key Principles

- **Always use Real API** - Never mock data, always connect to actual database
- **Test-Driven Development** - Every feature must have unit tests
- **Documentation First** - Read docs before coding, update docs after coding
- **Consistency** - Follow established patterns for UI, API, and code structure

## 📁 Project Structure

- `frontend/` - React TypeScript frontend with Material UI
- `backend/` - Express TypeScript backend with Prisma ORM
- `docs/` - Project documentation
- `*.sh` - Utility scripts for setup and maintenance ok
  
## ✨ Features

- Raw materials inventory tracking
- Intermediate products management
- Finished products catalog
  - Inline Materials tab with real-time cost & traceability summary
  - Refresh button to re-fetch material/cost breakdown
  - In-production warning prompting completion before trusting costs
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

## 🎨 Design System

RapidPro features a modern, rounded design system with consistent styling across all components:

- **Brand Identity**: Professional navy blue + vibrant orange color scheme
- **Typography**: Inter font family with responsive scale
- **Rounded UI**: Modern 8-20px border radius system for friendly, approachable interface
- **Responsive**: Mobile-first design that works on all screen sizes

**Documentation**:
- 📘 [`frontend/DESIGN_SYSTEM.md`](./frontend/DESIGN_SYSTEM.md) - Complete design guidelines
-  [`frontend/src/theme/designTokens.ts`](./frontend/src/theme/designTokens.ts) - Design token source code

## 🚨 Critical Guidelines

- Backend server must run on `http://localhost:8000`
- Frontend uses `realApi.ts` - never `mockApi.ts`
- All features require unit tests before marking as complete
- Update development progress tracking after every completed feature
- When viewing a Finished Product's Materials tab while status is IN_PRODUCTION, costs may be provisional; complete production to finalize.
- Use the Refresh button in the Materials tab after completing production to pull definitive cost breakdown.

## � User Roles

### Super Admin (Platform Administrator)
**Purpose**: Manage the multi-tenant platform and clients

**Credentials**:
- Email: `superadmin@system.local`
- Password: `super123`
- Client: System

**Can Do**:
- ✅ Manage all bakery clients (create, edit, delete)
- ✅ Manage users across all clients
- ✅ Create and edit roles with custom permissions
- ✅ Configure platform-wide settings

**Cannot Do**:
- ❌ Access bakery operations (raw materials, recipes, production)
- ❌ View dashboards or reports
- ❌ Manage customer orders or inventory

### Bakery Admin (Bakery Operations)
**Purpose**: Full access to bakery operations within their client

**Credentials**:
- Email: `admin@demobakery.com`
- Password: `admin123`
- Client: Demo Bakery

**Can Do**:
- ✅ Full access to all bakery operations
- ✅ Manage inventory, recipes, production
- ✅ Create and manage customer orders
- ✅ View dashboards and generate reports
- ✅ Manage users within their bakery

**📖 Full Documentation**: See [SUPER_ADMIN_GUIDE.md](./SUPER_ADMIN_GUIDE.md) for complete role comparison.

---
## 🎨 Role Templates System

**Role templates** are standardized roles that are automatically copied to every new bakery client.

### How It Works

1. **Templates live in System client** - marked with `isSystem: true`
2. **New clients get copies** - All templates (except Super Admin) are copied automatically
3. **4 Standard Templates:**
   - **Admin** (33 permissions) - Full bakery operations
   - **Sales Manager** (14 permissions) - Customers & orders
   - **Inventory Manager** (12 permissions) - Raw materials & finished products
   - **Production Manager** (12 permissions) - Recipes & production

### Managing Templates

```bash
# Create/update templates in System client
npm run setup:role-templates

# Templates are automatically created during seed
npm run db:seed

# Templates are copied when creating new clients
# (happens automatically via clientController.ts)
```

 **[Database Safety](./DATABASE_SAFETY.md)** - Backup/restore procedures ⚠️
 
### Local Development Database Reset

For a clean local database reset (drops, recreates, migrates, and seeds) use the canonical helper:

```bash
# Run the canonical reinit script (creates backup, drops DB, applies migrations, seeds)
bash scripts/reinit-db.sh
```
The canonical script performs these exact, tested steps:

- Back up the current local DB (uses `backend/scripts/backup-local-db.sh`)
- Terminate other connections to the `bakery_inventory` DB
- Drop and recreate the `bakery_inventory` DB using the `postgres` maintenance DB
- Apply migrations non-interactively with `npx prisma migrate deploy`
- Run the forced seed `npm run db:seed:force`
- Aborts if `NODE_ENV=production` for safety

Notes:
- Old scripts like `reset-db-local.sh` and `reset-and-start.sh` have been archived into `scripts/archive-YYYYMMDD/` to avoid accidental use. Use `scripts/reinit-db.sh` exclusively for reinitialization.

### Incident & Runbook

If you encounter migration failures during a local reset (for example "relation \"categories\" already exists"), follow the incident runbook before retrying:

- Create a backup: `cd backend && npm run db:backup` (backups stored under `/Users/oscar/backups/bakery_inventory/`).
- Review the remediation document: `docs/DB_RESET_INCIDENT.md` for details and fixes applied.
- Archive temporary verification/debug scripts before re-running destructive commands: `./scripts/archive-deprecated.sh` (review `scripts/archive-YYYYMMDD/` after running).
- Apply migrations non-interactively: `cd backend && npx prisma migrate deploy --schema prisma/schema.prisma`.
- Run the forced seed: `cd backend && npm run db:seed:force`.

We added `scripts/archive-deprecated.sh` and `docs/DB_RESET_INCIDENT.md` to help prevent and document these failures — review them when performing destructive DB operations.

### Production Database Reset (Destructive)

**WARNING: This will erase ALL production data. Only perform a full reinitialization in production after following the runbook, obtaining explicit approvals, and creating verified backups.**

We provide a controlled, auditable procedure for production reinitialization located in `docs/PRODUCTION_REINIT.md`. Follow that runbook exactly — it lists pre-flight checks, required approvals, backup steps, maintenance-mode recommendations, post-run verification, and rollback instructions.

Key safeguards (summary):

- Always create and verify a backup before any destructive operation (`npm run db:backup` or cloud snapshot).
- Only run the production reinit helper when the following are true:
  - You have explicit written approval from the release owner or Ops lead.
  - A verified backup is available and accessible.
  - The environment is in maintenance mode (no user traffic).
  - You have a validated restore plan and test restore procedure.
- The repository contains a guarded helper script `scripts/reinit-db-production.sh` which refuses to run unless multiple explicit safeguards are present (`SKIP_CONFIRM=true` and a local allowfile `/tmp/ALLOW_PROD_REINIT`), and it logs every step.

DO NOT run production resets ad-hoc. Review `docs/PRODUCTION_REINIT.md` and coordinate with your team.

See [CODE_GUIDELINES.md](./CODE_GUIDELINES.md) and [CONTRIBUTING.md](./CONTRIBUTING.md) for security and maintenance rules. For full backup/restore procedures consult [DATABASE_SAFETY.md](./DATABASE_SAFETY.md).
- API Testing Dashboard now includes traceability and production health checks—run regularly after backend changes.

Edit templates to change what permissions new clients get:

1. **Option A: Edit Script** - Modify `backend/scripts/create-role-templates.ts`
2. **Option B: Edit Seed** - Modify `createRoleTemplates()` function in `backend/prisma/seed.ts`
3. Run `npm run setup:role-templates` to apply changes

**Important**: Changes to templates only affect NEW clients. Existing clients keep their current roles.

**📖 Full Guide**: See [ROLE_TEMPLATES_QUICK_START.md](./ROLE_TEMPLATES_QUICK_START.md) for details.

---
## �🔒 Database Safety & Backups

**⚠️ IMPORTANT**: Your database is protected from accidental data loss!

- **Automatic Backups**: Daily at 2:00 AM ✅
- **Retention**: Last 7 days of backups
- **Location**: `/Users/oscar/backups/bakery_inventory/`

**Quick Commands:**
```bash
# Manual backup NOW
npm run db:backup

# List available backups
npm run db:restore

# Restore from backup
npm run db:restore /Users/oscar/backups/bakery_inventory/backup_YYYYMMDD_HHMMSS.sql.gz

# Quick seed (skip confirmation)
npm run db:seed:force
```

**📖 Full Documentation**: See [DATABASE_SAFETY.md](./DATABASE_SAFETY.md) for complete backup/restore procedures, emergency recovery, and safety features.
- API Testing Dashboard now includes traceability and production health checks—run regularly after backend changes.

## 🧪 API Testing Dashboard Enhancements

The `ApiTest` page provides rapid, in-browser validation of key backend flows.

Recently added tests:

- Finished Product Materials Traceability: Verifies `/finished-products/:id/materials` returns materials, summary, and costs.
- Production Workflow (Light): Placeholder system health probe (extendable to full run lifecycle).
- Production Contamination Check: Lists contaminated finished products (if any).
- Production Capacity Check: Quick count of finished products for capacity sanity.

Traceability Test Tips:

1. Create or complete a finished product so it has a production run.
2. Run tests; if skipped, ensure at least one COMPLETED product exists.
3. After allocating & completing a production run elsewhere, hit Refresh within the product Materials tab and re-run the traceability test for updated costs.

Planned (optional future): deeper production workflow simulation and per-test execution controls.

## 🛠️ Development Requirements

For local development, ensure you have:

1. Node.js (v16+)
2. npm (v7+)
3. PostgreSQL (v13+)

## 📞 Need Help?

Check the relevant documentation section first. If the information isn't there, it should be added to maintain project knowledge.

## License

Copyright © 2025 Bakery Inventory Management
