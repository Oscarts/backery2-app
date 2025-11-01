# Smart Raw Materials Form Enhancement

## Overview
The raw materials inventory form has been enhanced with intelligent defaults, auto-generation features, and autocomplete functionality to speed up data entry and reduce errors.

## Key Features

### 1. Smart Defaults (Auto-Filled)
When creating a new raw material, the following fields are automatically populated:

- **Category**: "Ingredients" (the default category for raw materials)
- **Storage Location**: First storage location alphabetically
- **Quality Status**: "Pending Review" (lowest sortOrder, typically the default)
- **Supplier**: First supplier alphabetically
- **Batch Number**: Auto-generated after you enter the expiration date (format: `SUPPLIER_CODE-YYYYMMDD-SEQ` based on expiration date)

Fields marked with a blue "Auto" or "Default" chip indicate they were pre-filled. You can edit them as needed.

### 2. Name Autocomplete with SKU Suggestion
- **Start typing** in the Name field to see existing materials with matching names
- **See existing SKUs** in the dropdown suggestions (e.g., "Flour (FLOUR)")
- **Select a suggestion** to automatically populate both name and SKU
- **Type a new name** and the SKU will be auto-generated from it

### 3. SKU Auto-Generation
- SKUs are automatically generated from product/material names
- **Format**: Uppercase, hyphen-separated (e.g., "Whole Wheat Flour" → "WHOLE-WHEAT-FLOUR")
- **Consistency**: Materials with the same name share the same SKU
- **Editable**: You can manually edit the SKU if needed
- **Validation**: The system prevents SKU conflicts for the same name

### 4. Batch Number Auto-Generation
- Format: `SUPPLIER_CODE-YYYYMMDD-SEQ`
- **Example**: `DAIR-20251215-001`
  - `DAIR` = Supplier code (first 4 chars of supplier name, uppercase, alphanumeric only)
  - `20251215` = **Expiration date** in YYYYMMDD format
  - `001` = Sequential number for that supplier/expiration date combination
  
- **Important**: Batch numbers are based on the **expiration date**, not the purchase date. This is ideal for tracking perishable items.
- **Automatic Sequencing**: If you add multiple batches from the same supplier with the same expiration date, the sequence number increments (001, 002, 003, etc.)
- **Editable**: You can override the auto-generated batch number if needed
- **Auto-Regeneration**: The batch number updates automatically when you:
  - Enter or change the expiration date
  - Change the supplier

### 5. Form Field Order
The form has been optimized for efficient data entry:
1. First, select the **supplier** (auto-filled by default)
2. Then, enter the **expiration date** 
3. The **batch number** is automatically generated based on these two fields

## API Endpoints

### GET /api/raw-materials/defaults
Returns default values for new raw materials.

**Response:**
```json
{
  "success": true,
  "data": {
    "storageLocationId": "cmhgqnx77000b8hj2kuq1a25p",
    "qualityStatusId": "clz005",
    "supplierId": "cmhgqnx76000a8hj2iqgec7sr",
    "categoryId": "cmhgqnx7000018hj2xnnv8248",
    "batchNumber": null
  }
}
```
**Note**: `batchNumber` is null because it requires the expiration date. Use the `/generate-batch-number` endpoint once the expiration date is known.

### GET /api/raw-materials/generate-batch-number?supplierId=xxx&expirationDate=YYYY-MM-DD
Generates a batch number based on supplier and expiration date.

**Response:**
```json
{
  "success": true,
  "data": {
    "batchNumber": "DAIR-20251215-001"
  }
}
```

### GET /api/raw-materials/sku-suggestions?name=flour
Returns SKU suggestions based on partial name match.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Whole Wheat Flour",
      "sku": "WHOLE-WHEAT-FLOUR"
    },
    {
      "name": "All-Purpose Flour",
      "sku": "ALL-PURPOSE-FLOUR"
    }
  ]
}
```

### GET /api/raw-materials/sku-mappings
Returns all name-to-SKU mappings across the system.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Artisan Sourdough Bread",
      "sku": "BRD-SD-001",
      "source": "finished_product"
    },
    {
      "name": "Whole Wheat Flour",
      "sku": "WHOLE-WHEAT-FLOUR",
      "source": "raw_material"
    },
    {
      "name": "Custom Product",
      "sku": "CUSTOM-001",
      "source": "mapping"
    }
  ]
}
```

## SKU Reference Page

A new page has been added at `/sku-reference` to view all SKU mappings in the system.

### Features:
- **Search**: Filter by name or SKU
- **Export**: Download all mappings as CSV
- **Source Tracking**: See where each SKU comes from
  - **Manual**: Created via SkuMapping table (editable)
  - **Finished Product**: Derived from existing finished products (read-only)
  - **Raw Material**: Derived from existing raw materials (read-only)
- **Refresh**: Reload data from the server

## Database Schema Changes

### New Table: SkuMapping
```prisma
model SkuMapping {
  id          String   @id @default(cuid())
  name        String   @unique
  sku         String   @unique
  description String?
  category    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
  @@index([sku])
  @@map("sku_mappings")
}
```

### RawMaterial Table Updates
- Added indexes on `name`, `sku`, `batchNumber`, `supplierId`, `expirationDate` for better query performance
- Updated `batchNumber` comment to document format: `SUPPLIER_CODE-YYYYMMDD-SEQ`
- Changed `reorderLevel` default to 0

## Implementation Details

### Backend Services

**skuService.ts** new functions:
- `getSuggestedSku(partialName)`: Returns autocomplete suggestions
- `getAllSkuMappings()`: Returns all mappings with source tracking
- `generateBatchNumber(supplierId, date)`: Generates batch numbers with auto-sequencing

### Frontend Components

**EnhancedRawMaterialForm.tsx**:
- Replaces the old embedded form in RawMaterials.tsx
- Material-UI Autocomplete for name field with SKU suggestions
- Real-time loading of defaults on form open
- Visual indicators (chips) for auto-filled fields
- Smart alert message explaining the feature

**SkuReference.tsx**:
- New page for viewing and managing SKU mappings
- Table with search, pagination, and export functionality
- Color-coded chips showing data source
- Placeholder for future edit functionality

## User Workflow Example

### Creating a New Raw Material:

1. **Click "Add Raw Material"**
   - Form opens with smart defaults already applied
   - Alert shows which fields are auto-filled
   - **Category** defaults to "Ingredients"
   - **Supplier**, **Storage Location**, and **Quality Status** pre-selected

2. **Start typing material name** (e.g., "flo...")
   - Autocomplete shows: "Flour (FLOUR)"
   - Select it or continue typing

3. **SKU auto-populates**
   - Shows: "FLOUR"
   - Blue "Auto" chip indicates it was generated
   - Can edit if needed

4. **Enter expiration date**
   - This is required before the batch number can be generated
   - Format: YYYY-MM-DD

5. **Batch number auto-generates**
   - Shows: "DAIR-20251215-001" (based on expiration date)
   - Blue "Auto" chip indicates generation
   - Updates automatically if you change supplier or expiration date

6. **Fill remaining required fields**
   - Purchase date, quantity, unit, cost per unit

7. **Submit**
   - New material created with consistent SKU
   - Batch number tracks expiration date for better perishable management
   - Future entries with same name will use same SKU

## Benefits

1. **Faster Data Entry**: Auto-filled fields reduce typing
2. **Consistency**: Same names always get same SKUs
3. **Error Reduction**: Auto-generation prevents typos
4. **Better Organization**: Structured batch numbering
5. **Easy Reference**: SKU reference page for lookups
6. **Perishable-Friendly**: Batch tracking per supplier and date

## Future Enhancements

- Edit functionality for manual SKU mappings
- Bulk import with automatic SKU assignment
- SKU pattern customization per category
- Batch number format templates
- Integration with barcode scanners
