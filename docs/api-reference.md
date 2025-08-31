# API Reference

## 🔗 Base URL

**Development:** `http://localhost:8000/api`
**Production:** TBD

> Machine-readable spec: see `docs/openapi.yaml` for a canonical, up-to-date contract.

## 🔧 Authentication

Currently using basic API without authentication. JWT authentication planned for future releases.

## 📋 Common Response Format

### Success Response

```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (development only)"
}
```

## 🏥 Health Check

### GET /health

Check if the API server is running.

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2025-08-31T10:00:00.000Z",
  "database": "connected"
}
```

## 🥬 Raw Materials API

### GET /raw-materials

Get all raw materials with optional filtering and pagination.

**Query Parameters:**

- `categoryId` (optional): Filter by category
- `supplierId` (optional): Filter by supplier
- `contaminated` (optional): Filter by contamination status

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "rm_123",
      "name": "Flour",
      "description": "All-purpose flour",
      "sku": "FLR-001",
      "categoryId": "cat_123",
      "category": { "name": "Dry Goods" },
      "supplierId": "sup_123",
      "supplier": { "name": "Local Supplier" },
      "unitId": "unit_kg",
      "unit": { "name": "Kilogram", "symbol": "kg" },
      "currentStock": 50.5,
      "minimumStock": 10.0,
      "maximumStock": 100.0,
      "costPerUnit": 2.50,
      "qualityStatus": "Good",
      "expirationDate": "2025-12-31T00:00:00.000Z",
      "storageLocationId": "loc_123",
      "storageLocation": { "name": "Dry Storage" },
      "isContaminated": false,
      "contaminationReason": null,
      "batchNumber": "B2025001",
      "createdAt": "2025-08-01T10:00:00.000Z",
      "updatedAt": "2025-08-31T10:00:00.000Z"
    }
  ]
}
```

### POST /raw-materials

Create a new raw material.

**Request Body:**

```json
{
  "name": "Sugar",
  "description": "White granulated sugar",
  "sku": "SGR-001",
  "categoryId": "cat_123",
  "supplierId": "sup_456",
  "unitId": "unit_kg",
  "currentStock": 25.0,
  "minimumStock": 5.0,
  "maximumStock": 50.0,
  "costPerUnit": 1.20,
  "qualityStatus": "Good",
  "expirationDate": "2026-06-30T00:00:00.000Z",
  "storageLocationId": "loc_123",
  "batchNumber": "B2025002"
}
```

### PUT /raw-materials/:id

Update an existing raw material.

### DELETE /raw-materials/:id

Delete a raw material.

## 🔄 Intermediate Products API

### GET /intermediate-products

Get all intermediate products.

**Response:** Similar structure to raw materials with additional fields:

```json
{
  "productionDate": "2025-08-30T00:00:00.000Z",
  "recipeId": "rec_123",
  "recipe": { "name": "Chocolate Ganache" }
}
```

### POST /intermediate-products

Create a new intermediate product.

### PUT /intermediate-products/:id

Update an existing intermediate product.

### DELETE /intermediate-products/:id

Delete an intermediate product.

## 🍰 Finished Products API

### GET /finished-products

Get all finished products.

**Response:** Similar structure to other products with additional fields:

```json
{
  "sellingPrice": 15.99,
  "reserved": 2.0,
  "available": 8.0,
  "productionDate": "2025-08-30T00:00:00.000Z",
  "recipeId": "rec_456"
}
```

### POST /finished-products

Create a new finished product.

### PUT /finished-products/:id

Update an existing finished product.

### DELETE /finished-products/:id

Delete a finished product.

## 📖 Recipes API

### GET /recipes

Get all recipes with ingredients.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "rec_123",
      "name": "Chocolate Chip Cookies",
      "description": "Classic chocolate chip cookies",
      "categoryId": "cat_456",
      "category": { "name": "Baked Goods" },
      "instructions": "1. Mix dry ingredients...",
      "prepTime": 15,
      "cookTime": 12,
      "servings": 24,
      "costPerServing": 0.85,
      "ingredients": [
        {
          "id": "ing_123",
          "rawMaterialId": "rm_flour",
          "rawMaterial": { "name": "Flour" },
          "quantity": 2.5,
          "unitId": "unit_cup",
          "unit": { "name": "Cup", "symbol": "cup" },
          "notes": "Sifted"
        }
      ],
      "createdAt": "2025-08-01T10:00:00.000Z",
      "updatedAt": "2025-08-31T10:00:00.000Z"
    }
  ]
}
```

### POST /recipes

Create a new recipe.

**Request Body:**

```json
{
  "name": "Vanilla Cake",
  "description": "Moist vanilla sponge cake",
  "categoryId": "cat_456",
  "instructions": "1. Cream butter and sugar...",
  "prepTime": 20,
  "cookTime": 25,
  "servings": 8,
  "ingredients": [
    {
      "rawMaterialId": "rm_flour",
      "quantity": 2.0,
      "unitId": "unit_cup",
      "notes": "Cake flour preferred"
    }
  ]
}
```

### GET /recipes/what-can-i-make

Get recipes that can be made with current inventory.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "recipe": { /* recipe object */ },
      "canMake": true,
      "maxServings": 5,
      "missingIngredients": [],
      "insufficientIngredients": [
        {
          "ingredient": "Flour",
          "needed": 5.0,
          "available": 3.0,
          "shortage": 2.0
        }
      ]
    }
  ]
}
```

## ⚙️ Settings APIs

### Categories API

#### GET /categories

Get all categories with optional type filtering.

**Query Parameters:**

- `type` (optional): Filter by type (raw_material, intermediate_product, finished_product, recipe)

#### POST /categories

Create a new category.

### Suppliers API

#### GET /suppliers

Get all suppliers.

#### POST /suppliers

Create a new supplier.

### Storage Locations API

#### GET /storage-locations

Get all storage locations.

#### POST /storage-locations

Create a new storage location.

### Units API

#### GET /units

Get all units with optional category filtering.

**Query Parameters:**

- `category` (optional): Filter by category (weight, volume, count)

#### POST /units

Create a new unit.

### Quality Statuses API

#### GET /quality-statuses

Get all quality statuses.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "qs_123",
      "name": "Excellent",
      "description": "Perfect quality",
      "color": "#4caf50",
      "isActive": true,
      "createdAt": "2025-08-01T10:00:00.000Z",
      "updatedAt": "2025-08-31T10:00:00.000Z"
    }
  ]
}
```

#### POST /quality-statuses

Create a new quality status.

#### PUT /quality-statuses/:id

Update an existing quality status.

#### DELETE /quality-statuses/:id

Delete a quality status.

## 📊 Dashboard API

### GET /dashboard/metrics

Get dashboard overview metrics.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalRawMaterials": 45,
    "totalIntermediateProducts": 12,
    "totalFinishedProducts": 23,
    "totalRecipes": 18,
    "lowStockItems": [
      {
        "type": "raw_material",
        "name": "Flour",
        "currentStock": 2.5,
        "minimumStock": 10.0
      }
    ],
    "expiringItems": [
      {
        "type": "finished_product",
        "name": "Chocolate Cake",
        "expirationDate": "2025-09-05T00:00:00.000Z",
        "daysUntilExpiry": 5
      }
    ],
    "contaminatedItems": [
      {
        "type": "raw_material",
        "name": "Milk",
        "contaminationReason": "Temperature abuse"
      }
    ],
    "inventoryValue": {
      "rawMaterials": 1250.50,
      "intermediateProducts": 850.75,
      "finishedProducts": 2100.25,
      "total": 4201.50
    }
  }
}
```

## 🚨 Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | BAD_REQUEST | Invalid request data |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Duplicate resource (e.g., SKU already exists) |
| 422 | VALIDATION_ERROR | Request data failed validation |
| 500 | INTERNAL_ERROR | Server error |

## 🔧 Testing the API

### Health Check Test

```bash
curl -X GET http://localhost:8000/health
```

### Get Raw Materials Test

```bash
curl -X GET http://localhost:8000/api/raw-materials
```

### Create Raw Material Test

```bash
curl -X POST http://localhost:8000/api/raw-materials \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Material",
    "sku": "TEST-001",
    "categoryId": "cat_123",
    "currentStock": 10.0,
    "minimumStock": 5.0,
    "costPerUnit": 1.50
  }'
```

## 📝 Data Validation Rules

### Common Validations

- All IDs must be valid UUIDs or reference existing records
- Stock values must be non-negative decimals
- Dates must be valid ISO 8601 format
- SKUs must be unique across their entity type

### Specific Validations

- **Raw Materials:** Must have supplier and category
- **Recipes:** Must have at least one ingredient
- **Finished Products:** Selling price must be greater than cost per unit
- **Quality Statuses:** Color must be valid hex code if provided

## 🔄 Pagination

For endpoints returning large datasets, pagination is available:

**Query Parameters:**

- `page` (default: 1): Page number
- `limit` (default: 50): Items per page
- `sortBy` (optional): Field to sort by
- `sortOrder` (default: asc): Sort direction (asc/desc)

**Response:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 156,
    "totalPages": 4,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

This API reference provides all the endpoints and data structures needed for frontend development and testing.
