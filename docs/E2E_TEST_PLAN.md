# End-to-End Test Plan: Complete Business Workflow

## Objective

Create a comprehensive E2E test that validates the **entire bakery business lifecycle** - from tenant creation to order fulfillment. This test should be accessible via the superadmin account for frontend verification.

## Test Scenario: "Sweet Dreams Bakery"

A complete test tenant with realistic business data that demonstrates all system capabilities.

## Test Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         E2E TEST WORKFLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CLIENT CREATION                                                          │
│     └──> Create "test-e2e-bakery" tenant via superadmin                     │
│                                                                              │
│  2. SKU & RAW MATERIALS                                                      │
│     └──> Flour (5kg bag)                                                    │
│     └──> Sugar (1kg bag)                                                    │
│     └──> Butter (500g block)                                                │
│     └──> Eggs (30-unit carton)                                              │
│     └──> Vanilla Extract (250ml)                                            │
│     └──> Chocolate Chips (1kg bag)                                          │
│                                                                              │
│  3. FINISHED PRODUCT DEFINITIONS                                             │
│     └──> Chocolate Chip Cookies (batch of 24)                               │
│     └──> Vanilla Cupcakes (batch of 12)                                     │
│                                                                              │
│  4. RECIPES                                                                  │
│     └──> Recipe: Chocolate Chip Cookies                                     │
│         ├── 500g Flour                                                      │
│         ├── 200g Sugar                                                      │
│         ├── 250g Butter                                                     │
│         ├── 2 Eggs                                                          │
│         └── 200g Chocolate Chips                                            │
│                                                                              │
│     └──> Recipe: Vanilla Cupcakes                                           │
│         ├── 300g Flour                                                      │
│         ├── 250g Sugar                                                      │
│         ├── 150g Butter                                                     │
│         ├── 3 Eggs                                                          │
│         └── 15ml Vanilla Extract                                            │
│                                                                              │
│  5. PRODUCTION RUN                                                           │
│     └──> Produce 3 batches of Chocolate Chip Cookies                        │
│     └──> Complete all production steps                                      │
│     └──> Verify inventory deduction                                         │
│     └──> Verify finished product inventory increase                         │
│                                                                              │
│  6. CUSTOMER CREATION                                                        │
│     └──> "Café Delicias" - regular customer                                 │
│                                                                              │
│  7. CUSTOMER ORDER                                                           │
│     └──> Order: 2 batches Chocolate Chip Cookies                           │
│     └──> Status: DRAFT → CONFIRMED → FULFILLED                              │
│     └──> Verify pricing and cost calculations                               │
│     └──> Verify finished product inventory decrease                         │
│                                                                              │
│  8. VERIFICATION & CLEANUP                                                   │
│     └──> Verify all inventory levels                                        │
│     └──> Verify traceability chain                                          │
│     └──> Export order invoice                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Test Implementation Strategy

### Option A: Backend Integration Test (Recommended)

Create `/backend/tests/e2e/complete-workflow.test.ts`:

```typescript
/**
 * E2E Test: Complete Bakery Business Workflow
 * 
 * Tests the entire lifecycle:
 * 1. Client creation (via superadmin)
 * 2. SKU/Raw material setup
 * 3. Recipe creation
 * 4. Production run
 * 5. Customer creation
 * 6. Order fulfillment
 * 
 * This test creates its own isolated tenant and cleans up after.
 */

describe('E2E: Complete Business Workflow', () => {
  const testTenant = {
    name: 'E2E Test Bakery',
    slug: 'e2e-test-bakery',
  };
  
  let superadminToken: string;
  let tenantToken: string;
  let clientId: string;
  
  // Test data IDs (populated during test)
  let rawMaterialIds: Record<string, string>;
  let recipeId: string;
  let productionRunId: string;
  let customerId: string;
  let orderId: string;
  
  beforeAll(async () => {
    // Login as superadmin
    superadminToken = await loginAs('superadmin@system.local', 'super123');
  });
  
  afterAll(async () => {
    // Cleanup: Delete test tenant
    await deleteTestTenant(clientId, superadminToken);
  });
  
  describe('Phase 1: Tenant Setup', () => {
    test('should create test tenant via superadmin', async () => {
      // POST /api/clients (superadmin only)
    });
    
    test('should login to new tenant', async () => {
      // POST /api/auth/login with tenant admin
    });
  });
  
  describe('Phase 2: Inventory Setup', () => {
    test('should create raw materials with SKUs', async () => {
      // POST /api/raw-materials for each ingredient
    });
    
    test('should verify SKU auto-generation', async () => {
      // Verify SKUs are properly generated
    });
  });
  
  describe('Phase 3: Recipe Creation', () => {
    test('should create finished product definition', async () => {
      // POST /api/finished-products
    });
    
    test('should create recipe with materials', async () => {
      // POST /api/recipes with materials array
    });
    
    test('should verify cost calculation', async () => {
      // Verify recipe.cost based on material prices
    });
  });
  
  describe('Phase 4: Production', () => {
    test('should create production run', async () => {
      // POST /api/production-runs
    });
    
    test('should complete production steps', async () => {
      // PATCH /api/production-runs/:id/steps/:stepId
    });
    
    test('should verify raw material deduction', async () => {
      // GET /api/raw-materials - check quantities decreased
    });
    
    test('should verify finished product inventory', async () => {
      // GET /api/finished-products - check quantity increased
    });
  });
  
  describe('Phase 5: Customer & Orders', () => {
    test('should create customer', async () => {
      // POST /api/customers
    });
    
    test('should create customer order', async () => {
      // POST /api/customer-orders
    });
    
    test('should confirm order', async () => {
      // PATCH /api/customer-orders/:id status CONFIRMED
    });
    
    test('should fulfill order', async () => {
      // PATCH /api/customer-orders/:id status FULFILLED
    });
    
    test('should verify finished product deduction', async () => {
      // Verify inventory decreased by order quantity
    });
  });
  
  describe('Phase 6: Verification', () => {
    test('should have correct final inventory levels', async () => {
      // Verify all inventory counts
    });
    
    test('should have proper traceability', async () => {
      // Check material traceability records
    });
    
    test('should export order successfully', async () => {
      // GET /api/customer-orders/:id/export
    });
  });
});
```

### Option B: Seed Data for Frontend Testing

Create a special seed script that sets up the complete workflow data, accessible via superadmin:

**File:** `/backend/prisma/seeds/e2e-demo-data.ts`

This approach creates persistent test data that can be:
- Viewed in the frontend by logging in as superadmin
- Used for manual QA testing
- Screenshots/demos

## Data Specifications

### Raw Materials

| Name | SKU | Unit | Quantity | Price/Unit |
|------|-----|------|----------|------------|
| All-Purpose Flour | FLOUR-AP-5KG | kg | 25 | $1.50 |
| Granulated Sugar | SUGAR-GRAN-1KG | kg | 10 | $2.00 |
| Unsalted Butter | BUTTER-UNSALTED | kg | 5 | $8.00 |
| Fresh Eggs | EGGS-FRESH-30 | unit | 120 | $0.25 |
| Vanilla Extract | VANILLA-EXTRACT | ml | 500 | $0.05 |
| Chocolate Chips | CHOC-CHIPS-SEMI | kg | 3 | $12.00 |

### Recipes

**Chocolate Chip Cookies (24 cookies)**
| Ingredient | Quantity |
|------------|----------|
| Flour | 0.5 kg |
| Sugar | 0.2 kg |
| Butter | 0.25 kg |
| Eggs | 2 units |
| Chocolate Chips | 0.2 kg |
| **Total Cost** | ~$5.70 |

**Vanilla Cupcakes (12 cupcakes)**
| Ingredient | Quantity |
|------------|----------|
| Flour | 0.3 kg |
| Sugar | 0.25 kg |
| Butter | 0.15 kg |
| Eggs | 3 units |
| Vanilla Extract | 15 ml |
| **Total Cost** | ~$3.15 |

### Production Run
- Product: Chocolate Chip Cookies
- Batches: 3
- Output: 72 cookies
- Raw Material Deductions Applied

### Customer Order
- Customer: Café Delicias
- Items: 2 batches (48 cookies)
- Markup: 50%
- Total: ~$17.10

## Verification Checklist

- [ ] Tenant created and accessible
- [ ] All SKUs auto-generated correctly
- [ ] Raw materials have correct quantities
- [ ] Recipe cost calculated accurately
- [ ] Production run completes all steps
- [ ] Raw materials deducted after production
- [ ] Finished products added to inventory
- [ ] Customer created successfully
- [ ] Order created with correct pricing
- [ ] Order status transitions work
- [ ] Finished products deducted after fulfillment
- [ ] Traceability records exist
- [ ] Invoice export works

## Running the E2E Test

```bash
# Run only the E2E test
cd backend
npx jest tests/e2e/complete-workflow.test.ts --runInBand

# Run with verbose output
npx jest tests/e2e/complete-workflow.test.ts --runInBand --verbose
```

## Frontend Verification

After running the E2E test (Option B - seed data):

1. Login as superadmin: `superadmin@system.local` / `super123`
2. Switch to "E2E Test Bakery" client
3. Navigate through:
   - Raw Materials → Verify inventory levels
   - Recipes → Verify cost calculations
   - Production → View completed production run
   - Customers → Verify customer exists
   - Orders → View fulfilled order and export invoice

## Implementation Priority

1. **First**: Create the backend integration test (Option A)
2. **Second**: Add seed data for frontend verification (Option B)
3. **Third**: Add to CI pipeline for regression testing

## Notes

- Test should be **idempotent** - can run multiple times without side effects
- Tenant cleanup should be automatic in `afterAll()`
- Consider adding performance benchmarks
- Could extend to test concurrent orders, bulk operations
