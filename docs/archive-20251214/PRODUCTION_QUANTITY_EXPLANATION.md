# Production Quantity Calculation - How It Works

## Understanding Recipe Yields and Production Multipliers

### The Formula

```
Production Multiplier = Target Quantity ÷ Recipe Yield Quantity
Ingredient Needed = Ingredient Quantity × Production Multiplier
```

### Example: Arepas Recipe

**Recipe Definition:**
- Name: Arepas
- Yield: 10 pieces (pcs) - makes 10 individual arepas
- Ingredients:
  - Areparina: 1 kg
  - Agua: 1 L

**Scenario 1: Produce Full Recipe (10 pieces)**
```
Target Quantity: 10 pcs
Production Multiplier: 10 pcs ÷ 10 pcs = 1.0

Materials Needed:
- Areparina: 1 kg × 1.0 = 1 kg ✅
- Agua: 1 L × 1.0 = 1 L ✅
```

**Scenario 2: Produce Half Recipe (5 pieces)**
```
Target Quantity: 5 pcs
Production Multiplier: 5 pcs ÷ 10 pcs = 0.5

Materials Needed:
- Areparina: 1 kg × 0.5 = 0.5 kg ✅
- Agua: 1 L × 0.5 = 0.5 L ✅
```

**Scenario 3: Produce 1 Piece Only**
```
Target Quantity: 1 pcs
Production Multiplier: 1 pcs ÷ 10 pcs = 0.1

Materials Needed:
- Areparina: 1 kg × 0.1 = 0.1 kg ✅ (CORRECT!)
- Agua: 1 L × 0.1 = 0.1 L ✅ (CORRECT!)
```

## Why 0.1 kg is Correct

If your recipe yields 10 pieces and uses 1 kg of flour, then:
- To make 10 pieces, you need 1 kg of flour
- To make 1 piece, you need 0.1 kg of flour (10% of the recipe)
- Each arepa uses 0.1 kg = 100 grams of Areparina

This is **mathematically correct** and represents proper scaling.

## Common Misconceptions

❌ **WRONG:** "I want to produce 1 piece, so I should use 1 kg of each ingredient"
- This ignores the recipe yield ratio
- Would produce 10 pieces if recipe yields 10 pieces from 1 kg

✅ **CORRECT:** "I want to produce 1 piece, so I need to scale down the recipe"
- Production multiplier accounts for recipe yield
- 1 piece needs 1/10 of ingredients = 0.1 kg Areparina
- Results in exact amount requested: 1 arepa

## Reserved Quantity Visibility

### Before Fix
Raw materials did NOT show reserved quantities in the UI, making it hard to see what was allocated to active production runs.

### After Fix
Raw materials now display reserved quantities just like finished products:

**List View:**
```
Quantity: 10 kg
(2 kg reserved)  ← Shows under quantity
```

**Card View:**
```
Total Qty: 10 kg
Reserved:  2 kg   ← Shows when > 0
Available: 8 kg   ← Calculated: Total - Reserved
```

## Production Workflow with Correct Deductions

### Step 1: Start Production
```
Recipe: Arepas (yields 10 pieces)
Target: 10 pieces

Materials Before:
- Areparina: 10 kg total, 2 kg reserved, 8 kg available
- Agua: 10 L total, 2 L reserved, 8 L available
```

### Step 2: Materials Allocated (Reserved)
```
Allocating: 1 kg Areparina, 1 L Agua for 10 pieces

Materials After Allocation:
- Areparina: 10 kg total, 3 kg reserved, 7 kg available ✅
- Agua: 10 L total, 3 L reserved, 7 L available ✅

Status: ALLOCATED (ready for production)
```

### Step 3: Production Completed (Consumed)
```
Consuming allocated materials...

Materials After Consumption:
- Areparina: 9 kg total, 2 kg reserved, 7 kg available ✅
- Agua: 9 L total, 2 L reserved, 7 L available ✅

Status: CONSUMED (deducted from inventory)
```

### Step 4: Finished Product Created
```
Created: Arepas - 10 pieces ✅

Inventory accurate:
✓ Raw materials deducted correctly
✓ Reserved quantities cleared
✓ Finished product added to inventory
```

## How to Verify It's Working

### Test in UI:
1. Check raw material before production
2. Start production run
3. See reserved quantity increase (blue info color)
4. Complete production
5. See total quantity decrease by reserved amount
6. See reserved quantity decrease back down

### Check Database:
```sql
-- Before production
SELECT name, quantity, "reserved_quantity" FROM raw_materials WHERE name = 'Areparina';
-- Result: 10.0, 2.0

-- After allocation
-- Result: 10.0, 3.0 (reserved increased)

-- After completion
-- Result: 9.0, 2.0 (quantity decreased, reserved back to original)
```

## Frontend Display

### Raw Materials List View
Shows reserved in parentheses under quantity:
```
┌──────────────┬────────────┬──────────┐
│ Material     │ Quantity   │ Status   │
├──────────────┼────────────┼──────────┤
│ Areparina    │ 10 kg      │ In Stock │
│              │ (2 kg res) │          │
└──────────────┴────────────┴──────────┘
```

### Raw Materials Card View
Shows breakdown when reserved > 0:
```
╔══════════════════╗
║ Areparina        ║
║                  ║
║ Total Qty: 10 kg ║
║ Reserved:  2 kg  ║ ← Only shown if > 0
║ Available: 8 kg  ║ ← Auto-calculated
╚══════════════════╝
```

## Key Takeaways

1. **Production Multiplier is Correct**: Scales ingredients based on recipe yield
2. **0.1 kg deduction is Expected**: When producing 1 kg from a 10 kg recipe
3. **Reserved Quantity Now Visible**: Shows in both list and card views
4. **Available = Total - Reserved**: Helps plan future production
5. **Color Coding**: 
   - Blue (info): Reserved quantities
   - Green (success): Adequate available stock
   - Orange (warning): Available below reorder level
   - Red (error): Low stock or out of stock

---

**Implementation Date:** December 13, 2025  
**Status:** ✅ Complete - Working as designed  
**Files Modified:**
- `frontend/src/types/index.ts` (added reservedQuantity field)
- `frontend/src/pages/RawMaterials.tsx` (added reserved display in list & card views)
