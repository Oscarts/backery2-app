# Environment & Configuration

## Required Environment Variables

Create a `.env` file in `backend/` with:

```dotenv
# Server
PORT=8000
CORS_ORIGIN=http://localhost:3002

# Database
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/bakery

# Node
NODE_ENV=development
```

Notes:

- Use distinct databases per environment (development/test)
- Never commit real secrets
- Keep ports consistent with docs and scripts

## Health Checks

- API Health: <http://localhost:8000/health>
- Frontend Dev: <http://localhost:3002>

## Prisma

- Apply migrations: `npx prisma migrate dev`
- Push schema (dev only): `npx prisma db push`
- Seed: `npm run seed` (if defined) or `ts-node prisma/seed.ts`
