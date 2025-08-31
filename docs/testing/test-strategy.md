# Test Strategy

## Pyramid

- Unit tests > Integration tests > API E2E

## Locations

- Backend API tests: /backend/*.js (existing Node scripts)
- Frontend tests: /frontend/src/**/*.test.tsx

## Required Coverage For New Features

- API: happy path + one error + one edge
- UI: render + interaction + loading/error states

## Running Tests

- Backend (example):
  - `cd backend && node run-all-tests.js`
  - `cd backend && node test-quality-status-enhanced.js`
- Frontend:
  - `cd frontend && npm run test`

## Data & DB

- Use seed data
- Avoid destructive operations in shared environments
- If needed, create isolated test routines

## CI-ready

- Provide deterministic tests
- Avoid network flakiness by checking /health before API tests
