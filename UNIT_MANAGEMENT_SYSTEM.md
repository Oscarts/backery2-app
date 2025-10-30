# Comprehensive Unit Management System

## Overview

This document describes the comprehensive unit management system implemented to eliminate inconsistencies and validation errors related to unit handling across the application.

## Problem Statement

### Root Causes
1. **No Single Source of Truth**: Unit definitions scattered across codebase
2. **String-Based Storage**: No validation, prone to typos and inconsistencies  
3. **Name vs Symbol Confusion**: Some parts used unit names ("Piece"), others used symbols ("pcs")
4. **No Type Safety**: String types allowed any value
5. **No Runtime Validation**: Invalid units could be stored in database

### Symptoms
- MUI Select validation errors ("value must be from options")
- Material breakdown API failures
- Inconsistent unit display across pages
- Data integrity issues with legacy records

## Solution Architecture

### 1. Shared Constants (✅ Completed)

**File**: `shared/constants/units.ts`

Single source of truth for all unit definitions across frontend and backend.

```typescript
// Constants Object
export const UNIT_SYMBOLS = {
  GRAM: 'g',
  KILOGRAM: 'kg',
  // ... etc
} as const;

// TypeScript Type
export type UnitSymbol = typeof UNIT_SYMBOLS[keyof typeof UNIT_SYMBOLS];

// Array for Validation
export const VALID_UNIT_SYMBOLS: UnitSymbol[] = Object.values(UNIT_SYMBOLS);

// Full Definitions
export interface UnitDefinition {
  symbol: UnitSymbol;
  name: string;
  pluralName: string;
  category: 'weight' | 'volume' | 'count';
}

export const UNITS: Record<string, UnitDefinition> = {
  GRAM: {
    symbol: UNIT_SYMBOLS.GRAM,
    name: 'Gram',
    pluralName: 'Grams',
    category: 'weight'
  },
  // ... etc
};
```

**Supported Units**:
- **Weight**: g, kg, oz, lb
- **Volume**: ml, L, tsp, tbsp, cup
- **Count**: pcs, dz, pkg

**Helper Functions**:
- `normalizeUnit(unit: string): UnitSymbol | null` - Converts legacy names to symbols
- `getUnitDefinition(symbol: UnitSymbol): UnitDefinition` - Get full metadata
- `formatUnit(symbol: UnitSymbol, quantity: number): string` - Proper pluralization
- `getUnitsByCategory()` - Group units by category

### 2. Backend Validation (✅ Completed)

**File**: `backend/src/middleware/unitValidation.ts`

Middleware and Joi schemas for server-side validation.

```typescript
// Joi Schema
export const unitSchema = Joi.string()
  .valid(...VALID_UNIT_SYMBOLS)
  .required()
  .messages({
    'any.only': `Unit must be one of: ${VALID_UNIT_SYMBOLS.join(', ')}`,
  });

// Middleware
export const normalizeUnitsMiddleware = (req, res, next) => {
  // Normalize units in body
  // Normalize units in nested ingredients array
  // Return 400 error with valid units if invalid
};
```

**Applied to Routes**:
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes/:id` - Update recipe
- `POST /api/production/runs` - Create production run
- `PUT /api/production/runs/:id` - Update production run
- `POST /api/finished-products` - Create finished product
- `PUT /api/finished-products/:id` - Update finished product

**Validation Features**:
1. Accepts valid symbols directly (`pcs`, `kg`, etc.)
2. Normalizes legacy names automatically (`Piece` → `pcs`)
3. Returns detailed error messages with valid options
4. Handles nested ingredients arrays in recipes
5. Type-safe with TypeScript

### 3. Legacy Data Handling (✅ Completed)

**Normalization Map**:
```typescript
const LEGACY_UNIT_MAP: Record<string, UnitSymbol> = {
  'Piece': 'pcs',
  'Pieces': 'pcs',
  'piece': 'pcs',
  'pieces': 'pcs',
  'Kilogram': 'kg',
  'Kilograms': 'kg',
  // ... etc
};
```

**Frontend Normalization** (`frontend/src/pages/FinishedProducts.tsx`):
```typescript
const normalizeUnit = (unit: string): string => {
  const map: Record<string, string> = {
    'Piece': 'pcs',
    'Kilogram': 'kg',
    // ... etc
  };
  return map[unit] || unit;
};
```

Applied when:
- Editing existing finished products
- Loading legacy data into forms
- Display inconsistencies detected

### 4. Frontend Integration (✅ Completed)

**Already Using Symbols**:
- Recipe form (EnhancedRecipeForm.tsx) - Fixed to use `unit.symbol` in MenuItem values
- Unit selects across application use symbol values

**TypeScript Configuration**:
Both backend and frontend tsconfig.json updated to include shared folder:

```json
{
  "include": [
    "src",
    "../shared/**/*"
  ]
}
```

**Import Pattern**:
```typescript
import { 
  VALID_UNIT_SYMBOLS, 
  normalizeUnit, 
  UnitSymbol,
  getUnitDefinition 
} from '../../../shared/constants/units';
```

### 5. Testing

**Test Script**: `test-unit-validation.js`

Tests:
1. ✅ Valid unit symbol accepted (`pcs`)
2. ✅ Legacy unit name normalized (`Piece` → `pcs`)
3. ✅ Invalid unit rejected with error
4. ✅ Weight units work (`kg`)
5. ✅ Volume units work (`L`)

**Run Tests**:
```bash
node test-unit-validation.js
```

## Benefits

### Developer Experience
- **Single Source of Truth**: One place to add/modify units
- **Type Safety**: TypeScript prevents invalid units at compile time
- **Clear Error Messages**: Developers know what went wrong
- **Consistent API**: Same patterns across all endpoints

### Data Integrity
- **Validation at API Layer**: Bad data can't enter database
- **Normalization**: Legacy data automatically converted
- **Backwards Compatible**: Old names still work, converted to symbols
- **Database Consistency**: All future records use valid symbols

### Maintainability
- **Centralized Logic**: Unit handling in one place
- **Easy to Extend**: Add new units in one location
- **Self-Documenting**: Constants include full metadata
- **No Duplicate Code**: Shared between frontend/backend

## Migration Path

### For Existing Data

If you have existing recipes/products with unit names instead of symbols:

1. **Automatic Migration** (Preferred):
```typescript
// Run this migration script
import { PrismaClient } from '@prisma/client';
import { normalizeUnit } from './shared/constants/units';

const prisma = new PrismaClient();

async function migrateUnits() {
  // Migrate recipes
  const recipes = await prisma.recipe.findMany();
  for (const recipe of recipes) {
    const normalized = normalizeUnit(recipe.yieldUnit);
    if (normalized && normalized !== recipe.yieldUnit) {
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { yieldUnit: normalized }
      });
    }
  }
  
  // Repeat for finished products, production runs, etc.
}
```

2. **Frontend Handling**: Already implemented in FinishedProducts.tsx
3. **API Normalization**: Middleware automatically handles incoming data

### For New Development

1. **Always use symbols** from `VALID_UNIT_SYMBOLS`
2. **Import from shared constants**, not hardcoded strings
3. **Use TypeScript types** (`UnitSymbol`) for type safety
4. **Let middleware handle validation**, don't duplicate logic

## Usage Examples

### Backend Controller
```typescript
import { unitSchema } from '../middleware/unitValidation';
import { UnitSymbol } from '../../../shared/constants/units';

// Validation
const schema = Joi.object({
  yieldUnit: unitSchema, // Automatically validated
  yieldQuantity: Joi.number().positive().required()
});

// Type-safe usage
const yieldUnit: UnitSymbol = 'pcs'; // TypeScript enforces valid symbols
```

### Frontend Component
```typescript
import { VALID_UNIT_SYMBOLS, formatUnit } from '../../../shared/constants/units';

// Dropdown
<Select value={unit}>
  {VALID_UNIT_SYMBOLS.map(symbol => (
    <MenuItem key={symbol} value={symbol}>
      {formatUnit(symbol, 1)}
    </MenuItem>
  ))}
</Select>

// Display
<Typography>
  {quantity} {formatUnit(unit, quantity)} // Proper pluralization
</Typography>
```

### API Request
```typescript
// All valid - middleware normalizes
await api.createRecipe({
  yieldUnit: 'pcs'    // Direct symbol - passes through
});

await api.createRecipe({
  yieldUnit: 'Piece'  // Legacy name - normalized to 'pcs'
});

await api.createRecipe({
  yieldUnit: 'xyz'    // Invalid - returns 400 error with valid options
});
```

## Error Handling

### Validation Error Response
```json
{
  "success": false,
  "error": "Invalid unit \"xyz\" for field \"yieldUnit\"",
  "validUnits": ["g", "kg", "oz", "lb", "ml", "L", "tsp", "tbsp", "cup", "pcs", "dz", "pkg"],
  "suggestion": "Please use one of the valid unit symbols"
}
```

### Frontend Error Handling
```typescript
try {
  await api.createRecipe(data);
} catch (error) {
  if (error.response?.data?.validUnits) {
    // Show user the valid options
    setError(`Invalid unit. Valid units: ${error.response.data.validUnits.join(', ')}`);
  }
}
```

## Adding New Units

To add a new unit to the system:

1. **Update `shared/constants/units.ts`**:
```typescript
export const UNIT_SYMBOLS = {
  // ... existing units
  OUNCE_FL: 'fl oz',  // Add new symbol
} as const;

export const UNITS: Record<string, UnitDefinition> = {
  // ... existing definitions
  OUNCE_FL: {
    symbol: UNIT_SYMBOLS.OUNCE_FL,
    name: 'Fluid Ounce',
    pluralName: 'Fluid Ounces',
    category: 'volume'
  },
};
```

2. **Add legacy mappings if needed**:
```typescript
const LEGACY_UNIT_MAP: Record<string, UnitSymbol> = {
  // ... existing mappings
  'Fluid Ounce': 'fl oz',
  'Fluid Ounces': 'fl oz',
};
```

3. **That's it!** The unit is now:
   - ✅ Available in all dropdowns (frontend)
   - ✅ Validated by middleware (backend)
   - ✅ Type-safe in TypeScript
   - ✅ Normalized from legacy names

No need to update routes, controllers, or components - they all reference the shared constants.

## Best Practices

### DO ✅
- Use `UnitSymbol` type for unit variables
- Import from shared constants file
- Use `formatUnit()` for display with proper pluralization
- Let middleware handle validation
- Use `normalizeUnit()` for user input

### DON'T ❌
- Hardcode unit strings like `'pcs'` or `'kg'`
- Create separate unit lists in different files
- Bypass validation middleware
- Mix unit names and symbols
- Skip TypeScript types

## Troubleshooting

### "Cannot find module shared/constants/units"
- Check tsconfig.json includes `"../shared/**/*"` in `include` array
- Restart TypeScript server: `Cmd+Shift+P` → "TypeScript: Restart TS Server"
- Verify file path is correct (3 levels up from backend/src/*)

### "MUI Select value not in options"
- Check that MenuItem `value` prop uses `unit.symbol`, not `unit.name`
- Apply `normalizeUnit()` to legacy data before setting form values
- Verify database value is a valid symbol from `VALID_UNIT_SYMBOLS`

### "Unit validation failing"
- Check that middleware is applied to route: `router.post('/', normalizeUnitsMiddleware, handler)`
- Verify import path to middleware is correct
- Check error response - it includes valid units list
- Confirm unit is in `VALID_UNIT_SYMBOLS` array

### "TypeScript errors with unit types"
- Use `UnitSymbol` type, not `string`
- Import types from shared constants
- Check tsconfig includes shared folder
- Restart TS server after tsconfig changes

## Files Modified

### Created
- ✅ `shared/constants/units.ts` - Single source of truth
- ✅ `backend/src/middleware/unitValidation.ts` - Validation middleware
- ✅ `test-unit-validation.js` - Test suite

### Modified
- ✅ `backend/tsconfig.json` - Include shared folder
- ✅ `frontend/tsconfig.json` - Include shared folder
- ✅ `backend/src/routes/recipes.ts` - Apply middleware
- ✅ `backend/src/routes/production.ts` - Apply middleware
- ✅ `backend/src/routes/finishedProducts.ts` - Apply middleware
- ✅ `frontend/src/components/Recipe/EnhancedRecipeForm.tsx` - Use unit.symbol
- ✅ `frontend/src/pages/FinishedProducts.tsx` - Add normalizeUnit()

## Next Steps (Optional Enhancements)

### Database Constraints
Add database-level validation:
```sql
ALTER TABLE recipes
ADD CONSTRAINT check_yield_unit 
CHECK (yieldUnit IN ('g', 'kg', 'oz', 'lb', 'ml', 'L', 'tsp', 'tbsp', 'cup', 'pcs', 'dz', 'pkg'));
```

### Unit Conversion
Implement conversion utilities:
```typescript
export function convertUnit(
  value: number,
  from: UnitSymbol,
  to: UnitSymbol
): number | null {
  // Conversion logic using conversionToBase
}
```

### Analytics
Track unit usage:
- Most common units
- Conversion patterns
- Legacy name frequency

### Documentation
- API documentation with unit requirements
- User guide for unit selection
- Migration guide for existing data

## Conclusion

This comprehensive unit management system:
- ✅ **Eliminates inconsistencies** through single source of truth
- ✅ **Prevents bad data** with validation at API layer
- ✅ **Maintains backwards compatibility** with legacy data normalization
- ✅ **Provides type safety** with TypeScript
- ✅ **Simplifies maintenance** with centralized logic
- ✅ **Enables easy extension** with clear pattern for new units

All unit-related issues (MUI validation errors, API failures, data inconsistencies) are now systematically prevented at multiple levels: TypeScript compile-time, runtime validation, and frontend normalization.
