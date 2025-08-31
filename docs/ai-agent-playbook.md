# AI Agent Playbook

Purpose: Provide strict guardrails so an AI can safely add or modify features without errors or regressions.

## Pre-flight Checks (run before any change)

1. Read docs in this order: README (root), docs/README.md, development-guidelines.md, technical-architecture.md, api-reference.md, ui-guidelines.md, env.md
2. Ensure environment is healthy:
   - Backend server expected at <http://localhost:8000> (health: `/health`)
   - Frontend expected at <http://localhost:3002>
   - Database reachable; Prisma migrations applied; seed data present
3. Verify tools:
   - TypeScript compiler reports no errors
   - ESLint shows no errors
   - Minimal API test script runs without fatal failures

## Safe Edit Protocol

- Minimize diff: touch only files required for the feature
- Keep types strict; avoid any
- Preserve public APIs; if you must change one, update all usages and docs
- Always add or update tests alongside code changes
- Update documentation in the same commit (API, UI patterns, progress log)

## Definition of Done (DoD)

- Build, typecheck, lint: PASS
- Unit/integration tests for new behavior: ADDED and PASS
- API endpoints (if any) documented (api-reference + openapi.yaml)
- UI behavior matches UI guidelines; accessibility considered
- Database schema changes include migration + idempotent seed updates
- docs/development-progress.md updated with date, scope, files, tests

## Change Flow (step-by-step)

1. Clarify scope: inputs, outputs, invariants, error modes
2. Write/extend tests first (back and/or front)
3. Implement code with strict types; follow existing patterns
4. Run:
   - Backend API quick tests
   - Frontend tests (if applicable)
   - Manual smoke (create/edit/list flows)
5. Update docs: API, UI, progress log, changelog (if notable)
6. Produce concise commit message with bullets of changes and tests

## Error Handling & Logging

- Never leak stack traces to users; use friendly messages
- Return proper HTTP status codes; keep consistent error shape
- Log at appropriate levels (info/warn/error); no secrets in logs

## Security & Config

- No secrets committed; use .env (see env.md)
- Validate inputs server-side; sanitize outputs for UI
- Respect CORS and auth (when enabled)

## Testing Guidance

- API: test happy path + one error + one edge case
- UI: render, interaction, loading/error states
- Don’t mock the real API for production code; use realApi.ts
- Before marking done: run all modified tests and a small end-to-end smoke

## When Unsure

- Read the closest similar feature and mirror its approach
- Prefer small, incremental PRs with tests
- If ambiguity remains, add a short ADR in docs/decisions/ and proceed conservatively
