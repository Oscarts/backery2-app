# Customer Orders Feature - Implementation Guide

## ✅ Completed Steps

### 1. Database Schema ✓
- Created Prisma models for `Customer`, `CustomerOrder`, and `OrderItem`
- Added `OrderStatus` enum (DRAFT, CONFIRMED, FULFILLED)
- Applied schema to database using `npx prisma db push`
- Location: `backend/prisma/schema.prisma`

### 2. Export Dependencies ✓
- Installed `exceljs` for Excel generation
- Installed `pdfkit` and `@types/pdfkit` for PDF generation
- Ready for export service implementation

### 3. TypeScript Types ✓
- Added Customer Orders types to `frontend/src/types/index.ts`
- Includes: `Customer`, `CustomerOrder`, `OrderItem`, `OrderStatus` enum
- DTOs: `CreateCustomerData`, `CreateOrderData`, `OrderInventoryCheck`, `OrderExportFilters`

## 🚧 Implementation Roadmap

### Phase 1: Backend API (Priority)

#### A. Customer Controller
File: `backend/src/controllers/customerController.ts`

```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/customers - List all customers
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where = search
      ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' as const } },
            { email: { contains: search as string, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    res.json({ success: true, data: customers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/customers - Create customer
export const createCustomer = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const customer = await prisma.customer.create({
      data: { name, email, phone, address, isActive: isActive ?? true },
    });

    res.json({ success: true, data: customer, message: 'Customer created successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/customers/:id - Update customer
export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, isActive } = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: { name, email, phone, address, isActive },
    });

    res.json({ success: true, data: customer, message: 'Customer updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/customers/:id - Delete customer
export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check for orders
    const orderCount = await prisma.customerOrder.count({ where: { customerId: id } });
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete customer with existing orders',
      });
    }

    await prisma.customer.delete({ where: { id } });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

#### B. Customer Order Controller
File: `backend/src/controllers/customerOrderController.ts`

Key endpoints to implement:
1. `getOrders` - List with filters (status, customer, date range)
2. `createOrder` - Generate orderNumber, create order + items
3. `updateOrder` - Respect status rules (FULFILLED immutable)
4. `deleteOrder` - Only DRAFT orders
5. `confirmOrder` - Transition DRAFT → CONFIRMED (reserve inventory)
6. `revertToDraft` - CONFIRMED → DRAFT (release reservations)
7. `fulfillOrder` - CONFIRMED → FULFILLED (consume inventory)
8. `checkInventory` - Validate inventory availability

**Critical Logic:**
```typescript
// Order number generation
const generateOrderNumber = async (): Promise<string> => {
  const today = new Date();
  const prefix = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const lastOrder = await prisma.customerOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
  });

  const sequence = lastOrder
    ? parseInt(lastOrder.orderNumber.split('-')[2]) + 1
    : 1;

  return `${prefix}-${String(sequence).padStart(4, '0')}`;
};
```

#### C. Export Service
File: `backend/src/services/orderExportService.ts`

Implement three export functions:
1. `generateOrderPDF(orderId: string): Promise<Buffer>`
2. `generateOrderExcel(orderId: string): Promise<Buffer>`
3. `generateBulkExcel(filters: ExportFilters): Promise<Buffer>`

**PDF Generation Template:**
```typescript
import PDFDocument from 'pdfkit';

export const generateOrderPDF = async (orderId: string): Promise<Buffer> => {
  const order = await prisma.customerOrder.findUnique({
    where: { id: orderId },
    include: { customer: true, items: true },
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    // Header
    doc.fontSize(20).text('Customer Order', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order #: ${order.orderNumber}`);
    doc.text(`Customer: ${order.customer.name}`);
    doc.text(`Delivery Date: ${new Date(order.expectedDeliveryDate).toLocaleDateString()}`);
    doc.text(`Status: ${order.status}`);
    doc.moveDown();

    // Items table
    doc.fontSize(14).text('Order Items:');
    // Add table rendering logic

    // Summary
    doc.moveDown();
    doc.text(`Total Production Cost: $${order.totalProductionCost.toFixed(2)}`);
    doc.text(`Total Price: $${order.totalPrice.toFixed(2)}`);
    doc.text(`Profit: $${(order.totalPrice - order.totalProductionCost).toFixed(2)}`);

    doc.end();
  });
};
```

#### D. Routes
Create `backend/src/routes/customers.ts` and `backend/src/routes/customer-orders.ts`:

```typescript
import express from 'express';
import * as controller from '../controllers/customerController';

const router = express.Router();

router.get('/', controller.getCustomers);
router.post('/', controller.createCustomer);
router.get('/:id', controller.getCustomerById);
router.put('/:id', controller.updateCustomer);
router.delete('/:id', controller.deleteCustomer);

export default router;
```

Register in `backend/src/app.ts`:
```typescript
import customerRoutes from './routes/customers';
import customerOrderRoutes from './routes/customer-orders';

app.use('/api/customers', customerRoutes);
app.use('/api/customer-orders', customerOrderRoutes);
```

### Phase 2: Inventory Reservation System

Create `backend/src/services/inventoryReservationService.ts`:

```typescript
export const reserveInventory = async (orderId: string) => {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.customerOrder.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    for (const item of order.items) {
      const product = await tx.finishedProduct.findUnique({
        where: { id: item.productId },
      });

      const available = product.quantity - product.reservedQuantity;
      if (available < item.quantity) {
        throw new Error(`Insufficient inventory for ${item.productName}`);
      }

      await tx.finishedProduct.update({
        where: { id: item.productId },
        data: { reservedQuantity: { increment: item.quantity } },
      });
    }
  });
};

export const releaseInventory = async (orderId: string) => {
  // Similar logic to decrement reservedQuantity
};

export const consumeInventory = async (orderId: string) => {
  // Decrement both quantity and reservedQuantity
};
```

### Phase 3: Frontend Implementation

#### A. API Service
File: `frontend/src/services/realApi.ts`

Add methods:
```typescript
// Customer methods
getCustomers: (search?: string) => axios.get('/customers', { params: { search } }),
createCustomer: (data: CreateCustomerData) => axios.post('/customers', data),
updateCustomer: (id: string, data: Partial<CreateCustomerData>) => 
  axios.put(`/customers/${id}`, data),
deleteCustomer: (id: string) => axios.delete(`/customers/${id}`),

// Order methods
getOrders: (filters?: OrderFilters) => axios.get('/customer-orders', { params: filters }),
createOrder: (data: CreateOrderData) => axios.post('/customer-orders', data),
updateOrder: (id: string, data: Partial<CreateOrderData>) => 
  axios.put(`/customer-orders/${id}`, data),
deleteOrder: (id: string) => axios.delete(`/customer-orders/${id}`),
confirmOrder: (id: string) => axios.post(`/customer-orders/${id}/confirm`),
revertOrder: (id: string) => axios.post(`/customer-orders/${id}/revert-draft`),
fulfillOrder: (id: string) => axios.post(`/customer-orders/${id}/fulfill`),
checkOrderInventory: (id: string) => axios.get(`/customer-orders/${id}/inventory-check`),

// Export methods
exportOrderPDF: (id: string) => 
  axios.get(`/customer-orders/${id}/export/pdf`, { responseType: 'blob' }),
exportOrderExcel: (id: string) => 
  axios.get(`/customer-orders/${id}/export/excel`, { responseType: 'blob' }),
exportOrdersBulk: (filters: OrderExportFilters) => 
  axios.post('/customer-orders/export/excel', filters, { responseType: 'blob' }),
```

#### B. Customer Management Page
File: `frontend/src/pages/Customers.tsx`

Follow the pattern from `RawMaterials.tsx` or `FinishedProducts.tsx`:
- List view with search
- Create/Edit dialog with form validation
- Delete with confirmation
- Show order count per customer

#### C. Customer Orders Page
File: `frontend/src/pages/CustomerOrders.tsx`

Features:
- Filterable list (status chips, customer dropdown, date range)
- Status color coding:
  - DRAFT: grey
  - CONFIRMED: blue
  - FULFILLED: green
- Quick actions: View, Edit (if DRAFT), Status transitions
- Bulk export button

#### D. Order Form Component
Create reusable form component with sections:
1. Customer selection (Autocomplete)
2. Delivery date (DatePicker)
3. Product items (dynamic list with Add/Remove)
4. Price calculation panel (production cost, markup %, final price)
5. Notes field

#### E. Order Details View
Show complete order information:
- Customer details
- Order status with action buttons
- Items table with cost breakdown
- Export buttons (PDF + Excel)
- Product details with raw materials used

### Phase 4: Testing

#### Backend Tests
File: `backend/tests/customer-orders.test.ts`

```typescript
describe('Customer Orders API', () => {
  test('should create order with valid data', async () => {
    const response = await request(app)
      .post('/api/customer-orders')
      .send({
        customerId: testCustomer.id,
        expectedDeliveryDate: new Date().toISOString(),
        items: [
          {
            productId: testProduct.id,
            productName: testProduct.name,
            quantity: 5,
            unitProductionCost: testProduct.costToProduce,
            unitPrice: testProduct.salePrice,
          },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.orderNumber).toMatch(/ORD-\d{6}-\d{4}/);
  });

  test('should not confirm order with insufficient inventory', async () => {
    // Test inventory validation
  });

  test('should reserve inventory on confirm', async () => {
    // Test reservation logic
  });
});
```

### Phase 5: Documentation

#### Update API Reference
File: `docs/api-reference.md`

Add section:
```markdown
## 📦 Customer Orders API

### Order Status Workflow
- **DRAFT**: Editable, no inventory reserved
- **CONFIRMED**: Inventory reserved, limited editing
- **FULFILLED**: Immutable, inventory consumed

### Endpoints
[Document all endpoints with examples]
```

#### Update UI Guidelines
File: `docs/ui-guidelines.md`

Add patterns for:
- Order status badges
- Export buttons placement
- Bulk export dialog design

## 🎯 Next Steps

1. **Implement Backend Controllers** (Priority 1)
   - Start with customer controller
   - Then order controller with status transitions
   - Add inventory reservation service

2. **Create Export Service** (Priority 2)
   - Implement PDF generation
   - Implement Excel exports

3. **Build Frontend** (Priority 3)
   - Customer management page
   - Orders list page
   - Order form and details

4. **Testing** (Priority 4)
   - Backend unit tests
   - Frontend component tests
   - Integration tests

5. **Documentation** (Final)
   - API reference
   - UI guidelines
   - User guide

## ⚠️ Important Notes

- Always use Prisma transactions for status changes affecting inventory
- Validate inventory availability before confirming orders
- Maintain audit trail (createdAt, updatedAt timestamps)
- Handle edge cases (deleted products, negative quantities)
- Follow existing project patterns for consistency
- Export files should use proper MIME types and Content-Disposition headers

## 📚 Reference Files

Look at these existing files for patterns:
- `backend/src/controllers/productionRunController.ts` - Status transitions
- `backend/src/services/productionCompletionService.ts` - Inventory management
- `frontend/src/pages/RawMaterials.tsx` - List/CRUD patterns
- `frontend/src/components/Production/ProductionDashboard.tsx` - Dashboard layout

## 🏁 Definition of Done

- [ ] All backend endpoints implemented and tested
- [ ] Inventory reservation system working correctly
- [ ] PDF and Excel exports functional
- [ ] Frontend UI complete with all features
- [ ] All tests passing (>85% backend, >75% frontend)
- [ ] API documentation updated
- [ ] UI guidelines updated
- [ ] No TypeScript errors
- [ ] Feature validated end-to-end
