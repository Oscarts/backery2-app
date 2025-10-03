# API Test Fix Summary

## Issue
Test 48 "Finished Product SKU Reuse" was failing.

## Root Cause
1. The test was providing explicit SKU values (`TMP-${Date.now()}`) 
2. The backend SKU service normalizes incoming SKUs rather than using name-based generation when a SKU is provided
3. This meant the two products got different SKUs instead of reusing the same one

## Solution
1. **Made `sku` optional in `CreateFinishedProductData` interface**
   - File: `frontend/src/types/index.ts`
   - Changed `sku: string` to `sku?: string`
   - Added comment: "Optional - auto-generated from name if not provided"

2. **Updated test to not provide SKU**
   - File: `frontend/src/pages/ApiTest.tsx`
   - Removed `sku: 'TMP-${Date.now()}'` from both product creations
   - Now relies on auto-generation from name "Reusable SKU Bread"
   - Both products will get the same SKU: "REUSABLE-SKU-BREAD"

## Test Results After Fix
Expected results:
- ✅ Test 48 should pass (SKU reuse working correctly)
- ✅ 63 tests should pass total
- ⏭️ 2 tests may skip (Materials Traceability - requires production runs)

## How SKU Generation Works
According to `backend/src/services/skuService.ts`:

### When SKU is NOT provided:
1. Check if name already exists in finished products → use existing SKU
2. Check if name already exists in raw materials → use existing SKU  
3. Otherwise, generate new SKU from name: `generateSkuFromName(name)`

### When SKU IS provided:
1. If name mapping already exists → must match existing SKU (or throw conflict error)
2. If no mapping exists → normalize the provided SKU: `generateSkuFromName(incomingSku)`

### SKU Normalization
- Uppercase
- Replace non-alphanumeric with `-`
- Collapse multiple `-` into one
- Trim leading/trailing `-`

Example: "Reusable SKU Bread" → "REUSABLE-SKU-BREAD"

## Testing Instructions
1. Open http://localhost:3002/api-test
2. Click "Run All Tests"
3. Verify Test 48 "Finished Product SKU Reuse" passes
4. Should see: ✅ 63 passed, ⏭️ 2 skipped

## Related Files
- `frontend/src/types/index.ts` - Type definitions
- `frontend/src/pages/ApiTest.tsx` - Test implementation
- `backend/src/services/skuService.ts` - SKU generation logic
- `backend/src/controllers/finishedProductsController.ts` - Uses SKU service

## Notes
- Making `sku` optional is correct behavior - the backend can auto-generate it
- This change may benefit the Finished Products form UI (users don't need to manually enter SKU)
- SKU reuse ensures consistency across the system
