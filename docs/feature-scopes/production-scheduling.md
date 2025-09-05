# Feature Scope: Production Scheduling and Workflow Management

## Summary

This feature enhances the bakery inventory application with production scheduling capabilities, allowing bakers to plan their production runs based on recipes and available inventory. The system will facilitate workflow management by tracking production stages and resource allocation.

## Goals

1. Enable users to schedule production runs with specific dates, times, and resources
2. Provide visibility into resource availability (ingredients, equipment, personnel)
3. Track production status through defined workflow stages
4. Generate intermediate and finished products automatically upon completion
5. Optimize production planning based on inventory levels

## Database Schema Changes

New tables required:

### 1. ProductionSchedules

```prisma
model ProductionSchedule {
  id                String               @id @default(uuid())
  name              String
  description       String?
  status            ProductionStatus     @default(PLANNED)
  startDate         DateTime
  endDate           DateTime?
  recipeId          String
  recipe            Recipe               @relation(fields: [recipeId], references: [id])
  outputQuantity    Float
  outputUnit        String
  notes             String?
  assignedTo        String?              // Optional assignment to personnel
  productionSteps   ProductionStep[]
  createdAt         DateTime             @default(now())
  updatedAt         DateTime             @updatedAt
}

enum ProductionStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  ON_HOLD
}
```

### 2. ProductionSteps

```prisma
model ProductionStep {
  id                  String           @id @default(uuid())
  productionScheduleId String
  productionSchedule   ProductionSchedule @relation(fields: [productionScheduleId], references: [id], onDelete: Cascade)
  name                String
  description         String?
  status              StepStatus       @default(PENDING)
  startTime           DateTime?
  endTime             DateTime?
  durationMinutes     Int?             // Expected duration
  actualDurationMinutes Int?           // Actual time taken
  ordinalPosition     Int              // Order in the production workflow
  notes               String?
  ingredientsMapped   Json?            // Specific ingredients assigned to this step
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
}

enum StepStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  SKIPPED
  FAILED
}
```

### 3. ResourceAllocations

```prisma
model ResourceAllocation {
  id                  String           @id @default(uuid())
  productionScheduleId String
  productionSchedule   ProductionSchedule @relation(fields: [productionScheduleId], references: [id], onDelete: Cascade)
  resourceType        ResourceType
  resourceId          String           // ID of the raw material, equipment, etc.
  quantityRequired    Float?
  unit                String?
  isConfirmed         Boolean          @default(false)
  notes               String?
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt
}

enum ResourceType {
  RAW_MATERIAL
  INTERMEDIATE_PRODUCT
  EQUIPMENT
  PERSONNEL
}
```

## API Endpoints

### Production Schedules

1. `GET /api/production-schedules`
   - Query params: `status`, `startDate`, `endDate`, `recipeId`
   - Returns list of production schedules with pagination

2. `GET /api/production-schedules/:id`
   - Returns detailed production schedule with steps and resource allocations

3. `POST /api/production-schedules`
   - Create new production schedule
   - Validates resource availability
   - Generates steps based on recipe

4. `PUT /api/production-schedules/:id`
   - Update production schedule details

5. `PUT /api/production-schedules/:id/status`
   - Update production status (PLANNED, IN_PROGRESS, etc.)
   - Triggers notifications and updates resource allocations

6. `DELETE /api/production-schedules/:id`
   - Soft delete (mark as cancelled) or hard delete if still in PLANNED state

### Production Steps

1. `PUT /api/production-steps/:id/status`
   - Update step status (PENDING, IN_PROGRESS, COMPLETED, etc.)
   - Records start/end times when appropriate
   - When last step is completed, marks production schedule as COMPLETED

2. `PUT /api/production-steps/:id`
   - Update step details
   - Record actual duration and notes

### Resource Allocation

1. `GET /api/resource-availability`
   - Query params: `date`, `resourceType`
   - Returns available resources for scheduling

2. `POST /api/production-schedules/:id/allocate-resources`
   - Allocate specific resources to a production schedule
   - Validates availability

3. `DELETE /api/production-schedules/:id/allocations/:allocationId`
   - Remove a resource allocation

## Frontend Changes

### New Components

1. **Production Calendar**
   - Monthly/weekly/daily views
   - Drag and drop scheduling
   - Color-coding by status
   - Filterable by recipe, status

2. **Production Detail View**
   - Timeline of production steps
   - Resource allocation visualization
   - Status update controls
   - Step completion tracking

3. **Resource Planning Dashboard**
   - Visualize resource utilization over time
   - Identify bottlenecks
   - Suggest optimal scheduling

4. **Schedule Creation Wizard**
   - Step 1: Select recipe
   - Step 2: Set quantity and dates
   - Step 3: Allocate resources
   - Step 4: Review and confirm

### UI Patterns

- Consistent timeline visualization for production steps
- Color-coded status indicators matching existing application patterns
- Modal dialogs for quick status updates
- Responsive design for all screens

## User Workflows

### Scheduling New Production

1. User selects "Create Production Schedule" from dashboard
2. User selects recipe from dropdown or search
3. System checks for available ingredients
4. User specifies output quantity and dates
5. System suggests resource allocations
6. User reviews and confirms schedule
7. System creates schedule and notifies relevant personnel

### Tracking Production

1. User views active production schedules
2. User selects specific schedule to view details
3. User updates step statuses as production progresses
4. System tracks actual vs. planned times
5. On completion, system generates intermediate/finished products

### Resource Management

1. User views resource allocation calendar
2. User identifies conflicts or availability
3. User adjusts schedules as needed
4. System validates changes against inventory

## Integration with Existing Features

- **Inventory Management**: Resources are allocated from inventory; completed productions add to inventory
- **Recipe System**: Production schedules are based on recipes and their ingredient requirements
- **Quality Control**: Links quality status tracking to production steps
- **Contamination Tracking**: Allows flagging of contamination issues during production

## Non-Goals for Initial Implementation

- Complex multi-location resource allocation
- Advanced optimization algorithms
- Integration with external scheduling systems
- Automated equipment control
- Advanced analytics beyond basic reporting

## Testing Strategy

### Backend Tests

- Unit tests for all new controllers
- Integration tests for the production scheduling workflow
- Performance tests for resource availability calculations
- API validation tests

### Frontend Tests

- Component tests for new UI elements
- Integration tests for production wizard flow
- End-to-end tests for critical scheduling workflows

## Definition of Done

- All endpoints implemented and tested
- Frontend components render correctly on all device sizes
- Database schema changes applied via migrations
- Documentation updated (API reference, OpenAPI schema)
- User guide created for production scheduling
- All tests pass with >90% coverage

## Migration Path

1. Schema updates via Prisma migration
2. Backend API implementation
3. Frontend component development
4. Integration testing
5. User acceptance testing
6. Documentation
7. Production deployment
