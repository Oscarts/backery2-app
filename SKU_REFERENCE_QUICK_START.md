# SKU Reference Entity - Quick Start Checklist

**Branch:** `feature/full-sku-reference-entity`  
**Current Status:** ✅ Planning Complete - Ready to Implement  
**Estimated Time:** 8-12 hours

---

## 🎯 What You're Building

Transform the basic SKU mapping into a **full master template system** where:
- ✅ Each SKU has price, units, storage, reorder levels
- ✅ Raw materials can be created by selecting a SKU (auto-fills most fields)
- ✅ SKU Reference appears before Raw Materials in navigation
- ✅ Full CRUD operations with multi-tenant isolation

---

## 📋 Implementation Checklist

### ☑️ Pre-Implementation (Already Done!)
- [x] Branch created: `feature/full-sku-reference-entity`
- [x] Comprehensive plan documented
- [x] Current stable version committed on `main`
- [x] Multi-tenant isolation verified and working

### 🗄️ Phase 1: Database (Day 1 Morning - 2 hours)
- [ ] Update `backend/prisma/schema.prisma`:
  - [ ] Add fields to SkuMapping: `unitPrice`, `unit`, `reorderLevel`, `storageLocationId`, `categoryId`
  - [ ] Add relations: `storageLocation`, `category`, `rawMaterials[]`, `finishedProducts[]`
  - [ ] Add `skuReferenceId` to RawMaterial and FinishedProduct
- [ ] Create migration: `npx prisma migrate dev --name extend_sku_reference_entity`
- [ ] Test migration: `npx prisma migrate reset` then `npm run db:seed:force`
- [ ] Regenerate client: `npm run db:generate`

**Verify:** Run `npx prisma studio` and check sku_mappings table has new columns

### 🔧 Phase 2: Backend API (Day 1 Afternoon - 3 hours)
- [ ] Create `backend/src/controllers/skuReferenceController.ts`
  - [ ] Implement `getAll()` with clientId filter
  - [ ] Implement `getById()` with clientId verification
  - [ ] Implement `create()` with validation
  - [ ] Implement `update()` with ownership check
  - [ ] Implement `delete()` with usage check
- [ ] Create `backend/src/routes/skuReferenceRoutes.ts`
- [ ] Register routes in `backend/src/index.ts` or `backend/src/app.ts`
- [ ] Update `rawMaterialController.ts`:
  - [ ] Add `getPrefillFromSku()` endpoint

**Verify:** Test with curl or Postman:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/sku-references
```

### 🎨 Phase 3: Frontend (Day 2 - 4 hours)
- [ ] Create `frontend/src/services/skuReferenceApi.ts`
- [ ] Update `frontend/src/pages/SkuReference.tsx`:
  - [ ] Add Create dialog with full form
  - [ ] Add Edit functionality
  - [ ] Add Delete confirmation
  - [ ] Show usage counts (_count.rawMaterials, _count.finishedProducts)
- [ ] Update `frontend/src/pages/RawMaterials.tsx`:
  - [ ] Add "Create from SKU Reference" button
  - [ ] Add SKU selector dropdown
  - [ ] Implement auto-fill when SKU selected
- [ ] Update navigation (Layout component):
  - [ ] Move "SKU Reference" before "Raw Materials"

**Verify:** 
- Create a SKU reference in UI
- Create a raw material from that SKU reference
- Check that fields auto-fill correctly

### ✅ Phase 4: Testing (Day 3 Morning - 2 hours)
- [ ] Create `backend/test-sku-reference-crud.js`:
  - [ ] Test CRUD operations
  - [ ] Test multi-tenant isolation
  - [ ] Test duplicate SKU prevention
  - [ ] Test deletion prevention when in use
- [ ] Create `backend/test-sku-reference-integration.js`:
  - [ ] Test complete workflow (SKU → Raw Material)
- [ ] Run tests: `node backend/test-sku-reference-crud.js`
- [ ] Run isolation tests: `node backend/test-sku-mapping-isolation.js`

**Verify:** All tests passing ✅

### 📚 Phase 5: Documentation (Day 3 Afternoon - 1 hour)
- [ ] Update `docs/api-reference.md` with new endpoints
- [ ] Update `README.md` features section
- [ ] Create `SKU_REFERENCE_GUIDE.md` user guide
- [ ] Update `.github/copilot-instructions.md` if needed

### �� Phase 6: Merge & Deploy (Day 3 Evening - 1 hour)
- [ ] Final testing on development
- [ ] Code review (if applicable)
- [ ] Merge to main: `git checkout main && git merge feature/full-sku-reference-entity`
- [ ] Deploy to production
- [ ] Verify in production
- [ ] Monitor for issues

---

## 🛠️ Development Commands

### Start Development
```bash
# Start servers (preserves data)
./start-with-data.sh

# OR start individually
cd backend && npm run dev
cd frontend && npm run dev
```

### Database Operations
```bash
cd backend

# Generate Prisma client after schema changes
npm run db:generate

# Create and apply migration
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes data)
npx prisma migrate reset

# Seed database
npm run db:seed:force

# Open Prisma Studio
npx prisma studio
```

### Testing
```bash
cd backend

# Run specific test
node test-sku-reference-crud.js

# Run all tests
npm test
```

### Git Workflow
```bash
# Save progress
git add .
git commit -m "feat: [description]"

# Switch to main (if needed)
git checkout main

# Merge feature when done
git checkout main
git merge feature/full-sku-reference-entity
```

---

## 🚨 Common Pitfalls to Avoid

1. **❌ Forgetting clientId filter**
   - ✅ ALWAYS add `where: { clientId: req.user!.clientId }` to queries
   
2. **❌ Not checking ownership before update/delete**
   - ✅ Use `findFirst` with `clientId` before operations
   
3. **❌ Allowing deletion of SKU references in use**
   - ✅ Check `_count.rawMaterials` and `_count.finishedProducts` first
   
4. **❌ Not validating input**
   - ✅ Use Joi schema validation in controllers
   
5. **❌ Breaking existing functionality**
   - ✅ Make fields optional (nullable) for backward compatibility
   
6. **❌ Not testing multi-tenant isolation**
   - ✅ Create 2 test clients and verify they can't access each other's data

---

## 📞 Need Help?

**Stuck on something?** Check these resources in order:

1. **Implementation Plan:** See `SKU_REFERENCE_ENTITY_IMPLEMENTATION_PLAN.md` for detailed code examples
2. **Existing Patterns:** Look at `rawMaterialController.ts` or `finishedProductController.ts` for CRUD patterns
3. **Security Rules:** Review `CODE_GUIDELINES.md` for multi-tenant requirements
4. **Database Schema:** Run `npx prisma studio` to inspect current structure
5. **API Testing:** Use existing tests as templates (e.g., `test-sku-mapping-isolation.js`)

---

## ✨ Success Criteria

Before merging to main, verify:

- [ ] Can create SKU reference with all fields
- [ ] Can edit/delete SKU reference (when not in use)
- [ ] Cannot delete SKU reference that's in use
- [ ] Can create raw material from SKU reference (auto-fill works)
- [ ] Client A cannot see Client B's SKU references
- [ ] All backend tests passing
- [ ] Frontend UI works smoothly
- [ ] Navigation shows SKU Reference before Raw Materials
- [ ] No console errors in browser
- [ ] No errors in server logs

---

**Ready to start?** Begin with Phase 1 (Database) and follow the checklist! 🚀

**Estimated time per phase:**
- Phase 1: 2 hours
- Phase 2: 3 hours  
- Phase 3: 4 hours
- Phase 4: 2 hours
- Phase 5: 1 hour
- Phase 6: 1 hour

**Total: 8-12 hours over 2-3 days**
