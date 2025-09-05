# Production Scheduling API

## Overview

The Production Scheduling API allows you to create, manage, and track production schedules and workflows. It provides endpoints for scheduling production runs, allocating resources, and tracking production steps.

## Base URL

All endpoints are relative to: `/api`

## Authentication

All endpoints require authentication using the same mechanism as other API endpoints in the system.

## Endpoints

### Production Schedules

#### Get All Production Schedules

```
GET /production-schedules
```

Query Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD) |
| startDate | string | Filter by start date (ISO format) |
| endDate | string | Filter by end date (ISO format) |
| recipeId | string | Filter by recipe ID |
| page | number | Page number for pagination (default: 1) |
| limit | number | Items per page (default: 10) |

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "ps_123",
      "name": "Chocolate Cake Batch 12",
      "description": "Weekly chocolate cake production",
      "status": "PLANNED",
      "startDate": "2025-09-10T08:00:00.000Z",
      "endDate": "2025-09-10T12:00:00.000Z",
      "recipeId": "recipe_abc",
      "recipe": {
        "id": "recipe_abc",
        "name": "Chocolate Cake",
        "category": "Cakes"
      },
      "outputQuantity": 10,
      "outputUnit": "cakes",
      "assignedTo": "John Baker",
      "createdAt": "2025-09-05T10:00:00.000Z",
      "updatedAt": "2025-09-05T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "hasNext": true
  }
}
```

#### Get Production Schedule Detail

```
GET /production-schedules/:id
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "ps_123",
    "name": "Chocolate Cake Batch 12",
    "description": "Weekly chocolate cake production",
    "status": "PLANNED",
    "startDate": "2025-09-10T08:00:00.000Z",
    "endDate": "2025-09-10T12:00:00.000Z",
    "recipeId": "recipe_abc",
    "recipe": {
      "id": "recipe_abc",
      "name": "Chocolate Cake",
      "category": "Cakes",
      "ingredients": [
        {
          "name": "Flour",
          "quantity": 2,
          "unit": "kg"
        },
        {
          "name": "Sugar",
          "quantity": 1,
          "unit": "kg"
        }
      ]
    },
    "outputQuantity": 10,
    "outputUnit": "cakes",
    "notes": "Use organic ingredients",
    "assignedTo": "John Baker",
    "productionSteps": [
      {
        "id": "step_1",
        "name": "Prepare ingredients",
        "status": "PENDING",
        "ordinalPosition": 1,
        "durationMinutes": 15
      },
      {
        "id": "step_2",
        "name": "Mix dry ingredients",
        "status": "PENDING",
        "ordinalPosition": 2,
        "durationMinutes": 10
      }
    ],
    "resourceAllocations": [
      {
        "id": "alloc_1",
        "resourceType": "RAW_MATERIAL",
        "resourceId": "rm_flour",
        "resourceName": "All-purpose Flour",
        "quantityRequired": 2,
        "unit": "kg",
        "isConfirmed": true
      }
    ],
    "createdAt": "2025-09-05T10:00:00.000Z",
    "updatedAt": "2025-09-05T10:00:00.000Z"
  }
}
```

#### Create Production Schedule

```
POST /production-schedules
```

Request Body:

```json
{
  "name": "Chocolate Cake Batch 12",
  "description": "Weekly chocolate cake production",
  "startDate": "2025-09-10T08:00:00.000Z",
  "endDate": "2025-09-10T12:00:00.000Z",
  "recipeId": "recipe_abc",
  "outputQuantity": 10,
  "outputUnit": "cakes",
  "notes": "Use organic ingredients",
  "assignedTo": "John Baker",
  "initialSteps": [
    {
      "name": "Prepare ingredients",
      "durationMinutes": 15,
      "ordinalPosition": 1
    },
    {
      "name": "Mix dry ingredients",
      "durationMinutes": 10,
      "ordinalPosition": 2
    }
  ],
  "initialAllocations": [
    {
      "resourceType": "RAW_MATERIAL",
      "resourceId": "rm_flour",
      "quantityRequired": 2,
      "unit": "kg"
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "ps_123",
    "name": "Chocolate Cake Batch 12",
    "description": "Weekly chocolate cake production",
    "status": "PLANNED",
    "startDate": "2025-09-10T08:00:00.000Z",
    "endDate": "2025-09-10T12:00:00.000Z",
    "recipeId": "recipe_abc",
    "outputQuantity": 10,
    "outputUnit": "cakes",
    "notes": "Use organic ingredients",
    "assignedTo": "John Baker",
    "createdAt": "2025-09-05T10:00:00.000Z",
    "updatedAt": "2025-09-05T10:00:00.000Z"
  }
}
```

#### Update Production Schedule

```
PUT /production-schedules/:id
```

Request Body:

```json
{
  "name": "Updated Chocolate Cake Batch 12",
  "description": "Updated description",
  "endDate": "2025-09-10T14:00:00.000Z",
  "outputQuantity": 12
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "ps_123",
    "name": "Updated Chocolate Cake Batch 12",
    "description": "Updated description",
    "status": "PLANNED",
    "startDate": "2025-09-10T08:00:00.000Z",
    "endDate": "2025-09-10T14:00:00.000Z",
    "recipeId": "recipe_abc",
    "outputQuantity": 12,
    "outputUnit": "cakes",
    "notes": "Use organic ingredients",
    "assignedTo": "John Baker",
    "createdAt": "2025-09-05T10:00:00.000Z",
    "updatedAt": "2025-09-05T11:00:00.000Z"
  }
}
```

#### Update Production Schedule Status

```
PUT /production-schedules/:id/status
```

Request Body:

```json
{
  "status": "IN_PROGRESS"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "ps_123",
    "status": "IN_PROGRESS",
    "updatedAt": "2025-09-05T11:30:00.000Z"
  }
}
```

#### Delete Production Schedule

```
DELETE /production-schedules/:id
```

Response:

```json
{
  "success": true,
  "message": "Production schedule deleted successfully"
}
```

### Production Steps

#### Update Production Step

```
PUT /production-steps/:id
```

Request Body:

```json
{
  "name": "Updated step name",
  "description": "Updated description",
  "durationMinutes": 20
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "step_1",
    "name": "Updated step name",
    "description": "Updated description",
    "status": "PENDING",
    "durationMinutes": 20,
    "ordinalPosition": 1,
    "updatedAt": "2025-09-05T12:00:00.000Z"
  }
}
```

#### Update Production Step Status

```
PUT /production-steps/:id/status
```

Request Body:

```json
{
  "status": "IN_PROGRESS",
  "startTime": "2025-09-10T08:15:00.000Z"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "step_1",
    "status": "IN_PROGRESS",
    "startTime": "2025-09-10T08:15:00.000Z",
    "updatedAt": "2025-09-05T12:30:00.000Z"
  }
}
```

### Resource Allocation

#### Get Resource Availability

```
GET /resource-availability
```

Query Parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| date | string | Check availability for specific date (ISO format) |
| startDate | string | Start of date range (ISO format) |
| endDate | string | End of date range (ISO format) |
| resourceType | string | Filter by resource type (RAW_MATERIAL, INTERMEDIATE_PRODUCT, EQUIPMENT, PERSONNEL) |

Response:

```json
{
  "success": true,
  "data": [
    {
      "resourceType": "RAW_MATERIAL",
      "resourceId": "rm_flour",
      "resourceName": "All-purpose Flour",
      "availableQuantity": 25,
      "unit": "kg",
      "allocations": [
        {
          "productionScheduleId": "ps_123",
          "productionScheduleName": "Chocolate Cake Batch 12",
          "startDate": "2025-09-10T08:00:00.000Z",
          "endDate": "2025-09-10T12:00:00.000Z",
          "allocatedQuantity": 2
        }
      ]
    }
  ]
}
```

#### Allocate Resources

```
POST /production-schedules/:id/allocate-resources
```

Request Body:

```json
{
  "allocations": [
    {
      "resourceType": "RAW_MATERIAL",
      "resourceId": "rm_sugar",
      "quantityRequired": 1,
      "unit": "kg"
    },
    {
      "resourceType": "EQUIPMENT",
      "resourceId": "eq_mixer",
      "notes": "Use planetary mixer"
    }
  ]
}
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "alloc_2",
      "resourceType": "RAW_MATERIAL",
      "resourceId": "rm_sugar",
      "quantityRequired": 1,
      "unit": "kg",
      "isConfirmed": false,
      "createdAt": "2025-09-05T13:00:00.000Z",
      "updatedAt": "2025-09-05T13:00:00.000Z"
    },
    {
      "id": "alloc_3",
      "resourceType": "EQUIPMENT",
      "resourceId": "eq_mixer",
      "notes": "Use planetary mixer",
      "isConfirmed": false,
      "createdAt": "2025-09-05T13:00:00.000Z",
      "updatedAt": "2025-09-05T13:00:00.000Z"
    }
  ]
}
```

#### Delete Resource Allocation

```
DELETE /production-schedules/:id/allocations/:allocationId
```

Response:

```json
{
  "success": true,
  "message": "Resource allocation deleted successfully"
}
```

## Error Responses

All endpoints return standard error responses in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "details": {
    // Additional error details if available
  }
}
```

Common HTTP status codes:

- 400: Bad Request - Invalid input data
- 401: Unauthorized - Authentication required
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource not found
- 409: Conflict - Resource conflict (e.g., insufficient quantities)
- 500: Internal Server Error
