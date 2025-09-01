## Copilot instructions for this workspace

Context and architecture
- Monorepo with two workspaces: `frontend/` (React + TypeScript + MUI + Vite + React Query) and `backend/` (Express + TypeScript + Prisma + PostgreSQL).
- Backend REST base URL is `http://localhost:8000/api` (see `frontend/src/services/realApi.ts`). Always call real endpoints; do not use mocks.
- Data model is managed by Prisma (`backend/prisma/schema.prisma`); generated client is used in controllers under `backend/src/controllers/`.

Run/build/test (day‑to‑day)
- Dev servers: run from repo root
	- npm run dev → starts frontend (3002) and backend (8000)
- Database (dev):
	- cd backend && npx prisma db push && npx prisma generate
	- For seeds: cd backend && npx prisma db seed (schema uses `prisma/seed.ts`)
- Tests:
	- Backend API checks: cd backend && node run-all-tests.js (see test files in `backend/`)
	- Frontend: cd frontend && npm test

Project conventions (important!)
- Frontend data access goes through `frontend/src/services/realApi.ts`. Add new endpoints here and use React Query for caching/invalidation.
- Keep strict types. Update shared types in `frontend/src/types/` when backend models change.
- UI layout standard: wrap pages in `<Container maxWidth="xl" sx={{ mt: 4, mb: 4 }} />`. In Finished Products, contamination badge appears below the name; production status uses chips.
- Filters/search: prefer compact small-sized inputs; on mobile, use the bottom `Drawer` with a "Filters" button.

Backend patterns
- Validation with Joi in controllers; return 400 on invalid input. Keep error shapes consistent.
- Prisma relations must use nested writes (connect/disconnect). Do NOT write FK fields directly.
	- Example for an optional relation:
		- storageLocation: data.storageLocationId ? { connect: { id: data.storageLocationId } } : { disconnect: true }
- When adding fields/enums (e.g., `FinishedProductStatus`), update: schema.prisma → migrate/generate → controllers (validation + filter) → seeds → frontend types/UI → tests → docs/OpenAPI.

Cross‑component behaviors to mirror
- Finished Products search is client‑side and matches across: name, SKU, batch, unit, quantity, reserved, price, category name, storage location, quality status name, status text, and dates. Keywords: "contaminated"/"clean" map to the contamination flag.
- Status filters exist for Intermediate and Finished products; keep naming and enum mapping consistent (`FinishedProductStatus`).

Docs and API contract
- Any API or behavior change must update: `docs/api-reference.md`, `docs/openapi.yaml`, and `docs/development-progress.md` (and `docs/CHANGELOG.md` if notable). See `docs/ai-agent-playbook.md` for DoD.

Examples (quick recipes)
- Add a new relation field on a model:
	1) Edit `backend/prisma/schema.prisma`; run `prisma migrate dev` and `prisma generate`
	2) In controller: use nested connect/disconnect; extend Joi validation
	3) Update `realApi.ts`, frontend types, and the relevant page form + list
	4) Add/adjust a small API test in `backend/run-all-tests.js`; update docs and OpenAPI

References
- Backend controllers: `backend/src/controllers/*`
- Routes: `backend/src/routes/*`
- Prisma schema/seeds: `backend/prisma/*`
- Frontend pages: `frontend/src/pages/*` and services `frontend/src/services/realApi.ts`
- Standards: `docs/ai-agent-playbook.md`, `docs/ui-guidelines.md`, `docs/development-guidelines.md`
