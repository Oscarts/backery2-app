# SKU Reference Entity - Complete Implementation Plan

**Branch:** `feature/full-sku-reference-entity`  
**Status:** 🚀 Ready to Implement  
**Estimated Time:** 10-14 hours  
**Last Updated:** January 9, 2026

---

## 🎯 Project Goals

Transform the basic SKU mapping table into a **comprehensive master data template system**:

✅ **Full SKU Reference Entity** with price, units, storage, reorder levels, categories  
✅ **Template-based Creation** - Create raw materials by selecting SKU reference (auto-fills fields)  
✅ **Navigation Reordering** - SKU Reference appears before Raw Materials  
✅ **Complete CRUD Operations** - Full create, read, update, delete with multi-tenant isolation  
✅ **Usage Tracking** - Prevent deletion of SKU references in use  
✅ **Comprehensive Testing** - Backend tests with multi-tenant verification

---

## 📚 Required Reading (COMPLETED)

✅ [README.md](./README.md) - Project overview & architecture  
✅ [CODE_GUIDELINES.md](./CODE_GUIDELINES.md) - **CRITICAL:** Multi-tenant security rules  
✅ [CONTRIBUTING.md](./CONTRIBUTING.md) - Development standards  
✅ [SKU_REFERENCE_QUICK_START.md](./SKU_REFERENCE_QUICK_START.md) - Initial planning document  

**Key Security Rules (NON-NEGOTIABLE):**
- ✅ ALWAYS filter by `clientId` in all database queries
- ✅ ALWAYS use `req.user!.clientId` from JWT middleware
- ✅ Use `findFirst` with `clientId` filter instead of `findUnique`
- ✅ Verify tenant ownership in all UPDATE/DELETE operations

---

## 🏗️ Implementation Phases

### Phase 1: Database Schema (2-3 hours)

#### 1.1 Update Prisma Schema
**File:** `backend/prisma/schema.prisma`

**Current SkuMapping model:**
```prisma
model SkuMapping {
  id          String   @id @default(cuid())
  name        String
  sku         String
  description String?
  category    String?
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([name, clientId])
  @@unique([sku, clientId])
  @@index([name])
  @@index([sku])
  @@index([clientId])
  @@map("sku_mappings")
}
```

**New SkuMapping model (Enhanced):**
```prisma
model SkuMapping {
  id                String            @id @default(cuid())
  name              String            // Product/material name
  sku               String            // SKU code
  description       String?
  
  // Master template fields
  unitPrice         Float?            // Default price
  unit              String?           // Default unit (e.g., "kg", "g", "L")
  reorderLevel      Float?            // Default reorder level
  storageLocationId String?           // Default storage location
  categoryId        String?           // Category reference
  
  clientId          String            // Multi-tenant isolation
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  // Relations
  client            Client            @relation(fields: [clientId], references: [id], onDelete: Cascade)
  storageLocation   StorageLocation?  @relation(fields: [storageLocationId], references: [id], onDelete: SetNull)
  category          Category?         @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  rawMaterials      RawMaterial[]     @relation("SkuReferenceToRawMaterial")
  finishedProducts  FinishedProduct[] @relation("SkuReferenceToFinishedProduct")
  
  @@unique([name, clientId])
  @@unique([sku, clientId])
  @@index([name])
  @@index([sku])
  @@index([clientId])
  @@map("sku_mappings")
}
```

#### 1.2 Update RawMaterial Model
**Add relation to SkuMapping:**
```prisma
model RawMaterial {
  // ... existing fields ...
  
  skuReferenceId    String?           // Reference to SKU master template
  skuReference      SkuMapping?       @relation("SkuReferenceToRawMaterial", fields: [skuReferenceId], references: [id], onDelete: SetNull)
  
  // ... rest of fields ...
}
```

#### 1.3 Update FinishedProduct Model
**Add relation to SkuMapping:**
```prisma
model FinishedProduct {
  // ... existing fields ...
  
  skuReferenceId    String?           // Reference to SKU master template
  skuReference      SkuMapping?       @relation("SkuReferenceToFinishedProduct", fields: [skuReferenceId], references: [id], onDelete: SetNull)
  
  // ... rest of fields ...
}
```

#### 1.4 Update Category Model
**Add relation to SkuMapping:**
```prisma
model Category {
  // ... existing fields ...
  
  skuMappings       SkuMapping[]      // Categories can be used by SKU references
  
  // ... rest of fields ...
}
```

#### 1.5 Update StorageLocation Model
**Add relation to SkuMapping:**
```prisma
model StorageLocation {
  // ... existing fields ...
  
  skuMappings       SkuMapping[]      // Storage locations can be used by SKU references
  
  // ... rest of fields ...
}
```

#### 1.6 Create Migration
```bash
cd backend
npx prisma migrate dev --name add_full_sku_reference_entity
npx prisma generate
```

#### 1.7 Update Seed Data
**File:** `backend/prisma/seed.ts`

Add sample SKU references with full template data:
```typescript
// Create SKU references with template data
const skuReferences = await Promise.all([
  prisma.skuMapping.create({
    data: {
      name: 'Chocolate Chips',
      sku: 'CHOCOLATE-CHIPS',
      description: 'Premium dark chocolate chips',
      unitPrice: 8.50,
      unit: 'kg',
      reorderLevel: 10,
      categoryId: categories[0].id, // Raw Materials category
      storageLocationId: storageLocations[0].id,
      clientId: demoClient.id,
    },
  }),
  // ... more SKU references
]);
```

**Verification Steps:**
- [ ] Run `npx prisma migrate dev`
- [ ] Check migration file created
- [ ] Run `npm run db:seed:force`
- [ ] Open Prisma Studio: `npx prisma studio`
- [ ] Verify `sku_mappings` table has new columns
- [ ] Verify relations work correctly

---

### Phase 2: Backend API (3-4 hours)

#### 2.1 Create SKU Reference Controller
**File:** `backend/src/controllers/skuReferenceController.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../app';
import Joi from 'joi';

// Validation schemas
const createSkuReferenceSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  sku: Joi.string().optional().max(100), // Optional, generated from name if not provided
  description: Joi.string().optional().allow('').allow(null),
  unitPrice: Joi.number().positive().optional().allow(null),
  unit: Joi.string().optional().allow('').allow(null).max(50),
  reorderLevel: Joi.number().min(0).optional().allow(null),
  storageLocationId: Joi.string().optional().allow('').allow(null),
  categoryId: Joi.string().optional().allow('').allow(null),
});

const updateSkuReferenceSchema = createSkuReferenceSchema.fork(
  ['name'],
  (schema) => schema.optional()
);

export const skuReferenceController = {
  // GET /api/sku-references
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      const categoryId = req.query.categoryId as string;

      const skip = (page - 1) * limit;

      const where: any = {
        clientId: req.user!.clientId, // CRITICAL: Tenant isolation
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      const skuReferences = await prisma.skuMapping.findMany({
        where,
        include: {
          category: true,
          storageLocation: true,
          _count: {
            select: {
              rawMaterials: true,
              finishedProducts: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      });

      const total = await prisma.skuMapping.count({ where });

      res.json({
        success: true,
        data: skuReferences,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/sku-references/:id
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const skuReference = await prisma.skuMapping.findFirst({
        where: {
          id,
          clientId: req.user!.clientId, // CRITICAL: Verify tenant ownership
        },
        include: {
          category: true,
          storageLocation: true,
          _count: {
            select: {
              rawMaterials: true,
              finishedProducts: true,
            },
          },
        },
      });

      if (!skuReference) {
        return res.status(404).json({
          success: false,
          error: 'SKU reference not found',
        });
      }

      res.json({
        success: true,
        data: skuReference,
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/sku-references
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = createSkuReferenceSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const clientId = req.user!.clientId;

      // Generate SKU if not provided
      let sku = value.sku;
      if (!sku) {
        sku = value.name
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }

      // Check if SKU already exists for this client
      const existingSku = await prisma.skuMapping.findFirst({
        where: {
          sku,
          clientId,
        },
      });

      if (existingSku) {
        return res.status(400).json({
          success: false,
          error: `SKU "${sku}" already exists for product "${existingSku.name}"`,
        });
      }

      // Check if name already exists for this client
      const existingName = await prisma.skuMapping.findFirst({
        where: {
          name: value.name,
          clientId,
        },
      });

      if (existingName) {
        return res.status(400).json({
          success: false,
          error: `Product name "${value.name}" already exists with SKU "${existingName.sku}"`,
        });
      }

      const skuReference = await prisma.skuMapping.create({
        data: {
          ...value,
          sku,
          clientId,
        },
        include: {
          category: true,
          storageLocation: true,
        },
      });

      res.status(201).json({
        success: true,
        data: skuReference,
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/sku-references/:id
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { error, value } = updateSkuReferenceSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const clientId = req.user!.clientId;

      // Verify ownership
      const existing = await prisma.skuMapping.findFirst({
        where: { id, clientId },
      });

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'SKU reference not found',
        });
      }

      // If name is changing, check for conflicts
      if (value.name && value.name !== existing.name) {
        const nameConflict = await prisma.skuMapping.findFirst({
          where: {
            name: value.name,
            clientId,
            id: { not: id },
          },
        });

        if (nameConflict) {
          return res.status(400).json({
            success: false,
            error: `Product name "${value.name}" already exists`,
          });
        }
      }

      const updated = await prisma.skuMapping.update({
        where: { id },
        data: value,
        include: {
          category: true,
          storageLocation: true,
          _count: {
            select: {
              rawMaterials: true,
              finishedProducts: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/sku-references/:id
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const clientId = req.user!.clientId;

      // Verify ownership
      const skuReference = await prisma.skuMapping.findFirst({
        where: { id, clientId },
        include: {
          _count: {
            select: {
              rawMaterials: true,
              finishedProducts: true,
            },
          },
        },
      });

      if (!skuReference) {
        return res.status(404).json({
          success: false,
          error: 'SKU reference not found',
        });
      }

      // Check if in use
      const totalUsage = 
        skuReference._count.rawMaterials + 
        skuReference._count.finishedProducts;

      if (totalUsage > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot delete SKU reference. It is used by ${skuReference._count.rawMaterials} raw material(s) and ${skuReference._count.finishedProducts} finished product(s)`,
        });
      }

      await prisma.skuMapping.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'SKU reference deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
```

#### 2.2 Create SKU Reference Routes
**File:** `backend/src/routes/skuReferenceRoutes.ts`

```typescript
import express from 'express';
import { skuReferenceController } from '../controllers/skuReferenceController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', skuReferenceController.getAll);
router.get('/:id', skuReferenceController.getById);
router.post('/', skuReferenceController.create);
router.put('/:id', skuReferenceController.update);
router.delete('/:id', skuReferenceController.delete);

export default router;
```

#### 2.3 Register Routes
**File:** `backend/src/app.ts` or `backend/src/index.ts`

```typescript
// Import route
import skuReferenceRoutes from './routes/skuReferenceRoutes';

// Register route (add with other routes)
app.use('/api/sku-references', skuReferenceRoutes);
```

#### 2.4 Update Raw Material Controller
**File:** `backend/src/controllers/rawMaterialController.ts`

Add endpoint to get prefill data from SKU reference:

```typescript
// Add to rawMaterialController object:

// GET /api/raw-materials/prefill/:skuReferenceId
getPrefillFromSku: async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skuReferenceId } = req.params;
    const clientId = req.user!.clientId;

    const skuReference = await prisma.skuMapping.findFirst({
      where: {
        id: skuReferenceId,
        clientId, // CRITICAL: Verify tenant ownership
      },
      include: {
        category: true,
        storageLocation: true,
      },
    });

    if (!skuReference) {
      return res.status(404).json({
        success: false,
        error: 'SKU reference not found',
      });
    }

    // Return prefill data
    res.json({
      success: true,
      data: {
        name: skuReference.name,
        sku: skuReference.sku,
        description: skuReference.description,
        categoryId: skuReference.categoryId,
        storageLocationId: skuReference.storageLocationId,
        unit: skuReference.unit,
        unitPrice: skuReference.unitPrice,
        reorderLevel: skuReference.reorderLevel,
        skuReferenceId: skuReference.id,
      },
    });
  } catch (error) {
    next(error);
  }
},
```

Add route:
```typescript
// In backend/src/routes/rawMaterialRoutes.ts
router.get('/prefill/:skuReferenceId', rawMaterialController.getPrefillFromSku);
```

**Verification Steps:**
- [ ] Test with curl or Postman:
  ```bash
  # Get all SKU references
  curl -H "Authorization: Bearer YOUR_TOKEN" \
    http://localhost:8000/api/sku-references
  
  # Create SKU reference
  curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Product","unitPrice":10.5,"unit":"kg"}' \
    http://localhost:8000/api/sku-references
  
  # Get prefill data
  curl -H "Authorization: Bearer YOUR_TOKEN" \
    http://localhost:8000/api/raw-materials/prefill/SKU_ID
  ```
- [ ] Check response formats match expected structure
- [ ] Verify clientId filtering works (test with different tenants)

---

### Phase 3: Frontend Implementation (4-5 hours)

#### 3.1 Create API Service
**File:** `frontend/src/services/skuReferenceApi.ts`

```typescript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface SkuReference {
  id: string;
  name: string;
  sku: string;
  description?: string;
  unitPrice?: number;
  unit?: string;
  reorderLevel?: number;
  storageLocationId?: string;
  categoryId?: string;
  clientId: string;
  createdAt: string;
  updatedAt: string;
  category?: any;
  storageLocation?: any;
  _count?: {
    rawMaterials: number;
    finishedProducts: number;
  };
}

export interface SkuReferenceFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}

export const skuReferenceApi = {
  getAll: async (filters?: SkuReferenceFilters) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);

    const response = await axios.get(`${API_URL}/api/sku-references?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getById: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/sku-references/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  create: async (data: Partial<SkuReference>) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/api/sku-references`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  update: async (id: string, data: Partial<SkuReference>) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/api/sku-references/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  delete: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/api/sku-references/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getPrefillData: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/api/raw-materials/prefill/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};
```

#### 3.2 Update SKU Reference Page
**File:** `frontend/src/pages/SkuReference.tsx`

Transform from read-only list to full CRUD interface:
- Add "Create SKU Reference" button
- Add Create/Edit dialog with full form
- Add Delete confirmation dialog
- Show usage counts (prevent delete if in use)
- Add filters (search, category)
- Show unit price, storage location, reorder level in table

#### 3.3 Update Raw Materials Page
**File:** `frontend/src/pages/RawMaterials.tsx`

Add "Create from SKU Reference" functionality:
- Add "Create from Template" button alongside normal create
- Add SKU selector dropdown in dialog
- Implement auto-fill when SKU is selected
- Allow manual override of prefilled values
- Show which fields came from template (visual indicator)

#### 3.4 Update Navigation
**File:** `frontend/src/components/Layout.tsx` (or wherever navigation is defined)

Reorder menu items:
```typescript
// OLD ORDER:
// - Dashboard
// - Raw Materials
// - Finished Products
// - SKU Reference

// NEW ORDER:
// - Dashboard
// - SKU Reference  ← MOVED UP
// - Raw Materials
// - Finished Products
```

**Verification Steps:**
- [ ] Can create SKU reference with all fields
- [ ] Can edit existing SKU reference
- [ ] Cannot delete SKU reference in use (shows error)
- [ ] Can delete unused SKU reference
- [ ] Can search and filter SKU references
- [ ] Can create raw material from SKU template
- [ ] Auto-fill works correctly
- [ ] Navigation order is correct
- [ ] All UI is responsive and follows Material-UI patterns

---

### Phase 4: Testing (2-3 hours)

#### 4.1 Backend CRUD Tests
**File:** `backend/test-sku-reference-crud.js`

```javascript
const request = require('supertest');
const app = require('./src/app').default;
const { prisma } = require('./src/app');

describe('SKU Reference CRUD', () => {
  let authToken;
  let testClientId;
  let testCategoryId;
  let testStorageLocationId;
  
  beforeAll(async () => {
    // Login and get token
    // Create test data
  });
  
  afterAll(async () => {
    // Cleanup
    await prisma.$disconnect();
  });
  
  describe('POST /api/sku-references', () => {
    it('should create SKU reference with full template data', async () => {
      // Test implementation
    });
    
    it('should prevent duplicate SKUs', async () => {
      // Test implementation
    });
    
    it('should generate SKU from name if not provided', async () => {
      // Test implementation
    });
  });
  
  describe('GET /api/sku-references', () => {
    it('should return only SKU references for current tenant', async () => {
      // Test multi-tenant isolation
    });
    
    it('should support search filtering', async () => {
      // Test implementation
    });
  });
  
  describe('PUT /api/sku-references/:id', () => {
    it('should update SKU reference', async () => {
      // Test implementation
    });
    
    it('should prevent updating to duplicate name', async () => {
      // Test implementation
    });
  });
  
  describe('DELETE /api/sku-references/:id', () => {
    it('should delete unused SKU reference', async () => {
      // Test implementation
    });
    
    it('should prevent deleting SKU reference in use', async () => {
      // Test implementation
    });
  });
});
```

#### 4.2 Integration Tests
**File:** `backend/test-sku-reference-integration.js`

Test complete workflow:
1. Create SKU reference
2. Create raw material from SKU template
3. Verify auto-fill worked
4. Try to delete SKU reference (should fail - in use)
5. Delete raw material
6. Delete SKU reference (should succeed)

#### 4.3 Multi-Tenant Isolation Tests
**File:** `backend/test-sku-reference-isolation.js`

Test tenant isolation:
1. Create SKU reference as Tenant A
2. Try to access as Tenant B (should fail)
3. Create SKU with same name in Tenant B (should succeed)
4. Verify each tenant only sees their data

**Verification Steps:**
- [ ] All CRUD tests pass
- [ ] Integration tests pass
- [ ] Isolation tests pass
- [ ] No cross-tenant data leakage
- [ ] Edge cases handled (duplicates, deletes, etc.)

---

### Phase 5: Documentation (1 hour)

#### 5.1 Update API Documentation
**File:** `docs/api-reference.md`

Add SKU Reference endpoints:
```markdown
### SKU Reference Endpoints

#### GET /api/sku-references
Get all SKU references for current tenant

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)
- `search` (string): Search by name or SKU
- `categoryId` (string): Filter by category

**Response:**
{
  "success": true,
  "data": [...],
  "pagination": {...}
}

[... continue for all endpoints ...]
```

#### 5.2 Update README Features
**File:** `README.md`

Add SKU Reference to features list:
```markdown
- 🏷️ **SKU Reference Master Data** - Template system for consistent product information
```

#### 5.3 Create User Guide
**File:** `SKU_REFERENCE_USER_GUIDE.md`

Step-by-step guide for users:
- How to create SKU references
- How to use templates when creating raw materials
- Best practices for SKU management
- Troubleshooting common issues

#### 5.4 Update Copilot Instructions
**File:** `.github/copilot-instructions.md`

Add section about SKU Reference system:
```markdown
### SKU Reference System
The SKU reference entity serves as a master template for products:
- Contains default values: price, unit, storage, reorder level
- Raw materials and finished products can reference SKU templates
- SKU references cannot be deleted if in use
- All operations must filter by clientId for multi-tenant isolation
```

---

### Phase 6: Final Review & Deployment (1 hour)

#### 6.1 Pre-Merge Checklist
- [ ] All tests passing
- [ ] No console errors in frontend
- [ ] Multi-tenant isolation verified
- [ ] Documentation updated
- [ ] Code follows existing patterns
- [ ] No security vulnerabilities
- [ ] Performance acceptable (query times < 200ms)

#### 6.2 Code Review Items
- [ ] All database queries include `clientId` filter
- [ ] Validation schemas are comprehensive
- [ ] Error messages are user-friendly
- [ ] API responses follow standard format
- [ ] Frontend components follow Material-UI patterns
- [ ] TypeScript types are properly defined
- [ ] No duplicate code

#### 6.3 Merge to Main
```bash
# Final testing
./start-with-data.sh
# Run through manual test scenarios

# Commit and push
git add .
git commit -m "feat: Add full SKU reference entity system

- Add master template fields to SkuMapping (price, unit, storage, etc.)
- Implement complete CRUD API for SKU references
- Add template-based raw material creation
- Reorder navigation (SKU reference before raw materials)
- Add comprehensive backend tests
- Update documentation

BREAKING CHANGES: Adds new database columns and relations"

git push origin feature/full-sku-reference-entity

# Create PR and merge
git checkout main
git merge feature/full-sku-reference-entity
git push origin main
```

#### 6.4 Production Deployment
Follow [DEPLOYMENT_PRODUCTION.md](./DEPLOYMENT_PRODUCTION.md):
1. Deploy database migration to Neon
2. Deploy backend to Render
3. Deploy frontend to Vercel
4. Run verification tests
5. Monitor for issues

---

## 🚨 Critical Reminders

### Multi-Tenant Security (NON-NEGOTIABLE)
✅ **EVERY database query MUST filter by `clientId`**
✅ **ALWAYS use `req.user!.clientId` from JWT middleware**
✅ **Use `findFirst` with `clientId` filter instead of `findUnique`**
✅ **Verify tenant ownership in UPDATE/DELETE operations**

### Data Safety
✅ **Test migrations on development first**
✅ **Create backup before production deployment**
✅ **Never run `--force-reset` on production**
✅ **Verify seed data doesn't overwrite existing data**

### Code Quality
✅ **Follow existing controller patterns (see rawMaterialController.ts)**
✅ **Use Joi validation for all inputs**
✅ **Return consistent API response format**
✅ **Handle errors with try/catch and next(error)**
✅ **Add TypeScript types for all data structures**

---

## 📊 Success Metrics

✅ **Functionality:**
- Can create/read/update/delete SKU references
- Can create raw materials from SKU templates
- Auto-fill works correctly
- Usage tracking prevents improper deletion

✅ **Security:**
- Multi-tenant isolation verified
- No cross-tenant data access
- All queries filter by clientId

✅ **Quality:**
- All tests passing (CRUD, integration, isolation)
- No console errors
- Performance acceptable (<200ms response times)
- Documentation complete and accurate

✅ **User Experience:**
- Intuitive UI following Material-UI patterns
- Clear error messages
- Responsive design
- Logical navigation order

---

## 🔗 Related Documentation

- [README.md](./README.md) - Project overview
- [CODE_GUIDELINES.md](./CODE_GUIDELINES.md) - Security rules (CRITICAL!)
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development standards
- [DEPLOYMENT_PRODUCTION.md](./DEPLOYMENT_PRODUCTION.md) - Production deployment
- [docs/api-reference.md](./docs/api-reference.md) - API documentation
- [docs/development-guidelines.md](./docs/development-guidelines.md) - Coding standards

---

## 📝 Implementation Log

Track progress here as you implement:

- [ ] Phase 1: Database Schema
- [ ] Phase 2: Backend API
- [ ] Phase 3: Frontend Implementation
- [ ] Phase 4: Testing
- [ ] Phase 5: Documentation
- [ ] Phase 6: Deployment

---

**Last Updated:** January 9, 2026  
**Estimated Total Time:** 10-14 hours  
**Status:** 🚀 Ready to Implement
