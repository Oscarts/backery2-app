# SKU Reference Entity - Full Implementation Plan

**Branch:** `feature/full-sku-reference-entity`  
**Status:** Planning Phase  
**Estimated Time:** 8-12 hours  
**Priority:** High - Foundation for improved inventory management

---

## 📋 Overview

Transform the current basic `SkuMapping` table into a full-featured **SKU Reference** entity that serves as a master template for raw materials and finished products.

### Current State
- ✅ Basic `SkuMapping` table exists with: `name`, `sku`, `description`, `category`, `clientId`
- ✅ Multi-tenant isolation already implemented
- ✅ Basic SKU reference page exists (read-only)

### Target State
- 🎯 Complete SKU Reference entity with pricing, units, storage, reorder levels
- 🎯 Full CRUD operations (Create, Read, Update, Delete)
- 🎯 Auto-fill raw material creation from SKU reference
- 🎯 Reorganized navigation (SKU Reference before Raw Materials)
- 🎯 Comprehensive tests for all operations

---

## 🗂️ Phase 1: Database Schema Updates (2 hours)

### 1.1 Extend SkuMapping Model

**File:** `backend/prisma/schema.prisma`

```prisma
model SkuMapping {
  id                String          @id @default(cuid())
  name              String          // Product/material name
  sku               String          // Unique identifier
  description       String?
  
  // NEW FIELDS
  unitPrice         Float?          // Default price per unit
  unit              String?         // Default unit (kg, L, pcs, etc.)
  reorderLevel      Float?          // Minimum stock level
  storageLocationId String?         // Default storage location
  categoryId        String?         // Structured category reference
  
  // Existing fields
  clientId          String          // Multi-tenant isolation
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  
  // Relations
  client            Client          @relation(fields: [clientId], references: [id], onDelete: Cascade)
  storageLocation   StorageLocation? @relation(fields: [storageLocationId], references: [id], onDelete: SetNull)
  category          Category?       @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  rawMaterials      RawMaterial[]   // Track which raw materials use this SKU
  finishedProducts  FinishedProduct[] // Track which finished products use this SKU
  
  @@unique([name, clientId])
  @@unique([sku, clientId])
  @@index([name])
  @@index([sku])
  @@index([clientId])
  @@index([categoryId])
  @@index([storageLocationId])
  @@map("sku_mappings")
}
```

### 1.2 Update Related Models

**Add to RawMaterial:**
```prisma
model RawMaterial {
  // ... existing fields
  skuReferenceId String?           // Optional reference to SKU template
  skuReference   SkuMapping? @relation(fields: [skuReferenceId], references: [id], onDelete: SetNull)
  
  @@index([skuReferenceId])
}
```

**Add to FinishedProduct:**
```prisma
model FinishedProduct {
  // ... existing fields
  skuReferenceId String?           // Optional reference to SKU template
  skuReference   SkuMapping? @relation(fields: [skuReferenceId], references: [id], onDelete: SetNull)
  
  @@index([skuReferenceId])
}
```

**Add to Category and StorageLocation:**
```prisma
model Category {
  // ... existing relations
  skuMappings SkuMapping[]
}

model StorageLocation {
  // ... existing relations
  skuMappings SkuMapping[]
}
```

### 1.3 Migration Strategy

**Migration file:** `backend/prisma/migrations/YYYYMMDD_extend_sku_reference_entity/migration.sql`

```sql
-- Step 1: Add new nullable columns
ALTER TABLE "sku_mappings" ADD COLUMN "unitPrice" DOUBLE PRECISION;
ALTER TABLE "sku_mappings" ADD COLUMN "unit" TEXT;
ALTER TABLE "sku_mappings" ADD COLUMN "reorderLevel" DOUBLE PRECISION;
ALTER TABLE "sku_mappings" ADD COLUMN "storageLocationId" TEXT;
ALTER TABLE "sku_mappings" ADD COLUMN "categoryId" TEXT;

-- Step 2: Add foreign key constraints
ALTER TABLE "sku_mappings" 
ADD CONSTRAINT "sku_mappings_storageLocationId_fkey" 
FOREIGN KEY ("storageLocationId") 
REFERENCES "storage_locations"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sku_mappings" 
ADD CONSTRAINT "sku_mappings_categoryId_fkey" 
FOREIGN KEY ("categoryId") 
REFERENCES "categories"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 3: Add indexes
CREATE INDEX "sku_mappings_categoryId_idx" ON "sku_mappings"("categoryId");
CREATE INDEX "sku_mappings_storageLocationId_idx" ON "sku_mappings"("storageLocationId");

-- Step 4: Add reference fields to raw_materials and finished_products
ALTER TABLE "raw_materials" ADD COLUMN "skuReferenceId" TEXT;
ALTER TABLE "finished_products" ADD COLUMN "skuReferenceId" TEXT;

ALTER TABLE "raw_materials" 
ADD CONSTRAINT "raw_materials_skuReferenceId_fkey" 
FOREIGN KEY ("skuReferenceId") 
REFERENCES "sku_mappings"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "finished_products" 
ADD CONSTRAINT "finished_products_skuReferenceId_fkey" 
FOREIGN KEY ("skuReferenceId") 
REFERENCES "sku_mappings"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "raw_materials_skuReferenceId_idx" ON "raw_materials"("skuReferenceId");
CREATE INDEX "finished_products_skuReferenceId_idx" ON "finished_products"("skuReferenceId");
```

**Test migration:**
```bash
cd backend
npm run db:generate
npx prisma migrate dev --name extend_sku_reference_entity
```

---

## 🔧 Phase 2: Backend API Implementation (3 hours)

### 2.1 Create SKU Reference Controller

**File:** `backend/src/controllers/skuReferenceController.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import prisma from '../lib/prisma';

// Validation schema
const skuReferenceSchema = Joi.object({
  name: Joi.string().required().trim(),
  sku: Joi.string().optional().trim(),
  description: Joi.string().optional().allow('', null),
  unitPrice: Joi.number().min(0).optional().allow(null),
  unit: Joi.string().optional().allow('', null),
  reorderLevel: Joi.number().min(0).optional().allow(null),
  storageLocationId: Joi.string().optional().allow('', null),
  categoryId: Joi.string().optional().allow('', null),
});

export const skuReferenceController = {
  // GET /api/sku-references
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clientId = req.user!.clientId;
      const { page = 1, limit = 25, search, categoryId } = req.query;

      const where: any = { clientId };
      
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { sku: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }
      
      if (categoryId) {
        where.categoryId = categoryId as string;
      }

      const [items, total] = await Promise.all([
        prisma.skuMapping.findMany({
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
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.skuMapping.count({ where }),
      ]);

      res.json({
        success: true,
        data: items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
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
      const clientId = req.user!.clientId;

      const item = await prisma.skuMapping.findFirst({
        where: { id, clientId },
        include: {
          category: true,
          storageLocation: true,
          rawMaterials: {
            select: { id: true, name: true, batchNumber: true },
            take: 10,
          },
          finishedProducts: {
            select: { id: true, name: true },
            take: 10,
          },
        },
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          error: 'SKU reference not found',
        });
      }

      res.json({ success: true, data: item });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/sku-references
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error, value } = skuReferenceSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const clientId = req.user!.clientId;
      
      // Generate SKU if not provided
      const sku = value.sku || generateSkuFromName(value.name);

      // Check for duplicate SKU
      const existing = await prisma.skuMapping.findFirst({
        where: { sku, clientId },
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'SKU already exists for this client',
        });
      }

      const item = await prisma.skuMapping.create({
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
        data: item,
        message: 'SKU reference created successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/sku-references/:id
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
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

      const { error, value } = skuReferenceSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details[0].message,
        });
      }

      const item = await prisma.skuMapping.update({
        where: { id },
        data: value,
        include: {
          category: true,
          storageLocation: true,
        },
      });

      res.json({
        success: true,
        data: item,
        message: 'SKU reference updated successfully',
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
      const existing = await prisma.skuMapping.findFirst({
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

      if (!existing) {
        return res.status(404).json({
          success: false,
          error: 'SKU reference not found',
        });
      }

      // Check if in use
      const inUse = existing._count.rawMaterials > 0 || existing._count.finishedProducts > 0;
      if (inUse) {
        return res.status(400).json({
          success: false,
          error: `Cannot delete SKU reference: ${existing._count.rawMaterials} raw material(s) and ${existing._count.finishedProducts} finished product(s) are using it`,
        });
      }

      await prisma.skuMapping.delete({ where: { id } });

      res.json({
        success: true,
        message: 'SKU reference deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

// Helper function
function generateSkuFromName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

### 2.2 Create Routes

**File:** `backend/src/routes/skuReferenceRoutes.ts`

```typescript
import { Router } from 'express';
import { skuReferenceController } from '../controllers/skuReferenceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', skuReferenceController.getAll);
router.get('/:id', skuReferenceController.getById);
router.post('/', skuReferenceController.create);
router.put('/:id', skuReferenceController.update);
router.delete('/:id', skuReferenceController.delete);

export default router;
```

### 2.3 Register Routes

**File:** `backend/src/index.ts` or `backend/src/app.ts`

```typescript
import skuReferenceRoutes from './routes/skuReferenceRoutes';

// Add with other routes
app.use('/api/sku-references', skuReferenceRoutes);
```

### 2.4 Update Raw Material Controller for Auto-fill

**File:** `backend/src/controllers/rawMaterialController.ts`

Add new endpoint:
```typescript
// GET /api/raw-materials/prefill/:skuReferenceId
getPrefillFromSku: async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skuReferenceId } = req.params;
    const clientId = req.user!.clientId;

    const skuRef = await prisma.skuMapping.findFirst({
      where: { id: skuReferenceId, clientId },
      include: {
        category: true,
        storageLocation: true,
      },
    });

    if (!skuRef) {
      return res.status(404).json({
        success: false,
        error: 'SKU reference not found',
      });
    }

    // Return prefill data
    res.json({
      success: true,
      data: {
        name: skuRef.name,
        sku: skuRef.sku,
        description: skuRef.description,
        unit: skuRef.unit,
        unitPrice: skuRef.unitPrice,
        reorderLevel: skuRef.reorderLevel,
        storageLocationId: skuRef.storageLocationId,
        categoryId: skuRef.categoryId,
        skuReferenceId: skuRef.id,
      },
    });
  } catch (error) {
    next(error);
  }
},
```

---

## 🎨 Phase 3: Frontend Implementation (4 hours)

### 3.1 Create SKU Reference API Service

**File:** `frontend/src/services/skuReferenceApi.ts`

```typescript
import api from './api';

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
  category?: {
    id: string;
    name: string;
  };
  storageLocation?: {
    id: string;
    name: string;
  };
  _count?: {
    rawMaterials: number;
    finishedProducts: number;
  };
}

export const skuReferenceApi = {
  getAll: (params?: any) => api.get('/api/sku-references', { params }),
  getById: (id: string) => api.get(`/api/sku-references/${id}`),
  create: (data: Partial<SkuReference>) => api.post('/api/sku-references', data),
  update: (id: string, data: Partial<SkuReference>) => api.put(`/api/sku-references/${id}`, data),
  delete: (id: string) => api.delete(`/api/sku-references/${id}`),
};
```

### 3.2 Update SKU Reference Page (Full CRUD)

**File:** `frontend/src/pages/SkuReference.tsx`

- Add Create button and dialog
- Add Edit buttons for each row
- Add Delete confirmation dialog
- Add form with all fields (price, unit, storage, reorder level, category)
- Add filters (category, search)
- Add usage count display (how many raw materials/finished products use it)

### 3.3 Update Raw Materials Form

**File:** `frontend/src/pages/RawMaterials.tsx`

- Add "Create from SKU Reference" button
- Add SKU Reference selector dropdown
- Auto-fill form when SKU reference is selected
- Keep existing "Create from scratch" option

### 3.4 Update Navigation

**File:** `frontend/src/components/Layout.tsx` or similar

Move SKU Reference menu item **before** Raw Materials in the sidebar:

```typescript
const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/sku-references', label: 'SKU Reference', icon: <LabelIcon /> }, // MOVE HERE
  { path: '/raw-materials', label: 'Raw Materials', icon: <InventoryIcon /> },
  { path: '/finished-products', label: 'Finished Products', icon: <ProductIcon /> },
  // ... rest
];
```

---

## ✅ Phase 4: Testing (2 hours)

### 4.1 Backend Tests

**File:** `backend/test-sku-reference-crud.js`

```javascript
/**
 * Test suite for SKU Reference CRUD operations
 * Tests multi-tenant isolation, validation, and relationships
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = require('./src/app'); // Adjust path

describe('SKU Reference CRUD', () => {
  let client1Token, client2Token, client1Id, client2Id;

  beforeAll(async () => {
    // Setup test clients and tokens
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('POST /api/sku-references', () => {
    test('should create SKU reference with clientId', async () => {
      const response = await request(app)
        .post('/api/sku-references')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          name: 'Test Product',
          unitPrice: 10.50,
          unit: 'kg',
          reorderLevel: 5,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.clientId).toBe(client1Id);
    });

    test('should prevent duplicate SKU within same client', async () => {
      // Create first
      await request(app)
        .post('/api/sku-references')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ name: 'Unique Test', sku: 'UNIQUE-TEST' });

      // Try duplicate
      const response = await request(app)
        .post('/api/sku-references')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ name: 'Another Name', sku: 'UNIQUE-TEST' });

      expect(response.status).toBe(409);
    });

    test('should allow same SKU across different clients', async () => {
      const sku = 'SHARED-SKU';

      const res1 = await request(app)
        .post('/api/sku-references')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ name: 'Client 1 Product', sku });

      const res2 = await request(app)
        .post('/api/sku-references')
        .set('Authorization', `Bearer ${client2Token}`)
        .send({ name: 'Client 2 Product', sku });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
    });
  });

  describe('GET /api/sku-references', () => {
    test('should only return client\'s own SKU references', async () => {
      const response = await request(app)
        .get('/api/sku-references')
        .set('Authorization', `Bearer ${client1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.every(item => item.clientId === client1Id)).toBe(true);
    });
  });

  describe('DELETE /api/sku-references/:id', () => {
    test('should prevent deletion if SKU is in use', async () => {
      // Create SKU reference
      const skuRes = await request(app)
        .post('/api/sku-references')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({ name: 'In Use Product' });

      const skuId = skuRes.body.data.id;

      // Create raw material using this SKU
      await request(app)
        .post('/api/raw-materials')
        .set('Authorization', `Bearer ${client1Token}`)
        .send({
          name: 'Raw Material',
          skuReferenceId: skuId,
          // ... other required fields
        });

      // Try to delete
      const response = await request(app)
        .delete(`/api/sku-references/${skuId}`)
        .set('Authorization', `Bearer ${client1Token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('in use');
    });
  });
});
```

**Run with:**
```bash
cd backend && node test-sku-reference-crud.js
```

### 4.2 Integration Tests

**File:** `backend/test-sku-reference-integration.js`

Test the complete workflow:
1. Create SKU reference
2. Create raw material from SKU reference (auto-fill)
3. Verify data is properly linked
4. Update SKU reference
5. Verify raw material is not affected (or updated if desired)

---

## 📋 Phase 5: Documentation Updates (1 hour)

### 5.1 Update API Documentation

**File:** `docs/api-reference.md`

Add new section:
```markdown
### SKU References

#### GET /api/sku-references
List all SKU references for the authenticated client.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 25)
- `search` (string, optional)
- `categoryId` (string, optional)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": { ... }
}
```

[Continue with other endpoints...]
```

### 5.2 Update README

**File:** `README.md`

Update features section:
```markdown
- 📦 **SKU Reference Master** - Centralized SKU templates with pricing, units, and storage defaults
- 🍞 **Complete Inventory Management** - Raw materials, intermediate products, and finished goods
```

### 5.3 Create Feature Documentation

**File:** `SKU_REFERENCE_GUIDE.md`

```markdown
# SKU Reference System Guide

## Overview
The SKU Reference system provides a centralized master template for managing product information...

## Features
- Centralized SKU management
- Auto-fill raw material creation
- Price and unit defaults
- Storage location templates

## Usage

### Creating a SKU Reference
1. Navigate to SKU References page
2. Click "Create New SKU Reference"
3. Fill in the form...

### Creating Raw Materials from SKU References
1. Navigate to Raw Materials
2. Click "Create from SKU Reference"
3. Select your SKU reference...
```

---

## 🚀 Phase 6: Deployment & Rollout (1 hour)

### 6.1 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Migration tested on development database
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] No breaking changes to existing functionality

### 6.2 Deployment Steps

```bash
# 1. Merge to main
git checkout main
git merge feature/full-sku-reference-entity

# 2. Run migration on production
cd backend
DATABASE_URL="<production-url>" npx prisma migrate deploy

# 3. Deploy backend
# (Follow your deployment process - Render, etc.)

# 4. Deploy frontend
# (Follow your deployment process - Vercel, etc.)

# 5. Verify
curl https://your-api.com/api/sku-references -H "Authorization: Bearer <token>"
```

### 6.3 Rollback Plan

If issues occur:
```bash
# Database rollback
npx prisma migrate resolve --rolled-back <migration-name>

# Code rollback
git revert <commit-hash>
git push
```

---

## 📊 Success Metrics

After deployment, verify:
- [ ] SKU references can be created, edited, deleted
- [ ] Multi-tenant isolation working (Client A can't see Client B's SKUs)
- [ ] Raw materials can be created from SKU references
- [ ] Auto-fill populates all expected fields
- [ ] No performance degradation
- [ ] All tests passing in production

---

## 🔄 Future Enhancements (Out of Scope)

- Bulk import/export SKU references (CSV/Excel)
- Price history tracking
- SKU reference versioning
- Auto-update linked raw materials when SKU reference changes
- SKU reference analytics (most used, least used)
- Multi-currency support for pricing

---

## 📞 Support & Questions

If you encounter issues during implementation:
1. Check tests for examples
2. Review CODE_GUIDELINES.md for security patterns
3. Consult existing controllers (rawMaterialController.ts) for patterns
4. Test thoroughly with multi-tenant scenarios

---

**Created:** January 9, 2026  
**Last Updated:** January 9, 2026  
**Estimated Completion:** 2-3 days (8-12 hours)
