# Feature Scope: Finished Products Reservation Workflow


## Summary

Enable reserving and releasing quantities of finished products for pending orders. Supports partial and multiple reservations, prevents over-reservation, and keeps availability accurate across UI and API.


## Contract (Inputs/Outputs)

- Input (Reserve): `PUT /api/finished-products/:id/reserve`
  - Body: `{ "quantity": number, "reason?: string", "referenceId?: string }`

- Input (Release): `PUT /api/finished-products/:id/release`
  - Body: `{ "quantity": number, "reason?: string", "referenceId?: string }`

- Output (both):
  - 200 OK `{ success: true, data: FinishedProduct }`
  - Where `FinishedProduct` includes: `id, name, sku, batchNumber, quantity, reserved, available, productionDate, storageLocationId, expirationDate, qualityStatusId, createdAt, updatedAt`.


## Validation Rules

- `quantity` is required, numeric, `> 0`.
- For reserve: `quantity <= available` or error 409.
- For release: `quantity <= reserved` or error 409.
- `id` must exist (404 if not found).
- Optionals: `reason` max 255 chars; `referenceId` max 100 chars.


## Error Modes

- 400 BAD_REQUEST: invalid body (type/required/range errors)
- 404 NOT_FOUND: finished product not found
- 409 CONFLICT: insufficient available/reserved for requested operation
- 422 VALIDATION_ERROR: schema-level failures (if differentiated)
- 500 INTERNAL_ERROR: unhandled exceptions


## API Endpoints Affected

- `PUT /api/finished-products/:id/reserve` (exists in controller)
- `PUT /api/finished-products/:id/release` (exists in controller)
- `GET /api/finished-products` (ensure `available = quantity - reserved` included)


### Request/Response Examples

- Reserve Request:

```json
{
  "quantity": 3,
  "reason": "Order #12345",
  "referenceId": "ord_12345"
}
```

- Reserve Response 200:

```json
{
  "success": true,
  "data": {
    "id": "fp_abc",
    "name": "Chocolate Cake",
    "sku": "CAKE-CHOC-8",
    "batchNumber": "B20250830",
    "quantity": 10,
    "reserved": 3,
    "available": 7,
    "productionDate": "2025-08-30T00:00:00.000Z",
    "storageLocationId": "loc_1",
    "expirationDate": "2025-09-05T00:00:00.000Z",
    "qualityStatusId": "qs_ok",
    "createdAt": "2025-08-30T10:00:00.000Z",
    "updatedAt": "2025-08-31T10:05:00.000Z"
  }
}
```

- Reserve Response 409:

```json
{
  "success": false,
  "error": "Insufficient available quantity"
}
```


## Frontend Changes

- Components:
  - `frontend/src/pages/FinishedProducts.tsx`: add Reserve/Release actions per row, with a dialog to input `quantity` and optional `reason`.
  - `frontend/src/services/finishedProducts.ts`: implement `reserveFinishedProduct(id, quantity, reason?, referenceId?)` and `releaseFinishedProduct(...)` using real API.

- UI/UX:
  - Show `Reserved` and `Available` columns (available = quantity - reserved).
  - Disable Reserve when `available <= 0` and Release when `reserved <= 0`.
  - Inline success/error toasts; optimistic update optional but fallback to refetch on success.

- Validation (client):
  - Require positive `quantity` (number), max based on current available/reserved.


## Backend Changes (if needed)

- Ensure controller methods validate quantity and return 409 on insufficient amounts.
- Audit response shape to include `reserved` and `available`.
- Optional: persist reservation audit log with `reason` and `referenceId`.
- Update OpenAPI (`docs/openapi.yaml`) and API Reference (`docs/api-reference.md`).


## Tests

- API (backend):
  - Happy paths: reserve then release; exact boundaries (reserve=available, release=reserved).
  - Error cases: over-reserve (409), over-release (409), invalid quantity (400), not found (404).

- Frontend:
  - Dialog validation; buttons disabled logic; service calls made with correct payloads.


## Non-Goals

- Order management and automatic reservation linking
- Multi-warehouse logic or complex allocation strategies


## Done Definition

- Endpoints return validated, correct results with robust errors
- UI can reserve and release with clear feedback
- OpenAPI and docs updated; tests added and passing; progress documented
