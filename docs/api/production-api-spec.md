# Production API Specification

## 📋 Overview

This document specifies the REST API endpoints required for the production module, including request/response schemas, authentication requirements, and integration patterns.

## 🎯 API Design Principles

### RESTful Design

- **Resource-based URLs** following REST conventions
- **HTTP methods** for CRUD operations (GET, POST, PUT, DELETE)
- **Consistent status codes** and error handling
- **JSON payloads** for all requests and responses

### Performance Considerations

- **Pagination** for list endpoints
- **Field selection** to minimize data transfer
- **Caching headers** for frequently accessed data
- **Efficient queries** with minimal database hits

## 🔐 Authentication & Authorization

### Authentication Required

Currently using basic API without authentication, following existing project pattern. All production endpoints use the same authentication approach as existing APIs.

```typescript
// Headers pattern following existing API calls
const response = await fetch(`${API_BASE_URL}/production/runs`, {
  headers: {
    'Content-Type': 'application/json',
    // JWT authentication will be added when implemented project-wide
  },
  ...options,
});
```

### Response Format

Production APIs follow the same response format as existing project APIs:

```typescript
// Success Response (matches existing pattern)
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Error Response (matches existing pattern)  
interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string; // development only
}
```

## 🛠️ API Endpoints

### 1. Recipe Production Endpoints

#### GET /api/recipes/available-for-production

Get recipes available for production with ingredient availability check.

**Query Parameters:**

- `category?`: Filter by category ID
- `difficulty?`: Filter by difficulty (EASY, MEDIUM, HARD)  
- `limit?`: Limit results (default: 50)
- `offset?`: Pagination offset (default: 0)

**Response:**

```typescript
interface RecipeAvailabilityResponse {
  recipes: {
    id: string;
    name: string;
    emoji: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    estimatedTotalTime: number;
    yieldQuantity: number;
    yieldUnit: string;
    estimatedCostPerBatch: number;
    popularBatchSizes: number[];
    availability: {
      canMake: boolean;
      maxQuantity: number;
      missingIngredients: Array<{
        ingredientId: string;
        ingredientName: string;
        required: number;
        available: number;
        unit: string;
      }>;
      warningIngredients: Array<{
        ingredientId: string;
        ingredientName: string;
        required: number;
        available: number;
        unit: string;
        threshold: number;
      }>;
    };
    lastMadeDate?: string;
    averageRating?: number;
    popularityScore: number;
  }[];
  total: number;
  hasMore: boolean;
}
```

**Example:**

```bash
GET /api/recipes/available-for-production?difficulty=EASY&limit=10
```

#### GET /api/recipes/:recipeId/production-info

Get detailed production information for a specific recipe.

**Response:**

```typescript
interface RecipeProductionInfo {
  recipe: {
    id: string;
    name: string;
    emoji: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    description?: string;
    estimatedTotalTime: number;
    yieldQuantity: number;
    yieldUnit: string;
    estimatedCostPerBatch: number;
    estimatedCostPerUnit: number;
    suggestedSalePrice?: number;
    profitMargin?: number;
    minimumBatchSize: number;
    maximumBatchSize: number;
    popularBatchSizes: number[];
    equipmentRequired: string[];
    shelfLifeDays?: number;
    storageInstructions?: string;
    tags: string[];
  };
  steps: Array<{
    id: string;
    stepOrder: number;
    name: string;
    description?: string;
    estimatedMinutes: number;
    instructions?: string;
    temperatureF?: number;
    equipmentNeeded: string[];
    qualityCheckpoints: string[];
    safetyNotes?: string;
    isOptional: boolean;
  }>;
  ingredients: Array<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    available: number;
    cost?: number;
  }>;
  availability: {
    canMake: boolean;
    maxQuantity: number;
    estimatedCost: number;
  };
  recentProductions: Array<{
    id: string;
    batchNumber: string;
    targetQuantity: number;
    finalQuantity?: number;
    actualCost?: number;
    startedAt: string;
    completedAt?: string;
    status: string;
  }>;
}
```

### 2. Production Run Management

#### POST /api/production/runs

Create a new production run.

**Request Body:**

```typescript
interface CreateProductionRunRequest {
  recipeId: string;
  name: string;
  targetQuantity: number;
  targetUnit: string;
  notes?: string;
  scheduledStartTime?: string; // ISO 8601 datetime
}
```

**Response:**

```typescript
interface CreateProductionRunResponse {
  productionRun: {
    id: string;
    name: string;
    batchNumber: string;
    recipeId: string;
    recipeName: string;
    recipeEmoji: string;
    targetQuantity: number;
    targetUnit: string;
    status: 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
    currentStepIndex: number;
    startedAt: string;
    estimatedFinishAt: string;
    notes?: string;
  };
  steps: Array<{
    id: string;
    name: string;
    stepOrder: number;
    estimatedMinutes: number;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
    instructions?: string;
    temperatureF?: number;
    equipmentUsed: string[];
  }>;
  allocations: Array<{
    id: string;
    materialType: 'raw_material' | 'intermediate_product';
    materialId: string;
    materialName: string;
    quantityAllocated: number;
    unit: string;
  }>;
}
```

#### GET /api/production/runs

Get list of production runs with filtering and pagination.

**Query Parameters:**

- `status?`: Filter by status
- `recipeId?`: Filter by recipe
- `startDate?`: Filter by start date (ISO 8601)
- `endDate?`: Filter by end date (ISO 8601)
- `limit?`: Limit results (default: 20)
- `offset?`: Pagination offset (default: 0)
- `sort?`: Sort field (startedAt, completedAt, name)
- `order?`: Sort order (asc, desc)

**Response:**

```typescript
interface ProductionRunsResponse {
  runs: Array<{
    id: string;
    name: string;
    batchNumber: string;
    recipeId: string;
    recipeName: string;
    recipeEmoji: string;
    targetQuantity: number;
    targetUnit: string;
    finalQuantity?: number;
    status: string;
    currentStepIndex: number;
    totalSteps: number;
    progressPercentage: number;
    startedAt: string;
    completedAt?: string;
    estimatedFinishAt?: string;
    actualCost?: number;
    estimatedCost?: number;
  }>;
  total: number;
  hasMore: boolean;
}
```

#### GET /api/production/runs/:runId

Get detailed information about a specific production run.

**Response:**

```typescript
interface ProductionRunDetailResponse {
  run: {
    id: string;
    name: string;
    batchNumber: string;
    recipeId: string;
    recipeName: string;
    recipeEmoji: string;
    targetQuantity: number;
    targetUnit: string;
    finalQuantity?: number;
    status: string;
    currentStepIndex: number;
    startedAt: string;
    completedAt?: string;
    estimatedFinishAt?: string;
    actualCost?: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  };
  recipe: {
    id: string;
    name: string;
    difficulty: string;
    estimatedTotalTime: number;
    equipmentRequired: string[];
  };
  steps: Array<{
    id: string;
    name: string;
    description?: string;
    stepOrder: number;
    estimatedMinutes: number;
    actualMinutes?: number;
    status: string;
    startedAt?: string;
    completedAt?: string;
    instructions?: string;
    temperatureF?: number;
    equipmentUsed: string[];
    qualityCheckPassed?: boolean;
    notes?: string;
  }>;
  allocations: Array<{
    id: string;
    materialType: string;
    materialId: string;
    materialName: string;
    quantityAllocated: number;
    unit: string;
    allocatedAt: string;
  }>;
  timeline: Array<{
    timestamp: string;
    event: string;
    description: string;
    stepId?: string;
    stepName?: string;
  }>;
}
```

#### PUT /api/production/runs/:runId

Update production run status and basic information.

**Request Body:**

```typescript
interface UpdateProductionRunRequest {
  name?: string;
  status?: 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  finalQuantity?: number;
  actualCost?: number;
  notes?: string;
}
```

#### DELETE /api/production/runs/:runId

Cancel/delete a production run (only if status is not COMPLETED).

### 3. Production Step Management

#### PUT /api/production/runs/:runId/steps/:stepId

Update a production step.

**Request Body:**

```typescript
interface UpdateProductionStepRequest {
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  actualMinutes?: number;
  notes?: string;
  temperatureF?: number;
  equipmentUsed?: string[];
  qualityCheckPassed?: boolean;
}
```

**Response:**

```typescript
interface UpdateProductionStepResponse {
  step: {
    id: string;
    name: string;
    stepOrder: number;
    status: string;
    startedAt?: string;
    completedAt?: string;
    actualMinutes?: number;
    qualityCheckPassed?: boolean;
    notes?: string;
  };
  productionRun: {
    id: string;
    currentStepIndex: number;
    progressPercentage: number;
    estimatedFinishAt?: string;
    status: string;
  };
}
```

#### POST /api/production/runs/:runId/steps/:stepId/start

Start a production step (sets status to IN_PROGRESS, records start time).

#### POST /api/production/runs/:runId/steps/:stepId/complete

Complete a production step (sets status to COMPLETED, records completion time).

**Request Body:**

```typescript
interface CompleteStepRequest {
  actualMinutes?: number;
  notes?: string;
  qualityCheckPassed?: boolean;
  temperatureF?: number;
  equipmentUsed?: string[];
}
```

### 4. Production Templates Management

#### GET /api/production/templates/recipes/:recipeId/steps

Get production step templates for a recipe.

#### POST /api/production/templates/recipes/:recipeId/steps

Create new production step template.

**Request Body:**

```typescript
interface CreateStepTemplateRequest {
  name: string;
  stepOrder: number;
  description?: string;
  estimatedMinutes: number;
  instructions?: string;
  temperatureF?: number;
  equipmentNeeded?: string[];
  qualityCheckpoints?: string[];
  safetyNotes?: string;
  isOptional?: boolean;
}
```

#### PUT /api/production/templates/steps/:templateId

Update production step template.

#### DELETE /api/production/templates/steps/:templateId

Delete production step template.

### 5. Dashboard & Analytics

#### GET /api/production/dashboard

Get production dashboard data.

**Response:**

```typescript
interface ProductionDashboardResponse {
  statistics: {
    activeProductions: number;
    completedToday: number;
    averageCompletionTime: number;
    totalRevenue: number;
    efficiencyRate: number;
  };
  activeRuns: Array<{
    id: string;
    name: string;
    recipeName: string;
    recipeEmoji: string;
    progressPercentage: number;
    estimatedFinishAt: string;
    currentStep: string;
    status: string;
  }>;
  recentCompletions: Array<{
    id: string;
    name: string;
    recipeName: string;
    recipeEmoji: string;
    finalQuantity: number;
    targetQuantity: number;
    completedAt: string;
    actualCost: number;
  }>;
  upcomingScheduled: Array<{
    id: string;
    name: string;
    recipeName: string;
    scheduledStartTime: string;
    targetQuantity: number;
  }>;
}
```

#### GET /api/production/analytics/recipe/:recipeId

Get production analytics for a specific recipe.

**Query Parameters:**

- `period?`: Time period (7d, 30d, 90d, 1y)
- `startDate?`: Custom start date
- `endDate?`: Custom end date

**Response:**

```typescript
interface RecipeAnalyticsResponse {
  recipe: {
    id: string;
    name: string;
    emoji: string;
  };
  summary: {
    totalProductions: number;
    totalQuantityProduced: number;
    averageYield: number;
    averageCost: number;
    averageDuration: number;
    successRate: number;
  };
  trends: {
    productionVolume: Array<{ date: string; quantity: number }>;
    costPerUnit: Array<{ date: string; cost: number }>;
    duration: Array<{ date: string; minutes: number }>;
  };
  stepPerformance: Array<{
    stepName: string;
    averageDuration: number;
    estimatedDuration: number;
    efficiencyRate: number;
    qualityPassRate: number;
  }>;
}
```

## 🚨 Error Handling

### Standard Error Response Format

```typescript
interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | INVALID_REQUEST | Request validation failed |
| 401 | UNAUTHORIZED | Authentication required |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict (e.g., batch number exists) |
| 422 | INSUFFICIENT_INVENTORY | Not enough ingredients available |
| 500 | INTERNAL_ERROR | Server error |

### Production-Specific Errors

```typescript
// Insufficient inventory for production
{
  "error": {
    "code": "INSUFFICIENT_INVENTORY",
    "message": "Not enough ingredients available for production",
    "details": {
      "missingIngredients": [
        {
          "ingredientId": "ing_123",
          "ingredientName": "Flour",
          "required": 5.5,
          "available": 2.3,
          "unit": "kg"
        }
      ]
    }
  }
}

// Invalid production step transition
{
  "error": {
    "code": "INVALID_STEP_TRANSITION",
    "message": "Cannot complete step while previous step is not completed",
    "details": {
      "currentStep": 2,
      "attemptedStep": 4
    }
  }
}
```

## 🔄 Webhook Events

### Production Events

The system can emit webhook events for production state changes:

```typescript
// Production run started
{
  "event": "production.run.started",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "runId": "prod_123",
    "recipeName": "Chocolate Chip Cookies",
    "targetQuantity": 48,
    "estimatedFinishAt": "2024-01-15T12:30:00Z"
  }
}

// Production step completed
{
  "event": "production.step.completed",
  "timestamp": "2024-01-15T11:00:00Z",
  "data": {
    "runId": "prod_123",
    "stepId": "step_456",
    "stepName": "Mix ingredients",
    "actualDuration": 15,
    "qualityCheckPassed": true
  }
}

// Production run completed
{
  "event": "production.run.completed",
  "timestamp": "2024-01-15T12:25:00Z",
  "data": {
    "runId": "prod_123",
    "finalQuantity": 48,
    "actualCost": 12.50,
    "totalDuration": 115
  }
}
```

## 📝 API Usage Examples

### Starting a Production Run

```typescript
// 1. Check recipe availability
const availability = await fetch('/api/recipes/rec_123/production-info');
const recipeInfo = await availability.json();

if (!recipeInfo.availability.canMake) {
  console.error('Cannot make recipe:', recipeInfo.availability.missingIngredients);
  return;
}

// 2. Create production run
const productionRun = await fetch('/api/production/runs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipeId: 'rec_123',
    name: 'Morning Batch - Chocolate Chip Cookies',
    targetQuantity: 48,
    targetUnit: 'cookies'
  })
});

const runData = await productionRun.json();
console.log('Production started:', runData.productionRun.batchNumber);
```

### Tracking Production Progress

```typescript
// Real-time production tracking
const runId = 'prod_123';

// Complete current step
await fetch(`/api/production/runs/${runId}/steps/step_456/complete`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    actualMinutes: 15,
    qualityCheckPassed: true,
    notes: 'Perfect texture achieved'
  })
});

// Get updated production status
const status = await fetch(`/api/production/runs/${runId}`);
const runDetail = await status.json();

console.log(`Progress: ${runDetail.run.progressPercentage}%`);
console.log(`Current step: ${runDetail.steps[runDetail.run.currentStepIndex].name}`);
```

## 🧪 Testing Endpoints

### Unit Test Examples

```typescript
describe('Production API', () => {
  it('should create production run with valid data', async () => {
    const response = await request(app)
      .post('/api/production/runs')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        recipeId: 'rec_123',
        name: 'Test Batch',
        targetQuantity: 24,
        targetUnit: 'cookies'
      })
      .expect(201);

    expect(response.body.productionRun).toHaveProperty('id');
    expect(response.body.productionRun.status).toBe('IN_PROGRESS');
    expect(response.body.steps).toHaveLength(5);
  });

  it('should reject production run with insufficient inventory', async () => {
    const response = await request(app)
      .post('/api/production/runs')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        recipeId: 'rec_456', // Recipe requiring unavailable ingredients
        name: 'Test Batch',
        targetQuantity: 100,
        targetUnit: 'cakes'
      })
      .expect(422);

    expect(response.body.error.code).toBe('INSUFFICIENT_INVENTORY');
    expect(response.body.error.details.missingIngredients).toBeDefined();
  });
});
```

---

This API specification provides a complete foundation for implementing the production module backend, ensuring consistent data handling and user experience across the application.
