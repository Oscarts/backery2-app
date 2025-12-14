# Customer Orders Feature - Continuation Prompt for Next Development Session

**Date:** October 1, 2025  
**Branch:** sku  
**Last Commit:** ffc1b27  
**Feature Status:** 67% Complete (Core Functionality 100% Done)

---

## 🎯 PROMPT FOR NEXT AGENT/DEVELOPER

```
Continue development on the Customer Orders Management feature for the Bakery Inventory 
Management System. The core functionality is complete and committed, but we need to add 
comprehensive testing to ensure production readiness.

### Current State:
- ✅ Backend: 18 API endpoints operational (customers, orders, exports)
- ✅ Frontend: 4 complete pages (Customers, Orders List, Order Form, Order Details)
- ✅ Database: Seeded with 5 customers and 5 orders (various statuses)
- ✅ Servers: Running on localhost:8000 (backend) and localhost:3002 (frontend)
- ✅ Documentation: Complete implementation and testing guides created

### Immediate Priority: Backend Unit Tests (Task #2)

**Goal:** Achieve >85% test coverage for the customer orders feature backend.

**Files to Create:**
1. backend/tests/customer.test.ts
2. backend/tests/customer-orders.test.ts
3. backend/tests/inventory-reservation.test.ts
4. backend/tests/order-export.test.ts

**What to Test:**
- Customer CRUD operations (create, read, update, delete)
- Customer search and filtering
- Delete protection (prevent deletion if customer has orders)
- Order creation with multiple items
- Order updates (only DRAFT orders should be editable)
- Status transitions (DRAFT → CONFIRMED → FULFILLED)
- Inventory reservation on confirm
- Inventory release on revert to draft
- Inventory consumption on fulfill
- Insufficient inventory error handling
- PDF export generation
- Excel export generation (single and bulk)
- Transaction rollback on errors
- Validation errors for invalid inputs

**Test Framework Setup:**
- Jest is already configured in the backend
- Install additional test dependencies if needed:
  ```bash
  cd backend
  npm install --save-dev @types/jest @types/supertest supertest
  ```

**Test Structure Pattern:**
Follow existing test patterns in the codebase. Each test file should:
1. Set up test database or use mocks
2. Create test data in beforeEach
3. Clean up in afterEach
4. Group tests by functionality using describe blocks
5. Test both success and error cases
6. Verify response status codes and data structure
7. Test edge cases and boundary conditions

**Example Test Structure:**
```typescript
describe('Customer API', () => {
  describe('GET /api/customers', () => {
    it('should return list of customers', async () => {
      // Test implementation
    });
    
    it('should filter customers by search term', async () => {
      // Test implementation
    });
  });
  
  describe('POST /api/customers', () => {
    it('should create a new customer', async () => {
      // Test implementation
    });
    
    it('should return 400 if name is missing', async () => {
      // Test validation
    });
  });
  
  describe('DELETE /api/customers/:id', () => {
    it('should prevent deletion if customer has orders', async () => {
      // Test protection logic
    });
  });
});
```

**Key API Endpoints to Test:**

Customer Endpoints:
- GET /api/customers
- GET /api/customers/:id
- POST /api/customers
- PUT /api/customers/:id
- DELETE /api/customers/:id

Customer Order Endpoints:
- GET /api/customer-orders
- GET /api/customer-orders/:id
- GET /api/customer-orders/:id/inventory-check
- POST /api/customer-orders
- PUT /api/customer-orders/:id
- DELETE /api/customer-orders/:id
- POST /api/customer-orders/:id/confirm
- POST /api/customer-orders/:id/revert-draft
- POST /api/customer-orders/:id/fulfill

Export Endpoints:
- GET /api/customer-orders/:id/export/pdf
- GET /api/customer-orders/:id/export/excel
- POST /api/customer-orders/export/excel

**Critical Test Scenarios:**

1. **Order Lifecycle Test:**
   - Create order in DRAFT status
   - Confirm order (should reserve inventory)
   - Verify inventory reserved
   - Fulfill order (should consume inventory)
   - Verify inventory consumed

2. **Inventory Shortage Test:**
   - Create order with quantity > available inventory
   - Attempt to confirm
   - Should return error with shortage details

3. **Concurrent Order Test:**
   - Create multiple orders for same product
   - Confirm first order (reserves inventory)
   - Attempt to confirm second order
   - Should handle correctly based on remaining inventory

4. **Transaction Rollback Test:**
   - Create order with multiple items
   - One item has insufficient inventory
   - Entire confirmation should fail
   - No partial inventory reservations

**Resources Available:**
- Implementation details: CUSTOMER_ORDERS_IMPLEMENTATION_STATUS.md
- Testing guide: CUSTOMER_ORDERS_TESTING_GUIDE.md
- Next steps: NEXT_STEPS_CUSTOMER_ORDERS.md
- Complete report: CUSTOMER_ORDERS_COMPLETE_REPORT.md

**Controllers to Test:**
- backend/src/controllers/customerController.ts (268 lines)
- backend/src/controllers/customerOrderController.ts (515 lines)
- backend/src/controllers/orderExportController.ts (67 lines)

**Services to Test:**
- backend/src/services/inventoryReservationService.ts (220 lines)
- backend/src/services/orderExportService.ts (318 lines)

**Success Criteria:**
- All tests passing
- Coverage >85% for customer order controllers and services
- No race conditions in inventory operations
- All edge cases covered
- Clear test descriptions and assertions

**Estimated Time:** 8-10 hours

**After Completion:**
Move to Task #3 (Frontend Component Tests) or Task #4 (Integration Tests)

### Context Commands to Run First:

```bash
# Verify backend is running
curl http://localhost:8000/api/customers

# Verify database has data
cd backend
npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const customers = await prisma.customer.count();
  const orders = await prisma.customerOrder.count();
  console.log('Customers:', customers, '| Orders:', orders);
  await prisma.\$disconnect();
}
check();
"

# Check current test setup
ls -la backend/tests/
cat backend/jest.config.js
```

**Start Here:**
1. Read CUSTOMER_ORDERS_IMPLEMENTATION_STATUS.md for full context
2. Review existing test patterns in backend/tests/
3. Set up test environment and dependencies
4. Create first test file: backend/tests/customer.test.ts
5. Run tests frequently: `npm test` or `npx jest`
6. Aim for >85% coverage: `npx jest --coverage`

**Important Notes:**
- Follow TDD principles: write test, make it pass, refactor
- Test both happy paths and error cases
- Use descriptive test names that explain what's being tested
- Mock external dependencies where appropriate
- Test isolation: each test should be independent
- Use beforeEach/afterEach for setup/cleanup
- Test transaction rollback behavior

**Git Workflow:**
- Create tests on current branch: sku
- Commit frequently with descriptive messages
- Push when tests are passing and coverage target met
```

---

## 📋 Quick Reference Commands

### Verify System State
```bash
# Check backend API
curl http://localhost:8000/api/customer-orders | jq '.'

# Check frontend
curl http://localhost:3002 | head -20

# Verify database
cd backend && npx tsx check-db-quick.js
```

### Run Tests
```bash
cd backend

# Run all tests
npm test

# Run specific test file
npx jest tests/customer.test.ts

# Run with coverage
npx jest --coverage

# Watch mode
npx jest --watch
```

### Database Commands
```bash
cd backend

# Reset database (if needed)
npx prisma db push --force-reset

# Re-seed data
npx ts-node seed-customer-orders-simple.ts

# Check data
npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const count = await prisma.customerOrder.count();
  console.log('Orders:', count);
  await prisma.\$disconnect();
}
check();
"
```

### Documentation Commands
```bash
# Read implementation status
cat CUSTOMER_ORDERS_IMPLEMENTATION_STATUS.md | less

# Read testing guide
cat CUSTOMER_ORDERS_TESTING_GUIDE.md | less

# Read next steps
cat NEXT_STEPS_CUSTOMER_ORDERS.md | less
```

---

## 🎯 Alternative Tasks (If Backend Tests are Blocked)

### Task #3: Frontend Component Tests (6-8 hours, HIGH PRIORITY)
Set up React Testing Library and create tests for:
- frontend/src/pages/__tests__/Customers.test.tsx
- frontend/src/pages/__tests__/CustomerOrders.test.tsx
- frontend/src/pages/__tests__/OrderForm.test.tsx
- frontend/src/pages/__tests__/OrderDetails.test.tsx

Target: >75% coverage

### Task #5: API Documentation (3-4 hours, MEDIUM PRIORITY)
Update docs/api-reference.md with:
- All 18 customer order endpoints
- Request/response examples
- Status workflow diagram
- Error codes and messages

### Task #6: UI Guidelines (2-3 hours, MEDIUM PRIORITY)
Update docs/ui-guidelines.md with:
- Customer management UI patterns
- Order form patterns (dynamic item arrays)
- Status badge usage
- Dialog confirmation patterns
- Export button patterns

---

## 🚨 Common Issues & Solutions

### Issue: Test database conflicts with dev database
**Solution:** Use a separate test database or mock Prisma client

### Issue: Tests fail due to missing data
**Solution:** Create test data in beforeEach hooks

### Issue: Async test timing issues
**Solution:** Use proper async/await and jest.setTimeout if needed

### Issue: Export tests fail (PDF/Excel generation)
**Solution:** Mock the export service or test actual file generation

### Issue: Transaction tests are complex
**Solution:** Test transaction behavior by checking database state before/after

---

## 📊 Progress Tracking

Update the todo list as you complete tasks:
```markdown
- [x] Backend Unit Tests - COMPLETED
  - All 4 test files created
  - Coverage: 87% (target: >85%)
  - All tests passing
```

Commit message template:
```
test: Add comprehensive backend unit tests for customer orders

- Create customer.test.ts with CRUD operation tests
- Create customer-orders.test.ts with lifecycle tests
- Create inventory-reservation.test.ts with transaction tests
- Create order-export.test.ts with export generation tests
- Achieve 87% test coverage (target: >85%)
- Test all success and error cases
- Test inventory reservation/release/consumption
- Test transaction rollback behavior

All 124 tests passing
Coverage: 87% statements, 85% branches, 90% functions, 86% lines
```

---

## 🎓 Learning Resources

**Testing Best Practices:**
- Jest Documentation: https://jestjs.io/docs/getting-started
- Supertest for API testing: https://github.com/visionmedia/supertest
- Testing Prisma: https://www.prisma.io/docs/guides/testing

**Project Patterns:**
- Review existing tests in backend/tests/
- Follow Material-UI patterns in frontend
- Use React Query patterns for data fetching
- Follow TypeScript strict mode conventions

---

## ✅ Definition of Done

A task is complete when:
- [ ] All test files created
- [ ] All tests passing
- [ ] Coverage target met (>85% backend, >75% frontend)
- [ ] Code reviewed for quality
- [ ] Documentation updated (if needed)
- [ ] Changes committed with descriptive message
- [ ] Changes pushed to branch

---

**Ready to Start!** 🚀

Begin with: `cd backend && npm test` to verify current test setup, then start creating test files.
