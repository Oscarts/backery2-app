# Enhanced Order Form - Quick Start Guide

## What's New?

The customer order form has been completely redesigned with better UX/UI:

### 🎯 Key Features

1. **Rich Product Selection**
   - Click "Add Product" to open visual product selector
   - See available quantity, expiration date, and batch number
   - Search by name, SKU, or batch
   - Products auto-sorted by expiration (FIFO)
   - Already-selected products automatically hidden

2. **Smart Order Items**
   - Each item shows full context: batch, expiration, stock status
   - Real-time quantity validation
   - Automatic price calculation based on markup
   - Line-level profit margins displayed
   - One-click "Recalculate" to update all prices

3. **Better Layout**
   - Clean card-based design
   - Collapsible order summary
   - Mobile-responsive
   - Visual status indicators
   - Helpful error messages

## How to Use

### Creating a New Order

1. Navigate to **Customer Orders** page
2. Click **"Create Order"** button
3. Fill in order information:
   - Select customer
   - Set delivery date
   - Adjust markup percentage (default 50%)
   - Add notes (optional)

4. Add products:
   - Click **"Add Product"** button
   - Browse or search for products
   - Notice the status badges:
     - 🟢 In stock (>5 units)
     - 🟡 Low stock (<5 units)
     - 🔴 Out of stock (0 units)
   - Check expiration warnings:
     - 🔴 Expires in ≤2 days
     - 🟡 Expires in ≤7 days
   - Click on a product card to add it

5. Configure each item:
   - Adjust quantity (shows available stock)
   - Modify unit price if needed
   - See profit margin calculated automatically
   - Remove items with trash icon

6. Review order summary:
   - Click "Show Details" to see cost breakdown
   - Total cost (production)
   - Markup amount
   - Total price (customer pays)

7. Click **"Create Order"** to save

### Editing an Existing Order

1. From Customer Orders list, click order row
2. Click **"Edit"** button
3. Modify as needed
4. Click **"Update Order"** to save

## Visual Indicators

### Product Cards (in selector)
- **Avatar**: Product initial or emoji
- **Green badge**: Available quantity
- **Yellow/Red chip**: Expiration warning
- **Gray chip**: Batch number
- **Cost info**: Production cost per unit

### Order Items
- **Batch chip**: Blue outlined chip
- **Expiration chip**: Color-coded by urgency
- **Low stock chip**: Yellow warning
- **Available quantity**: Shown below quantity input
- **Error alert**: Red banner if quantity exceeds stock

### Order Summary
- **Expandable**: Click "Show Details" / "Hide Details"
- **Total Cost**: What it costs to produce
- **Markup**: Profit amount and percentage
- **Total Price**: What customer pays

## Smart Features

### Automatic Price Calculation
- Prices auto-calculated from cost + markup%
- Change markup% and click "Recalculate" to update all items
- Or manually adjust individual item prices

### Real-time Validation
- ✅ Can't add same product twice
- ✅ Can't set quantity to 0 or negative
- ✅ Can't exceed available stock
- ✅ Must select customer
- ✅ Must set future delivery date
- ✅ Must add at least one item

### Stock Management
- Shows available quantity (total - reserved)
- Warns when stock is low
- Prevents ordering more than available
- Highlights items with stock issues

### Expiration Management
- Products sorted by expiration date
- Visual warnings for expiring products
- Helps reduce waste by using FIFO

## Keyboard Shortcuts

- **Escape**: Close product selector
- **Tab**: Navigate between fields
- **Enter**: Submit form (when all valid)

## Tips

1. **Use Search**: With many products, search is faster than scrolling
2. **Watch Expiration**: Red/yellow chips mean use those products first
3. **Check Stock**: Available quantity shown on each item
4. **Recalculate**: Changed markup%? Use recalculate button to update all prices
5. **Summary**: Click "Show Details" to verify costs and profit

## Troubleshooting

### "Product already added to order"
- You tried to add a product that's already in the order
- Edit the existing item's quantity instead

### "Quantity exceeds available stock"
- You entered more than what's available
- Red error banner shows available quantity
- Reduce quantity to match or less

### Can't find a product
- Check your search terms
- Product might already be added (check order items list)
- Product might be out of stock (check filter settings)

### Prices look wrong
- Check markup percentage
- Use "Recalculate" button to refresh all prices
- Or manually edit unit price per item

## Accessing the Form

### Routes:
- **New Order**: `http://localhost:3002/customer-orders/new`
- **Edit Order**: `http://localhost:3002/customer-orders/:id/edit`
- **Legacy Form** (old version): `http://localhost:3002/customer-orders-old/new`

### From Navigation:
1. Click "Customer Orders" in sidebar
2. Click "Create Order" button (top right)

## What's Different from Old Form?

| Feature | Old Form | New Form |
|---------|----------|----------|
| Product selection | Basic dropdown | Visual cards with context |
| Availability | Not shown | Color-coded badges |
| Expiration | Not shown | Warnings with days left |
| Batch numbers | Not shown | Displayed on all items |
| Stock validation | Manual | Real-time with errors |
| Price calculation | Manual | Automatic with recalculate |
| Profit visibility | Not shown | Line-level margins |
| Mobile support | Poor (table scrolling) | Responsive cards |
| Duplicate prevention | Manual | Automatic |
| Expiration sorting | None | Auto FIFO sorting |

## Next Features (Coming Soon)

- 🚀 Simplified action buttons in order list
- 🚀 Action menu instead of 5 buttons
- 🚀 Order templates for repeat customers
- 🚀 Bulk product selection
- 🚀 Customer-specific pricing rules
- 🚀 Print-friendly invoice preview

## Feedback Welcome!

Try the new form and let us know:
- What works well?
- What could be improved?
- Any bugs or issues?
- Missing features you need?
