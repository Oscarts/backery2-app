# Bakery Inventory Management System - AI Agent Instructions

## Project Overview

Production-ready multi-tenant bakery inventory management system with React TypeScript frontend, Express.js backend, PostgreSQL with Prisma ORM. Supports production tracking, recipe costing, customer orders, and role-based access control.

## Critical Architecture Principles

### Multi-Tenant Security (NON-NEGOTIABLE)
**ALWAYS filter database queries by `clientId`** - this is the tenant isolation boundary:
```typescript
// ✅ CORRECT - Tenant-safe query
const items = await prisma.rawMaterial.findMany({
  where: { clientId: req.user!.clientId, /* other filters */ }
});

// ❌ WRONG - Exposes cross-tenant data
const items = await prisma.rawMaterial.findMany({
  where: { /* missing clientId filter */ }
});
```
- All GET/CREATE/UPDATE/DELETE operations MUST verify `clientId`
- Use `req.user!.clientId` from JWT middleware (see [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts))
- Never use `findUnique` by ID alone - use `findFirst` with `clientId` filter
- Related data queries (nested includes) must also filter by `clientId`

### SKU System Architecture
The SKU system maintains **stable, reusable identifiers** across all inventory items:
- SKUs are derived from product names (e.g., "Chocolate Chips" → "CHOCOLATE-CHIPS")
- **Same name = same SKU** across raw materials and finished products within a tenant
- Rename operations preserve SKU consistency (see [backend/src/services/skuService.ts](backend/src/services/skuService.ts))
- Batch numbers are separate - they provide traceability for specific purchases
- Persist mappings in `SkuMapping` table to survive deletion of all items

### Database Safety Protocol
**NEVER run destructive operations without explicit confirmation:**
- Use `SKIP_CONFIRM=true` environment variable for faster development (see backend/.env)
- Single seed file: `backend/prisma/seed.ts` - never create alternative seed files
- Use backup scripts before risky operations: `npm run db:backup` (backend)
- Migrations must include `IF EXISTS` / `IF NOT EXISTS` to avoid conflicts
- Check for duplicate migrations before creating new ones

## Development Workflows

### Quick Start (Daily Development)
```bash
./start-with-data.sh  # Preserves existing data, starts servers
```
Servers run at:
- Frontend: `http://localhost:3002` (React/Vite)
- Backend: `http://localhost:8000` (Express API)

### Clean Reset (Troubleshooting)
```bash
./reset-and-start.sh  # Drops DB, recreates schema, seeds data
```

### Testing Strategy
```bash
# Backend tests (Jest + Supertest)
cd backend && npm test

# Run specific test file
npx jest test-production-workflow.js

# With coverage
npm run test:coverage
```
**Backend test pattern:** Tests use isolated app instance (app.ts) without starting server to avoid EADDRINUSE conflicts. See [backend/src/app.ts](backend/src/app.ts) vs [backend/src/index.ts](backend/src/index.ts).

### Database Operations
```bash
# Generate Prisma client after schema changes
cd backend && npm run db:generate

# Create migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Seed database (skip confirmation for development)
npm run db:seed:force
```

## Code Patterns & Conventions

### Controller Pattern (Backend)
All controllers follow this structure (example: [rawMaterialController.ts](backend/src/controllers/rawMaterialController.ts)):
```typescript
export const entityController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.user!.clientId; // From JWT middleware
    const items = await prisma.entity.findMany({
      where: { clientId, /* filters */ },
      include: { /* relations */ }
    });
    res.json({ success: true, data: items });
  },
  
  create: async (req: Request, res: Response) => {
    // Validate with Joi schema first
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ success: false, error });
    
    const created = await prisma.entity.create({
      data: { ...value, clientId: req.user!.clientId }
    });
    res.status(201).json({ success: true, data: created });
  }
};
```

### API Response Format (Consistent)
```typescript
// Success
{ success: true, data: T }

// Paginated
{ success: true, data: T[], pagination: { page, limit, total } }

// Error
{ success: false, error: string, details?: any }
```

### Frontend Data Fetching Pattern
Use React Query for all API calls (see [frontend/src/services/api.ts](frontend/src/services/api.ts)):
```typescript
// In component
const { data, isLoading, error } = useQuery({
  queryKey: ['raw-materials', filters],
  queryFn: () => rawMaterialsApi.getAll(filters)
});

// Mutations with invalidation
const { mutate } = useMutation({
  mutationFn: rawMaterialsApi.create,
  onSuccess: () => queryClient.invalidateQueries(['raw-materials'])
});
```

### Material-UI Styling
Use `sx` prop for component-specific styling (avoid `styled()`):
```typescript
<Box sx={{ display: 'flex', gap: 2, p: 3 }}>
  <Button variant="contained" color="primary">Action</Button>
</Box>
```

## Key Integration Points

### Production System
Complex multi-step workflow with dynamic step customization:
- Production runs support single or multi-batch processing
- Steps are customizable per run (template-based, see [productionStepTemplateController.ts](backend/src/controllers/productionStepTemplateController.ts))
- Inventory deduction happens on production completion
- Material traceability tracks raw materials → finished products
- Cost calculation includes raw materials + overhead (labor, utilities)

### Customer Orders
- Orders track products, quantities, prices, markup percentages
- Status flow: `DRAFT` → `CONFIRMED` → `FULFILLED`
- Export functionality for PDF/Excel invoices
- Inline materials tab shows cost breakdown and traceability
- See [CUSTOMER_ORDERS_IMPLEMENTATION_GUIDE.md](CUSTOMER_ORDERS_IMPLEMENTATION_GUIDE.md)

### Authentication & Permissions
- JWT-based auth with `clientId` in token payload
- Role-based permissions stored in `Role` and `RolePermission` tables
- Super admin role (system client) can manage all tenants
- Protected routes use [authenticate](backend/src/middleware/auth.ts) middleware
- Frontend checks permissions via role resource/action mappings

## Common Pitfalls to Avoid

1. **Missing `clientId` filter** - Always causes tenant data leakage
2. **Using `findUnique` alone** - Bypasses tenant isolation, use `findFirst` with `clientId`
3. **Forgetting Joi validation** - Results in database constraint errors downstream
4. **Not invalidating React Query cache** - UI shows stale data after mutations
5. **Hardcoding status values** - Use database-driven enums (QualityStatus, ProductionStepTemplate)
6. **Ignoring SKU consistency** - Name changes must call `resolveSkuOnRename()`
7. **Starting server in tests** - Causes EADDRINUSE errors, use app instance only
8. **Creating multiple seed files** - Only modify `backend/prisma/seed.ts`, never create alternatives
9. **Committing temporal docs** - Never commit `*_PROGRESS.md`, `*_STATUS.md`, `*_SUMMARY.md` files

## Essential Documentation References

**Before making changes, read these in order:**
1. [README.md](README.md) - Project overview & quick start
2. [CODE_GUIDELINES.md](CODE_GUIDELINES.md) - Security audit checklist & data safety rules ⚠️
3. [CONTRIBUTING.md](CONTRIBUTING.md) - Maintenance guidelines & best practices
4. [docs/development-guidelines.md](docs/development-guidelines.md) - Coding standards & architecture
5. [docs/technical-architecture.md](docs/technical-architecture.md) - System design & schema
6. [docs/api-reference.md](docs/api-reference.md) - Complete API documentation

**For specific features:**
- Customer Orders: [CUSTOMER_ORDERS_QUICK_START.md](CUSTOMER_ORDERS_QUICK_START.md)
- Production System: [DYNAMIC_STEP_MANAGEMENT.md](DYNAMIC_STEP_MANAGEMENT.md)
- Role Permissions: [ROLE_TEMPLATES_QUICK_START.md](ROLE_TEMPLATES_QUICK_START.md)
- Unit Management: [UNIT_MANAGEMENT_SYSTEM.md](UNIT_MANAGEMENT_SYSTEM.md)

**Database & Operations:**
- Seed System: [backend/SEED_SYSTEM_VERIFIED.md](backend/SEED_SYSTEM_VERIFIED.md)
- Database Safety: [DATABASE_SAFETY.md](DATABASE_SAFETY.md)
- Production Deployment: [DEPLOYMENT_PRODUCTION.md](DEPLOYMENT_PRODUCTION.md) (Neon + Render + Vercel)
- Dev/Test Deployment: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

## Tech Stack Quick Reference

- **Frontend:** React 18, TypeScript, Material-UI v5, React Query, Zustand, Vite
- **Backend:** Express.js, TypeScript, Prisma ORM, JWT, Joi validation
- **Database:** PostgreSQL with Prisma migrations
- **Testing:** Jest (backend), Supertest (API testing)
- **Production Deployment:** Neon (database) + Render (backend) + Vercel (frontend)
- **See:** [DEPLOYMENT_PRODUCTION.md](DEPLOYMENT_PRODUCTION.md) for production setup
