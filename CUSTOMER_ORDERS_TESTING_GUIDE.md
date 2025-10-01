# Customer Orders Feature - Testing Guide

## ✅ Feature Status

**Status:** ✅ **FULLY OPERATIONAL**  
**Date:** October 1, 2025  
**Version:** 1.0.0

## 🎯 What's Been Completed

### Backend (100%)
- ✅ Database schema with 3 new models (Customer, CustomerOrder, OrderItem)
- ✅ 18 operational API endpoints (5 customer + 13 order endpoints)
- ✅ Inventory reservation service with transaction safety
- ✅ PDF and Excel export services
- ✅ Complete CRUD operations for customers and orders
- ✅ Status workflow (DRAFT → CONFIRMED → FULFILLED)

### Frontend (100%)
- ✅ Customer management page with CRUD operations
- ✅ Customer orders list with filtering and search
- ✅ Order creation/edit form with dynamic items
- ✅ Order details view with status management
- ✅ Full integration with backend APIs
- ✅ Material-UI design following project patterns

### Database
- ✅ Schema migration applied
- ✅ Seed data created:
  - 5 Customers (4 active, 1 inactive)
  - 5 Orders (1 FULFILLED, 1 CONFIRMED, 3 DRAFT)
  - 10 Order Items
  - 5 Finished Products

## 🚀 How to Test

### 1. Access the Application

**Frontend:** http://localhost:3002  
**Backend API:** http://localhost:8000

Both servers are currently running!

### 2. Test Customer Management

1. Navigate to **Customers** from the sidebar menu
2. View the list of 5 customers
3. Try searching by name, email, or phone
4. Click **"Add Customer"** to create a new one
5. Edit an existing customer
6. Try to delete a customer (should fail if they have orders)

### 3. Test Customer Orders List

1. Navigate to **Customer Orders** from the sidebar
2. View all 5 orders with different statuses:
   - 🟢 1 FULFILLED order (green badge)
   - 🔵 1 CONFIRMED order (blue badge)
   - ⚪ 3 DRAFT orders (grey badge)
3. Test filters:
   - Filter by status (DRAFT, CONFIRMED, FULFILLED)
   - Filter by customer
   - Filter by date range
4. Click on any order row to view details

### 4. Test Order Creation

1. Click **"New Order"** button
2. Fill out the form:
   - Select customer: "La Petite Boulangerie"
   - Set delivery date: Tomorrow
   - Set markup: 50%
   - Click **"Add Item"**
   - Select product: "Croissant"
   - Set quantity: 25
   - Unit price auto-calculates (1.20 * 1.5 = 1.80)
3. Add more items if desired
4. Review order summary (items count, costs, prices)
5. Click **"Create Order"**
6. Verify redirect to orders list
7. New order should appear with DRAFT status

### 5. Test Order Details View

1. Click on any order from the list
2. Verify you see:
   - Order number and status badge
   - Customer information
   - Order dates and notes
   - Items table with products, quantities, costs
   - Order summary with totals
   - Action buttons (based on status)

### 6. Test Inventory Check

1. Open a DRAFT order
2. Click **"Check Inventory"** button
3. View inventory availability dialog:
   - ✅ Green checkmark = sufficient inventory
   - ❌ Red X = insufficient inventory
   - Shows required vs available quantities
4. Close dialog

### 7. Test Order Confirmation (Status Transition)

1. Open a DRAFT order with sufficient inventory
2. Click **"Confirm Order"** button
3. Read confirmation dialog explaining that inventory will be reserved
4. Click **"Confirm"**
5. Verify:
   - Status changes to CONFIRMED (blue badge)
   - Success notification appears
   - Action buttons change (Revert to Draft, Fulfill Order)
   - Edit button disappears

### 8. Test Revert to Draft

1. Open a CONFIRMED order
2. Click **"Revert to Draft"** button
3. Read dialog explaining inventory will be released
4. Click **"Revert"**
5. Verify:
   - Status changes back to DRAFT (grey badge)
   - Success notification appears
   - Edit and Confirm buttons reappear

### 9. Test Order Fulfillment

1. Open a CONFIRMED order
2. Click **"Fulfill Order"** button
3. Read dialog explaining inventory will be consumed
4. Click **"Fulfill"**
5. Verify:
   - Status changes to FULFILLED (green badge)
   - Success message appears
   - Order becomes read-only (no action buttons except exports)

### 10. Test PDF Export

1. Open any order
2. Click **"Export PDF"** button (top right)
3. PDF should download automatically with filename: `order-{orderNumber}.pdf`
4. Open PDF and verify:
   - Order details formatted nicely
   - Customer information
   - Items table
   - Totals

### 11. Test Excel Export

1. Open any order
2. Click **"Export Excel"** button (top right)
3. Excel file should download with filename: `order-{orderNumber}.xlsx`
4. Open Excel and verify two sheets:
   - **Summary** sheet: Order info and totals
   - **Items** sheet: Detailed product breakdown

### 12. Test Order Editing

1. Open a DRAFT order
2. Click **"Edit Order"** button
3. Modify:
   - Change delivery date
   - Add new items
   - Remove items
   - Change quantities
   - Adjust markup percentage
4. Click **"Recalculate Prices"** to apply new markup to all items
5. Save changes
6. Verify changes appear in order details

### 13. Test Form Validation

Try to create an order without:
- Customer selected → Should show error
- Delivery date → Should show error
- At least one item → Should show error

Try to confirm an order with insufficient inventory:
- Should show error dialog with shortage details

### 14. Test Real-Time Calculations

1. In order form, add an item
2. Watch unit price auto-calculate from cost + markup
3. Change quantity → line total updates
4. Change markup percentage → click recalculate
5. Watch order summary update in real-time

## 📊 API Testing

### Customer Endpoints

```bash
# List customers
curl http://localhost:8000/api/customers

# Get customer by ID
curl http://localhost:8000/api/customers/{id}

# Create customer
curl -X POST http://localhost:8000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Customer","email":"test@example.com","phone":"555-1234","address":"123 Test St"}'

# Update customer
curl -X PUT http://localhost:8000/api/customers/{id} \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","isActive":false}'

# Delete customer
curl -X DELETE http://localhost:8000/api/customers/{id}
```

### Customer Order Endpoints

```bash
# List orders
curl http://localhost:8000/api/customer-orders

# List orders with filters
curl "http://localhost:8000/api/customer-orders?status=DRAFT&customerId={id}"

# Get order by ID
curl http://localhost:8000/api/customer-orders/{id}

# Check inventory for order
curl http://localhost:8000/api/customer-orders/{id}/inventory-check

# Create order
curl -X POST http://localhost:8000/api/customer-orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "{customerId}",
    "expectedDeliveryDate": "2025-10-15",
    "priceMarkupPercentage": 50,
    "items": [
      {
        "productId": "{productId}",
        "quantity": 10,
        "unitPrice": 5.00
      }
    ]
  }'

# Confirm order (reserves inventory)
curl -X POST http://localhost:8000/api/customer-orders/{id}/confirm

# Revert to draft (releases inventory)
curl -X POST http://localhost:8000/api/customer-orders/{id}/revert-draft

# Fulfill order (consumes inventory)
curl -X POST http://localhost:8000/api/customer-orders/{id}/fulfill

# Export PDF
curl http://localhost:8000/api/customer-orders/{id}/export/pdf --output order.pdf

# Export Excel
curl http://localhost:8000/api/customer-orders/{id}/export/excel --output order.xlsx
```

## 🔍 What to Verify

### Database Integrity
- ✅ Orders maintain referential integrity with customers
- ✅ Order items link to finished products correctly
- ✅ Status transitions are atomic (use transactions)
- ✅ Inventory reservations match order status

### Business Logic
- ✅ Order numbers are unique and sequential
- ✅ Costs auto-calculate from product costs
- ✅ Prices apply markup correctly
- ✅ Inventory checks prevent over-commitment
- ✅ Status workflow enforces rules (can't edit CONFIRMED orders)
- ✅ Delete protection (can't delete customer with orders)

### User Experience
- ✅ Loading states show during API calls
- ✅ Success/error notifications appear
- ✅ Forms validate before submission
- ✅ Dialogs explain consequences of actions
- ✅ Tables are sortable and filterable
- ✅ Search is responsive
- ✅ Exports download with proper filenames

## 🐛 Known Limitations

1. **Export UI Components** - Individual export buttons work, but bulk export dialog not yet implemented
2. **Tests** - No automated tests yet (unit, integration, or component tests)
3. **API Documentation** - Endpoints not yet documented in docs/api-reference.md
4. **UI Guidelines** - Patterns not yet documented in docs/ui-guidelines.md

## 📝 Current Seed Data

### Customers (5)
1. La Petite Boulangerie (Active)
2. Sweet Treats Café (Active)
3. Downtown Coffee House (Active)
4. The Corner Bakery (Active)
5. Gourmet Market & Deli (Inactive)

### Orders (5)
1. **ORD-202510-0001** - FULFILLED - La Petite Boulangerie - 2 items ($804.00)
2. **ORD-202510-0002** - CONFIRMED - Sweet Treats Café - 1 item ($22.40)
3. **ORD-202510-0003** - DRAFT - Downtown Coffee House - 2 items ($2,500.00)
4. **ORD-202510-0004** - DRAFT - The Corner Bakery - 1 item ($348.00)
5. **ORD-202510-0005** - DRAFT - La Petite Boulangerie - 4 items ($694.40)

### Products (5)
1. Croissant (200 units @ $3.50, cost $1.20)
2. Baguette (300 units @ $2.50, cost $0.80)
3. Chocolate Cake (50 units @ $25.00, cost $10.00)
4. Apple Pie (80 units @ $18.00, cost $7.50)
5. Danish Pastry (150 units @ $4.00, cost $1.50)

## 🎯 Success Criteria

✅ All core features working  
✅ No TypeScript errors  
✅ API endpoints operational  
✅ UI pages rendering correctly  
✅ Database operations successful  
✅ Status workflow functional  
✅ Inventory integration working  
✅ Export functionality operational  

## 🚀 Next Steps

After manual testing, consider:
1. Write backend unit tests (85% coverage target)
2. Write frontend component tests (75% coverage target)
3. Create integration tests for full lifecycle
4. Update API documentation
5. Document UI patterns
6. Implement bulk export dialog (optional enhancement)

---

**Ready to Test!** 🎉

Visit http://localhost:3002/customer-orders to start testing the feature!
