# Multi-Batch Inventory Allocation - Bug Fix

## Problem

When creating a production run, the system was only checking ONE inventory entry per ingredient, even when multiple batches with the same SKU/name existed. This caused false "insufficient stock" errors.

### Example Scenario:
```
Recipe needs: 2 kg Areparina
- Batch A: 1 kg available (SKU: AREPARINA-001)  
- Batch B: 1.5 kg available (SKU: AREPARINA-001)
- Total available: 2.5 kg ✅ SUFFICIENT

BEFORE FIX:
❌ System checks only Batch A (1 kg) → FAILS with "insufficient stock"

AFTER FIX:
✅ System aggregates both batches (2.5 kg) → SUCCEEDS and allocates from both
```

## Root Cause

In `backend/src/services/inventoryAllocationService.ts`:

**Old Logic:**
- `checkIngredientAvailability()` checked only `ingredient.rawMaterial` (single record)
- `allocateRawMaterial()` allocated from only ONE batch
- Recipe ingredients link to a specific `rawMaterialId`, but multiple records can share the same `name` or `sku`

## Solution

### 1. Fixed `checkIngredientAvailability()` (Lines 79-170)

**Before:**
```typescript
if (ingredient.rawMaterial) {
  const material = ingredient.rawMaterial; // SINGLE RECORD ONLY
  const available = material.quantity - material.reservedQuantity;
  const isAvailable = available >= quantityNeeded; // WRONG!
}
```

**After:**
```typescript
if (ingredient.rawMaterial) {
  const materialName = ingredient.rawMaterial.name;
  const clientId = ingredient.rawMaterial.clientId;
  
  // Query ALL batches with same name
  const allBatches = await prisma.rawMaterial.findMany({
    where: {
      name: materialName,
      clientId: clientId,
      isContaminated: false
    }
  });

  // Sum available quantities across ALL batches
  const available = allBatches.reduce((sum, batch) => {
    return sum + (batch.quantity - batch.reservedQuantity);
  }, 0);
  
  const isAvailable = available >= quantityNeeded; // CORRECT!
}
```

### 2. Fixed `allocateIngredients()` (Lines 162-205)

**Before:**
- Returned single `MaterialAllocation` per ingredient
- Only allocated from the specific linked material

**After:**
- Returns `MaterialAllocation[]` (array) per ingredient
- Can allocate from multiple batches using FEFO strategy

### 3. Fixed `allocateRawMaterial()` (Lines 210-295)

**Before:**
```typescript
private async allocateRawMaterial(
  ...
): Promise<MaterialAllocation> {
  // Check single material only
  if (material.quantity - material.reservedQuantity < quantityNeeded) {
    throw new Error('Insufficient stock');
  }
  
  // Allocate from single batch
  await prisma.rawMaterial.update({
    where: { id: material.id },
    data: { reservedQuantity: material.reservedQuantity + quantityNeeded }
  });
  
  return singleAllocation;
}
```

**After:**
```typescript
private async allocateRawMaterial(
  ...
): Promise<MaterialAllocation[]> {  // Now returns array
  const materialName = material.name;
  const clientId = material.clientId;
  
  // Get ALL batches with same name, sorted by expiration (FEFO)
  const allBatches = await prisma.rawMaterial.findMany({
    where: {
      name: materialName,
      clientId: clientId,
      isContaminated: false
    },
    orderBy: {
      expirationDate: 'asc' // First-Expired-First-Out
    }
  });

  const allocations: MaterialAllocation[] = [];
  let remainingNeeded = quantityNeeded;

  // Allocate from batches using FEFO until quantity fulfilled
  for (const batch of allBatches) {
    if (remainingNeeded <= 0) break;

    const available = batch.quantity - batch.reservedQuantity;
    if (available <= 0) continue;

    const quantityFromThisBatch = Math.min(available, remainingNeeded);

    // Update reserved quantity for this batch
    await prisma.rawMaterial.update({
      where: { id: batch.id },
      data: {
        reservedQuantity: batch.reservedQuantity + quantityFromThisBatch
      }
    });

    // Create allocation record for this batch
    const allocation = await prisma.productionAllocation.create({...});
    allocations.push(allocation);
    
    remainingNeeded -= quantityFromThisBatch;
  }

  return allocations; // Multiple allocations
}
```

### 4. Fixed `allocateFinishedProduct()` (Lines 300-398)

Same pattern as `allocateRawMaterial()` but for finished products:
- Queries ALL finished products with same `name`
- Uses FIFO (First-In-First-Out) based on `productionDate`
- Returns array of allocations

## Key Improvements

### ✅ Aggregation Across Batches
- System now finds ALL inventory entries with matching name/SKU
- Sums available quantities: `(quantity - reservedQuantity)` across all batches
- No more false "insufficient stock" errors

### ✅ Smart Allocation Strategy
- **FEFO for Raw Materials**: First-Expired-First-Out (by `expirationDate`)
- **FIFO for Finished Products**: First-In-First-Out (by `productionDate`)
- Minimizes waste and ensures proper inventory rotation

### ✅ Multiple Allocation Records
- One `ProductionAllocation` record per batch used
- Maintains full traceability (batch numbers, costs per batch)
- Accurate cost calculation per batch

### ✅ Partial Allocations
- Can use 1 kg from Batch A, 1 kg from Batch B to fulfill 2 kg requirement
- Handles complex scenarios where no single batch is sufficient

## Example Flow

**Scenario**: Recipe needs 2 kg Areparina, multiplier = 1

1. **Check Availability:**
   ```
   Query: SELECT * FROM raw_materials 
          WHERE name = 'Areparina' 
          AND clientId = 'xxx' 
          AND isContaminated = false
   
   Results:
   - Batch A: 1 kg available (expires 2025-06-30)
   - Batch B: 1.5 kg available (expires 2025-12-31)
   
   Total: 2.5 kg ✅ SUFFICIENT
   ```

2. **Allocate Ingredients:**
   ```
   FEFO Order (by expiration date):
   1. Batch A (expires first): Allocate 1 kg (fully used)
   2. Batch B (expires later): Allocate 1 kg (0.5 kg remains)
   
   Creates 2 ProductionAllocation records:
   - Record 1: materialId=batch_a_id, quantityAllocated=1.0 kg
   - Record 2: materialId=batch_b_id, quantityAllocated=1.0 kg
   ```

3. **Update Reserved Quantities:**
   ```
   Batch A: reservedQuantity = 0 + 1.0 = 1.0 kg
   Batch B: reservedQuantity = 0 + 1.0 = 1.0 kg
   ```

## Testing

To test this fix manually:

1. **Create two raw material batches with same name:**
   ```typescript
   // Batch 1
   POST /api/raw-materials
   {
     "name": "Areparina",
     "sku": "AREPARINA-001",
     "quantity": 1.0,
     "unit": "kg",
     "expirationDate": "2025-06-30",
     "batchNumber": "BATCH-001",
     ...
   }

   // Batch 2 (SAME NAME!)
   POST /api/raw-materials
   {
     "name": "Areparina",  // Same name
     "sku": "AREPARINA-001",
     "quantity": 1.5,
     "unit": "kg",
     "expirationDate": "2025-12-31",  // Expires later
     "batchNumber": "BATCH-002",
     ...
   }
   ```

2. **Create recipe needing 2 kg:**
   ```typescript
   POST /api/recipes
   {
     "name": "Test Recipe",
     "yield": 10,
     "yieldUnit": "pcs",
     "ingredients": [
       {
         "rawMaterialId": "<batch_1_id>",  // Links to first batch
         "quantity": 2.0,  // More than single batch!
         "unit": "kg"
       }
     ]
   }
   ```

3. **Check availability:**
   ```typescript
   GET /api/production-runs/check-availability?recipeId=<id>&targetQuantity=10
   
   Response:
   {
     "canProduce": true,  // ✅ Should be true now!
     "availableIngredients": [{
       "materialName": "Areparina",
       "quantityAvailable": 2.5,  // ✅ Shows total across batches
       "quantityNeeded": 2.0,
       "isAvailable": true
     }]
   }
   ```

4. **Create production run:**
   ```typescript
   POST /api/production-runs
   {
     "recipeId": "<recipe_id>",
     "targetQuantity": 10,
     "unit": "pcs"
   }
   
   // Should succeed and create 2 allocation records
   ```

5. **Verify allocations:**
   ```typescript
   GET /api/production-runs/<id>
   
   Response should show:
   "allocations": [
     {
       "materialName": "Areparina",
       "materialBatchNumber": "BATCH-001",
       "quantityAllocated": 1.0,
       "unit": "kg"
     },
     {
       "materialName": "Areparina",
       "materialBatchNumber": "BATCH-002",
       "quantityAllocated": 1.0,
       "unit": "kg"
     }
   ]
   ```

## Files Changed

- `backend/src/services/inventoryAllocationService.ts`
  - Modified `checkIngredientAvailability()` - Lines 79-170
  - Modified `allocateIngredients()` - Lines 162-205
  - Modified `allocateRawMaterial()` - Lines 210-295
  - Modified `allocateFinishedProduct()` - Lines 300-398

## Impact

### Positive:
✅ No more false "insufficient stock" errors  
✅ Production runs can use inventory from multiple batches  
✅ Better inventory utilization  
✅ FEFO/FIFO allocation reduces waste  
✅ Full traceability maintained (batch numbers, costs)  

### Considerations:
- Production allocation records will now have multiple entries per ingredient (one per batch)
- This is correct behavior and improves traceability
- Cost calculation remains accurate (per-batch costs tracked)

## Related Files

Test scripts created (for reference):
- `test-multi-batch-allocation.js` - Full API test
- `test-multi-batch-fix.js` - Simplified API test  
- `test-multi-batch-direct.ts` - Direct Prisma test

Documentation:
- `MULTI_BATCH_ALLOCATION_FIX.md` - This file

## Commit Message

```
fix(inventory): Aggregate quantities across multiple batches with same SKU

Previously, the system checked only ONE inventory entry per ingredient,
causing false "insufficient stock" errors when multiple batches with the
same SKU existed.

Now the system:
- Aggregates available quantities across ALL batches with same name/SKU
- Allocates from multiple batches using FEFO (raw materials) and FIFO (finished products)
- Creates one allocation record per batch for full traceability
- Handles partial allocations when no single batch is sufficient

Example: Recipe needs 2 kg Areparina. Before this fix, if Batch A had
1 kg and Batch B had 1.5 kg, the system would fail. Now it successfully
allocates 1 kg from Batch A and 1 kg from Batch B.

Fixes multi-batch allocation bug where production runs failed despite
sufficient total inventory across batches.
```
