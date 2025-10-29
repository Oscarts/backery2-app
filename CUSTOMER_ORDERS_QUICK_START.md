# Customer Orders - Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### Step 1: Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### Step 2: Sync Database Schema
```bash
npx prisma db push --accept-data-loss
```

### Step 3: Seed Test Data
```bash
npx ts-node seed-customer-orders.ts
```

### Step 4: Start the Application
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Step 5: Access the Feature
Open your browser and navigate to:
- **Customers:** http://localhost:3002/customers
- **Orders:** http://localhost:3002/customer-orders

---

## 📋 Testing Checklist

### Customer Management
- [ ] View customer list
- [ ] Search customers by name/email/phone
- [ ] Create new customer
- [ ] Edit customer details
- [ ] Toggle customer active/inactive status
- [ ] Delete customer (should fail if orders exist)
- [ ] View order count per customer

### Customer Orders
- [ ] View orders list with status badges
- [ ] Filter by status (DRAFT, CONFIRMED, FULFILLED)
- [ ] Filter by customer
- [ ] Filter by date range
- [ ] Search orders

### Order Status Workflow
- [ ] Create order in DRAFT status
- [ ] Confirm order (DRAFT → CONFIRMED) - reserves inventory
- [ ] Revert order (CONFIRMED → DRAFT) - releases inventory
- [ ] Fulfill order (CONFIRMED → FULFILLED) - consumes inventory
- [ ] Verify inventory check before confirm
- [ ] Try to delete CONFIRMED/FULFILLED order (should fail)

### API Testing
```bash
# Get all customers
curl http://localhost:8000/api/customers

# Get all orders
curl http://localhost:8000/api/customer-orders

# Get orders by status
curl "http://localhost:8000/api/customer-orders?status=CONFIRMED"

# Check inventory for an order
curl http://localhost:8000/api/customer-orders/{orderId}/inventory-check

# Export PDF
curl http://localhost:8000/api/customer-orders/{orderId}/export/pdf --output order.pdf

# Export Excel
curl http://localhost:8000/api/customer-orders/{orderId}/export/excel --output order.xlsx
```

---

## 🎯 Key Features to Test

### 1. Inventory Integration
- Create order with available products
- Confirm order → check `reservedQuantity` increased
- Revert order → check `reservedQuantity` decreased
- Fulfill order → check both `quantity` and `reservedQuantity` decreased
- Try confirming order with insufficient inventory → should fail

### 2. Order Number Generation
- Create multiple orders
- Verify format: ORD-YYYYMM-####
- Verify auto-increment works

### 3. Cost Calculations
- Create order with multiple items
- Verify line costs = unit cost × quantity
- Verify total production cost = sum of line costs
- Verify markup percentage applies correctly
- Verify total price = sum of line prices

### 4. Status Guards
- Try editing FULFILLED order → should be read-only
- Try deleting CONFIRMED order → should fail
- Try reverting DRAFT order → should fail
- Try fulfilling DRAFT order → should fail

### 5. Export Functionality
- Export single order as PDF → verify formatting
- Export single order as Excel → verify 2 sheets
- Bulk export with filters → verify data accuracy

---

## 🐛 Troubleshooting

### Prisma Client Errors
**Problem:** `Property 'customer' does not exist on type 'PrismaClient'`

**Solution:**
```bash
cd backend
npx prisma generate
# Restart TypeScript server in VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Database Schema Issues
**Problem:** Tables don't exist

**Solution:**
```bash
cd backend
npx prisma db push --accept-data-loss
```

### Seed Data Errors
**Problem:** Foreign key constraint errors

**Solution:**
Ensure you have existing finished products:
```bash
# Check if finished products exist
npx prisma studio
# Navigate to FinishedProduct table
# If empty, seed finished products first
```

### Port Conflicts
**Problem:** Port 8000 or 3002 already in use

**Solution:**
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

---

## 📊 Expected Seed Data

After running seed script, you should see:

**Customers (5):**
1. La Petite Boulangerie (Active)
2. Sweet Treats Café (Active)
3. Downtown Coffee House (Active)
4. The Morning Glory Bakery (Active)
5. Artisan Bread Co. (Inactive)

**Orders (5):**
1. FULFILLED - La Petite Boulangerie - Past delivery
2. CONFIRMED - Sweet Treats Café - Tomorrow
3. DRAFT - Downtown Coffee House - Next week
4. CONFIRMED - The Morning Glory Bakery - 2 weeks (high quantity)
5. DRAFT - La Petite Boulangerie - 2 weeks (multiple items)

---

## 🔍 Manual Testing Scenarios

### Scenario 1: Complete Order Lifecycle
1. Navigate to Customers page
2. Create new customer "Test Bakery"
3. Navigate to Orders page
4. Click "New Order"
5. Select "Test Bakery" as customer
6. Add finished products with quantities
7. Set delivery date
8. Set markup percentage
9. Save order (status: DRAFT)
10. Click "Check Inventory" → verify availability
11. Click "Confirm Order" → status changes to CONFIRMED
12. Check finished products inventory → reservedQuantity increased
13. Click "Fulfill Order" → status changes to FULFILLED
14. Check finished products inventory → quantity decreased
15. Try to edit/delete → should be blocked

### Scenario 2: Insufficient Inventory
1. Create order with very high quantity (e.g., 10,000 units)
2. Try to confirm order
3. Should receive error about insufficient inventory
4. Check inventory status
5. Adjust quantities
6. Retry confirmation

### Scenario 3: Export Testing
1. Select any order
2. Click "Export PDF"
3. Verify PDF downloads and opens correctly
4. Click "Export Excel"
5. Verify Excel has 2 sheets (Summary + Items)
6. Test bulk export with filters:
   - Filter by status
   - Filter by date range
   - Verify Excel has correct data

---

## 📈 Performance Benchmarks

Expected response times (local development):

- **GET /api/customers** - < 50ms
- **GET /api/customer-orders** - < 100ms
- **POST /api/customers** - < 100ms
- **POST /api/customer-orders** - < 200ms
- **POST /api/customer-orders/:id/confirm** - < 300ms (includes transaction)
- **GET /api/customer-orders/:id/export/pdf** - < 500ms
- **GET /api/customer-orders/:id/export/excel** - < 400ms
- **POST /api/customer-orders/export/excel** (bulk) - < 1000ms

---

## ✅ Success Criteria

Feature is working correctly if:

- ✅ All customers visible in list
- ✅ Can create, edit, delete customers
- ✅ All orders visible with correct status badges
- ✅ Can filter orders by status, customer, date
- ✅ Order status transitions work (DRAFT → CONFIRMED → FULFILLED)
- ✅ Inventory reservation/release/consumption works
- ✅ Order numbers auto-generate correctly
- ✅ Cost calculations are accurate
- ✅ PDF export generates valid document
- ✅ Excel export has correct data structure
- ✅ Bulk export filters work correctly
- ✅ No TypeScript errors in console
- ✅ No runtime errors in terminal
- ✅ Navigation works (menu items link correctly)

---

## 🚦 Next Steps

Once basic testing is complete:

1. **Create Order Form** - Build dynamic form for creating/editing orders
2. **Create Order Details Page** - Full view with cost breakdown
3. **Add Export Buttons to UI** - Download PDF/Excel from frontend
4. **Write Tests** - Backend unit tests + frontend component tests
5. **Update Documentation** - API docs and UI guidelines
6. **Final Validation** - End-to-end testing of complete workflows

---

## 📞 Support

If you encounter issues:

1. Check TypeScript errors in terminal
2. Check browser console for errors
3. Verify database schema is up to date
4. Ensure Prisma client is regenerated
5. Check seed data ran successfully
6. Review API responses in Network tab

---

**Last Updated:** October 1, 2025  
**Version:** 1.0 - Core Features Complete
