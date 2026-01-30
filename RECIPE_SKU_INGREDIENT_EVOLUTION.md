# Recipe SKU-Based Ingredient Selection - Implementation Plan

## 📋 Overview

**Goal:** Evolve recipe ingredient selection from individual raw material/finished product items to SKU-based selection, eliminating duplicate entries and improving UX.

**Current State:**
- Recipes use `RecipeIngredient` table with `rawMaterialId` or `finishedProductId`
- Multiple batches/items of same product create duplicate entries in ingredient selector
- Availability checks are performed (but shouldn't be for recipes)

**Target State:**
- Recipes reference `SkuMapping` entries instead of individual items
- Ingredient selector shows unique SKUs (one per product type)
- No availability checks during recipe creation/edit
- Backward compatible with production runs that need actual item allocation

---

## 🏗️ Architecture Analysis

### Current System

#### Database Schema
```prisma
model RecipeIngredient {
  id                String               @id @default(cuid())
  recipeId          String
  rawMaterialId     String?              // Points to specific item/batch
  finishedProductId String?              // Points to specific item/batch
  quantity          Float
  unit              String
  notes             String?
}
```

#### SKU System (Already Exists)
```prisma
model SkuMapping {
  id                String            @id @default(cuid())
  name              String            // Product/material name (unique per client)
  sku               String            // Auto-generated or manually set SKU
  unitPrice         Float?
  unit              String?
  categoryId        String?
  clientId          String            // Multi-tenant isolation
  rawMaterials      RawMaterial[]     @relation("SkuReferenceToRawMaterial")
  finishedProducts  FinishedProduct[] @relation("SkuReferenceToFinishedProduct")
}
```

**Key Insight:** The `SkuMapping` table already serves as a "master template" for products. Raw materials and finished products already link to it via `skuReferenceId`.

---

## 🎯 Implementation Strategy

### Option A: Reference SkuMapping Directly (RECOMMENDED)

**Pros:**
- Cleaner data model
- Single source of truth for SKU information
- Future-proof for recipe versioning
- Eliminates need to track raw vs finished at recipe level

**Cons:**
- Requires migration of existing recipe ingredients
- Breaking change (with backward compatibility path)

#### Database Changes
```prisma
model RecipeIngredient {
  id                String               @id @default(cuid())
  recipeId          String
  skuMappingId      String?              // NEW: Reference to SKU template
  // Keep for backward compatibility (will be null for new recipes)
  rawMaterialId     String?              
  finishedProductId String?              
  quantity          Float
  unit              String
  notes             String?
  
  recipe            Recipe               @relation(...)
  skuMapping        SkuMapping?          @relation(...)
  rawMaterial       RawMaterial?         @relation(...)
  finishedProduct   FinishedProduct?     @relation(...)
}
```

### Option B: Keep Current Schema, Change UI Only

**Pros:**
- No database migration needed
- Simpler implementation

**Cons:**
- Still stores arbitrary first-found item IDs
- Less semantic (recipes shouldn't care about specific batches)
- Harder to maintain SKU consistency

---

## ✅ Recommended Approach: Option A with Gradual Migration

### Phase 1: Schema Evolution (Non-Breaking)
1. Add `skuMappingId` field to `RecipeIngredient` (nullable)
2. Create migration script
3. Add relation to Prisma schema
4. Keep existing `rawMaterialId` and `finishedProductId` for backward compatibility

### Phase 2: Backend API Updates
1. **New SKU Aggregation Endpoint**
   - `GET /api/sku-mappings/for-recipes`
   - Returns unique SKUs with:
     - Name, SKU, unit, category
     - Total available quantity across all items
     - Average/latest unit price
     - Item type (raw material, finished product, or both)

2. **Update Recipe Controller**
   - Accept `skuMappingId` in ingredient creation
   - Remove availability validation (recipes are templates, not reservations)
   - Support both old and new formats during transition

3. **Migration Endpoint (Optional)**
   - `POST /api/recipes/migrate-to-sku`
   - Converts existing recipes to use `skuMappingId`

### Phase 3: Frontend Updates
1. **Ingredient Selector Component**
   - Replace raw material/finished product dropdowns
   - New: Single SKU autocomplete with search by name/SKU
   - Display: `SKU-NAME (unit) - $price`
   - Group by category if helpful

2. **Recipe Form Updates**
   - Remove "Type" selector (RAW/FINISHED)
   - Single unified ingredient picker
   - Show SKU, name, available quantity (informational only)

3. **Display Changes**
   - Recipe detail view shows SKU instead of specific item
   - Cost calculation uses SKU average price
   - Production run allocation still uses actual items (separate flow)

### Phase 4: Data Migration & Testing
1. Run migration script to populate `skuMappingId` for existing recipes
2. Ensure all SKU mappings exist (backfill if needed)
3. Test recipe creation/update with new system
4. Test production runs still work (they use actual item allocation)
5. Test "What Can I Make" feature with SKU aggregation

---

## 🔧 Technical Implementation Details

### Backend: SKU Aggregation Endpoint

```typescript
// GET /api/sku-mappings/for-recipes
export const getSkuMappingsForRecipes = async (req: Request, res: Response) => {
  const clientId = req.user!.clientId;
  
  const skuMappings = await prisma.skuMapping.findMany({
    where: { clientId },
    include: {
      category: true,
      rawMaterials: {
        select: { quantity: true, reservedQuantity: true, unitPrice: true }
      },
      finishedProducts: {
        select: { quantity: true, reservedQuantity: true, costToProduce: true }
      }
    }
  });
  
  const enriched = skuMappings.map(sku => {
    // Aggregate quantities across all items with this SKU
    const totalRawQty = sku.rawMaterials.reduce(
      (sum, rm) => sum + (rm.quantity - rm.reservedQuantity), 0
    );
    const totalFinishedQty = sku.finishedProducts.reduce(
      (sum, fp) => sum + (fp.quantity - fp.reservedQuantity), 0
    );
    
    // Get latest/average price
    const rawPrices = sku.rawMaterials.map(rm => rm.unitPrice);
    const finishedPrices = sku.finishedProducts.map(fp => fp.costToProduce);
    const allPrices = [...rawPrices, ...finishedPrices].filter(p => p > 0);
    const avgPrice = allPrices.length > 0 
      ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length 
      : sku.unitPrice || 0;
    
    return {
      id: sku.id,
      name: sku.name,
      sku: sku.sku,
      unit: sku.unit,
      category: sku.category,
      availableQuantity: totalRawQty + totalFinishedQty,
      estimatedPrice: avgPrice,
      hasRawMaterials: sku.rawMaterials.length > 0,
      hasFinishedProducts: sku.finishedProducts.length > 0
    };
  });
  
  res.json({ success: true, data: enriched });
};
```

### Frontend: SKU Ingredient Selector

```tsx
// Simplified ingredient form
<Grid container spacing={2}>
  <Grid item xs={12} sm={6}>
    <Autocomplete
      options={skuMappings}
      getOptionLabel={(option) => `${option.sku} - ${option.name} (${option.unit})`}
      renderInput={(params) => (
        <TextField {...params} label="Select Ingredient (by SKU or Name)" />
      )}
      onChange={(_, value) => {
        setIngredientForm({
          skuMappingId: value?.id || '',
          quantity: 0,
          unit: value?.unit || '',
          notes: ''
        });
      }}
    />
  </Grid>
  <Grid item xs={12} sm={3}>
    <TextField
      label="Quantity"
      type="number"
      value={ingredientForm.quantity}
      onChange={(e) => setIngredientForm(prev => ({ 
        ...prev, 
        quantity: parseFloat(e.target.value) 
      }))}
    />
  </Grid>
  <Grid item xs={12} sm={3}>
    <TextField
      label="Unit"
      value={ingredientForm.unit}
      InputProps={{ readOnly: true }}
    />
  </Grid>
</Grid>
```

---

## 🚧 Migration Strategy

### Step 1: Ensure All SKU Mappings Exist
```sql
-- Backfill script to create SKU mappings from existing items
INSERT INTO sku_mappings (id, name, sku, unit, unit_price, client_id, category_id, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  name,
  COALESCE(sku, UPPER(REGEXP_REPLACE(name, '[^A-Z0-9]+', '-', 'g'))),
  unit,
  unit_price,
  client_id,
  category_id,
  NOW(),
  NOW()
FROM (
  SELECT DISTINCT ON (name, client_id) 
    name, sku, unit, unit_price, client_id, category_id
  FROM raw_materials
  WHERE sku IS NOT NULL
  UNION
  SELECT DISTINCT ON (name, client_id)
    name, sku, unit, cost_to_produce, client_id, category_id
  FROM finished_products
  WHERE sku IS NOT NULL AND sku != ''
) AS items
ON CONFLICT (name, client_id) DO NOTHING;
```

### Step 2: Link Existing Recipe Ingredients
```sql
-- Update existing RecipeIngredient records to reference SKU mappings
UPDATE recipe_ingredients ri
SET sku_mapping_id = (
  SELECT sm.id
  FROM sku_mappings sm
  WHERE sm.name = COALESCE(
    (SELECT name FROM raw_materials WHERE id = ri.raw_material_id),
    (SELECT name FROM finished_products WHERE id = ri.finished_product_id)
  )
  AND sm.client_id = (
    SELECT client_id FROM recipes WHERE id = ri.recipe_id
  )
  LIMIT 1
)
WHERE ri.sku_mapping_id IS NULL;
```

### Step 3: Validation
```sql
-- Check for orphaned ingredients (should be 0)
SELECT COUNT(*) 
FROM recipe_ingredients 
WHERE sku_mapping_id IS NULL 
  AND raw_material_id IS NULL 
  AND finished_product_id IS NULL;
```

---

## ✅ Validation Checklist

- [ ] Database migration runs without errors
- [ ] All existing recipes have valid SKU mappings
- [ ] New recipes can be created with SKU-based ingredients
- [ ] Recipe cost calculation works with SKU aggregation
- [ ] "What Can I Make" analysis uses SKU aggregation correctly
- [ ] Production runs still allocate actual items (not just SKUs)
- [ ] Frontend shows unified SKU selector
- [ ] No duplicate SKUs appear in ingredient dropdown
- [ ] Backward compatibility: old recipes still display correctly
- [ ] Multi-tenant isolation maintained (clientId filtering)

---

## 📊 Benefits Summary

1. **User Experience**
   - No duplicate entries in ingredient selector
   - Cleaner, simpler interface
   - Search by SKU or name

2. **Data Integrity**
   - Single source of truth (SkuMapping)
   - Consistent SKU usage across system
   - Recipe templates independent of inventory state

3. **Future Enhancements**
   - Recipe versioning easier
   - Multi-site recipes (same SKU, different suppliers)
   - Better cost analysis and forecasting

4. **Maintainability**
   - Semantic data model (recipes reference products, not batches)
   - Easier to add features like substitutions
   - Production allocation separate from recipe definition

---

## 🚀 Rollout Plan

1. **Development** (Current)
   - Implement schema changes
   - Build new endpoints
   - Update frontend components
   - Write migration scripts

2. **Testing**
   - Create test recipes with new system
   - Migrate sample existing recipes
   - Verify production workflows unchanged
   - Test edge cases (missing SKUs, mixed old/new format)

3. **Staging Deployment**
   - Run migration on staging database
   - User acceptance testing
   - Performance validation

4. **Production Deployment**
   - Backup database
   - Run migration during low-traffic period
   - Monitor for errors
   - Rollback plan ready

---

## 🔄 Backward Compatibility Notes

- Old recipes with `rawMaterialId`/`finishedProductId` will continue to work
- Backend will check `skuMappingId` first, fall back to old fields
- Frontend will gracefully display both formats
- Gradual migration: recipes updated as users edit them
- Force migration option available for admins
