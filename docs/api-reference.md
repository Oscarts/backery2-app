# API Reference

## 🔗 Base URL

**Development:** `http://localhost:8000/api`
**Production:** TBD

> Machine-readable spec: see `docs/openapi.yaml` for a canonical, up-to-date contract.

# API Reference

## � Base URL

**Development:** `http://localhost:8000/api`
**Production:** TBD

> Machine-readable spec: see `docs/openapi.yaml` for a canonical, up-to-date contract.

## 🔧 Authentication

The system includes JWT-based authentication with role-based access control:

- **JWT Tokens:** Secure authentication using jsonwebtoken 9.0.2
- **Password Security:** bcryptjs 2.4.3 for secure password hashing
- **Role-based Access:** User roles (ADMIN, STAFF) control feature access
- **Security Headers:** Helmet middleware for enhanced security

### Authentication Endpoints

```typescript
POST /auth/login
POST /auth/register
POST /auth/logout
GET /auth/profile
```

## 📋 Common Response Format

### Success Response

```json
{
  "success": true,
  "data": {"...": "..."},
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

Check if the API server is running and database connectivity.

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2025-09-10T12:00:00.000Z",
  "database": "connected",
  "environment": "development"
}
```

## 🥬 Raw Materials API

### GET /raw-materials

Get all raw materials with optional filtering and pagination.

**Query Parameters:**

- `categoryId` (optional): Filter by category
- `supplierId` (optional): Filter by supplier
- `contaminated` (optional): Filter by contamination status

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

**Query Parameters:**

- `page`, `limit`, `search`, `categoryId`, `expiringSoon`, `lowStock`, `minStock`
- `status` (IN_PRODUCTION | COMPLETED | ON_HOLD | DISCARDED)

### POST /finished-products

Create a new finished product.

**Request Body:**

```json
{
  "name": "Artisan Bread",
  "sku": "BRD-001",
  "categoryId": "cat_123",
  "batchNumber": "B001",
  "productionDate": "2025-08-30T00:00:00.000Z",
  "expirationDate": "2025-09-05T00:00:00.000Z",
  "shelfLife": 6,
  "quantity": 30,
  "unit": "pcs",
  "salePrice": 6.99,
  "costToProduce": 2.5,
  "storageLocationId": "loc_123",
  "qualityStatusId": "qs_123",
  "isContaminated": false,
  "status": "IN_PRODUCTION"
}
```

### PUT /finished-products/:id

Update an existing finished product.

**Request Body (partial):**

```json
{
  "quantity": 25,
  "status": "COMPLETED"
}
```

### DELETE /finished-products/:id

Delete a finished product.

### PUT /finished-products/:id/reserve (Deprecated)

Deprecated: Reservation functionality is being removed from the system. This endpoint will be removed in a future release.

Body:

```json
{ "quantity": 3, "reason": "Order #12345", "referenceId": "ord_12345" }
```

Responses:

- 200: Updated product with `reserved` and `available`
- 400: Invalid quantity
- 404: Product not found
- 409: Insufficient available quantity

### PUT /finished-products/:id/release (Deprecated)

Deprecated: Reservation functionality is being removed from the system. This endpoint will be removed in a future release.

Body:

```json
{ "quantity": 2, "reason": "Order canceled", "referenceId": "ord_12345" }
```

Responses:

- 200: Updated product
- 400: Invalid quantity
- 404: Product not found
- 409: Insufficient reserved quantity

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
          "finishedProductId": "fp_001",
          "finishedProduct": { "name": "Chocolate Base" },
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
    },
    {
      "finishedProductId": "fp_001",
      "quantity": 1.0,
      "unitId": "unit_piece",
      "notes": "Use pre-made chocolate base"
    }
  ]
}
```

### GET /recipes/what-can-i-make

Get recipes that can be made with current inventory, including expiration date validation.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "recipe": { 
        "id": "rec_123",
        "name": "Chocolate Cake",
        "emoji": "🍰",
        "difficulty": "medium"
      },
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
      ],
      "expiredIngredients": [
        {
          "ingredient": "Milk",
          "expirationDate": "2025-09-07T00:00:00.000Z",
          "daysExpired": 1
        }
      ],
      "contaminatedIngredients": [
        {
          "ingredient": "Eggs",
          "contaminationReason": "Cross-contamination detected"
        }
      ],
      "shortage": "Some ingredients are expired or contaminated"
    }
  ]
}
```

## 🏭 Production APIs

### Production Runs

#### POST /production/runs

Create a new production run with optional custom steps.

**Request Body:**

```json
{
  "name": "Chocolate Cake Production",
  "recipeId": "rec_123",
  "targetQuantity": 12,
  "targetUnit": "pieces",
  "notes": "Production run notes",
  "customSteps": [
    {
      "name": "Custom Prep",
      "description": "Custom preparation step",
      "stepOrder": 1,
      "estimatedMinutes": 20
    },
    {
      "name": "Baking",
      "description": "Bake the cake",
      "stepOrder": 2,
      "estimatedMinutes": 45
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "prod_123",
    "name": "Chocolate Cake Production",
    "recipeId": "rec_123",
    "targetQuantity": 12,
    "targetUnit": "pieces",
    "status": "PLANNED",
    "steps": [
      {
        "id": "step_1",
        "name": "Custom Prep",
        "description": "Custom preparation step",
        "stepOrder": 1,
        "estimatedMinutes": 20,
        "status": "PENDING"
      },
      {
        "id": "step_2",
        "name": "Baking",
        "description": "Bake the cake",
        "stepOrder": 2,
        "estimatedMinutes": 45,
        "status": "PENDING"
      }
    ]
  }
}
```

**Notes:**

- If `customSteps` is not provided or is empty, default steps will be created automatically
- Custom steps must have unique `stepOrder` values
- All steps start with `status: "PENDING"`

#### GET /production/runs/stats

Get production statistics for the dashboard.

**Response:**

```json
{
  "success": true,
  "data": {
    "active": 5,
    "onHold": 2,
    "planned": 8,
    "completedToday": 3,
    "totalTargetQuantity": 150
  }
}
```

#### PUT /production/runs/:id

Update a production run.

**Request Body:**

```json
{
  "name": "Updated Production Name",
  "targetQuantity": 15,
  "targetUnit": "pieces", 
  "status": "COMPLETED",
  "notes": "Production manually completed by user"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "prod_123",
    "name": "Updated Production Name",
    "status": "COMPLETED",
    "completedAt": "2025-09-10T15:00:00Z",
    "productionCompleted": true,
    "finishedProduct": {
      "id": "fp_456",
      "name": "Chocolate Cake (BATCH-1725984000000)",
      "sku": "CHOCOLATE-CAKE-BATCH-1725984000000", 
      "quantity": 15,
      "unit": "pieces",
      "batchNumber": "BATCH-1725984000000",
      "costToProduce": 12.50,
      "salePrice": 10.0,
      "status": "COMPLETED"
    }
  },
  "message": "Production run completed successfully"
}
```

**Notes:**

- When `status` is changed to `"COMPLETED"`, the system automatically calls the `ProductionCompletionService`
- This creates finished products in inventory with proper cost calculation and batch tracking
- The `finishedProduct` field in the response contains details of the created inventory item
- The `productionCompleted` flag indicates whether this update resulted in production completion

#### GET /production/runs/completed

Get completed production runs for history view with pagination.

**Query Parameters:**

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of runs per page (default: 10)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "name": "Chocolate Cake Production",
      "recipeId": "rec_123",
      "targetQuantity": 12,
      "actualQuantity": 12,
      "status": "COMPLETED",
      "completedAt": "2025-09-10T14:30:00Z",
      "startedAt": "2025-09-10T12:00:00Z",
      "totalDurationMinutes": 150
    }
  ]
}
```

#### DELETE /production/runs/:id

Delete a production run and all its associated steps.

**Response:**

```json
{
  "success": true,
  "message": "Production run deleted successfully"
}
```

### Material Tracking

The material tracking APIs provide comprehensive traceability for raw materials used in production runs, including quantities, costs, SKUs, and batch numbers.

#### POST /production/runs/:productionRunId/materials/allocate

Allocate materials for a production run based on recipe requirements. This must be done before starting production to ensure all required materials are reserved.

**Request Body:**

```json
{
  "productionMultiplier": 2.5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "productionRunId": "prod_123",
    "allocations": [
      {
        "materialType": "RAW_MATERIAL",
        "materialId": "rm_456",
        "materialName": "All-Purpose Flour",
        "materialSku": "FLR-001",
        "materialBatchNumber": "BATCH-2025-001",
        "quantityNeeded": 5.0,
        "quantityAllocated": 5.0,
        "unit": "kg",
        "unitCost": 2.50,
        "totalCost": 12.50
      }
    ]
  },
  "message": "Successfully allocated 1 materials for production"
}
```

#### GET /production/runs/:productionRunId/materials

Retrieve detailed material usage information for a production run, including cost breakdown and consumption details.

**Response:**

```json
{
  "success": true,
  "data": {
    "productionRunId": "prod_123",
    "materials": [
      {
        "id": "alloc_789",
        "materialType": "RAW_MATERIAL",
        "materialName": "All-Purpose Flour",
        "materialSku": "FLR-001",
        "materialBatchNumber": "BATCH-2025-001",
        "quantityAllocated": 5.0,
        "quantityConsumed": 4.8,
        "unit": "kg",
        "unitCost": 2.50,
        "totalCost": 12.00,
        "status": "CONSUMED",
        "notes": "Minor waste during mixing",
        "consumedAt": "2025-09-10T10:15:00Z"
      }
    ],
    "costBreakdown": {
      "materialCost": 12.00,
      "totalCost": 14.40,
      "materials": ["..."]
    }
  },
  "message": "Material usage retrieved successfully"
}
```

#### POST /production/runs/:productionRunId/materials/consume

Record actual material consumption during production steps. This allows tracking of waste, variations from planned usage, and exact material traceability.

**Request Body:**

```json
{
  "consumptions": [
    {
      "allocationId": "alloc_789",
      "quantityConsumed": 4.8,
      "notes": "Minor waste during mixing process"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "productionRunId": "prod_123",
    "materials": ["...updated materials list..."],
    "costBreakdown": {
      "materialCost": 12.00,
      "totalCost": 14.40
    }
  },
  "message": "Successfully recorded consumption for 1 materials"
}
```

#### GET /production/finished-products/:finishedProductId/materials

Get comprehensive material breakdown and traceability for a finished product, showing exactly which raw materials were used, their quantities, costs, and batch numbers.

**Response:**

```json
{
  "success": true,
  "data": {
    "productionRunId": "prod-123",
    "productId": "product-456",
    "productName": "Chocolate Croissant",
    "productBatchNumber": "BATCH-001",
    "totalCost": 5.25,
    "materialAllocations": [
      {
        "id": "alloc-1",
        "productionRunId": "prod-123",
        "materialId": "mat-flour",
        "materialSku": "FLOUR-001",
        "materialBatchNumber": "FLOUR-BATCH-001",
        "allocatedQuantity": 500,
        "consumedQuantity": 475,
        "wasteQuantity": 25,
        "unitCost": 0.004,
        "totalCost": 2.00,
        "unit": "g",
        "createdAt": "2025-09-18T10:00:00Z",
        "updatedAt": "2025-09-18T10:30:00Z",
        "material": {
          "id": "mat-flour",
          "name": "All-Purpose Flour",
          "sku": "FLOUR-001",
          "description": "Premium white flour",
          "category": {
            "id": "cat-1",
            "name": "Flour & Grains"
          }
        }
      },
      {
        "id": "alloc-2",
        "productionRunId": "prod-123",
        "materialId": "mat-butter",
        "materialSku": "BUTTER-001",
        "materialBatchNumber": "BUTTER-BATCH-002",
        "allocatedQuantity": 200,
        "consumedQuantity": 190,
        "wasteQuantity": 10,
        "unitCost": 0.012,
        "totalCost": 2.40,
        "unit": "g",
        "createdAt": "2025-09-18T10:00:00Z",
        "updatedAt": "2025-09-18T10:30:00Z",
        "material": {
          "id": "mat-butter",
          "name": "Organic Butter",
          "sku": "BUTTER-001",
          "description": "Premium organic butter",
          "category": {
            "id": "cat-2",
            "name": "Dairy Products"
          }
        }
      }
    ],
    "summary": {
      "totalMaterialCost": 4.40,
      "totalWasteQuantity": 35,
      "totalConsumedQuantity": 665,
      "wastePercentage": 5.0
    }
  },
  "message": "Material breakdown retrieved successfully"
}
```

**Key Features:**

- **Complete Material Traceability**: Track every raw material used with batch numbers and SKUs
- **Waste Tracking**: Detailed tracking of allocated vs consumed quantities with waste calculation
- **Cost Breakdown**: Real-time cost calculation based on actual material consumption and unit costs
- **Batch Traceability**: Full batch number tracking for quality control and recalls
- **Category Integration**: Material categories for better organization and reporting
- **Production Integration**: Links materials directly to production runs and finished products

### Production Step Templates

#### GET /production/step-templates/default

Get default production step templates.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "prep",
      "name": "Preparation",
      "description": "Gather and prepare all ingredients",
      "estimatedMinutes": 15,
      "order": 1,
      "isRequired": true
    },
    {
      "id": "production",
      "name": "Production",
      "description": "Mix, bake, or process according to recipe",
      "estimatedMinutes": 60,
      "order": 2,
      "isRequired": true
    },
    {
      "id": "quality",
      "name": "Quality Check",
      "description": "Inspect product quality and standards",
      "estimatedMinutes": 10,
      "order": 3,
      "isRequired": true
    },
    {
      "id": "packaging",
      "name": "Packaging",
      "description": "Package finished products for inventory",
      "estimatedMinutes": 15,
      "order": 4,
      "isRequired": true
    }
  ]
}
```

#### GET /production/step-templates/recipe/:recipeId

Get production step templates for a specific recipe.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "custom-1",
      "name": "Dough Preparation",
      "description": "Prepare dough with specific technique",
      "estimatedMinutes": 20,
      "order": 1,
      "isRequired": true,
      "recipeId": "rec_123"
    }
  ]
}
```

#### POST /production/step-templates/recipe/:recipeId

Create a custom production step template for a recipe.

**Request Body:**

```json
{
  "name": "Custom Step Name",
  "description": "Step description",
  "estimatedMinutes": 30,
  "order": 2,
  "isRequired": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "custom-new",
    "name": "Custom Step Name",
    "description": "Step description",
    "estimatedMinutes": 30,
    "order": 2,
    "isRequired": false,
    "recipeId": "rec_123"
  }
}
```

### Production Steps

#### PUT /production/steps/:id/complete

Complete a production step with optional custom expiration date.

**Request Body:**

```json
{
  "qualityNotes": "Product meets all quality standards",
  "qualityStatus": "PASS",
  "actualQuantity": 12,
  "expirationDate": "2025-09-15T00:00:00.000Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "step_123",
    "status": "COMPLETED",
    "completedAt": "2025-09-08T10:30:00.000Z",
    "qualityStatus": "PASS",
    "actualQuantity": 12,
    "expirationDate": "2025-09-15T00:00:00.000Z",
    "finishedProduct": {
      "id": "fp_456",
      "name": "Chocolate Cake",
      "expirationDate": "2025-09-15T00:00:00.000Z"
    }
  }
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
