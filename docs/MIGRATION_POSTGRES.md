# PostgreSQL stack

## Architecture

- **Frontend:** Vite/React on `:8080`, calls `/api/*`
- **API:** `server/` Express on `:3000`, JWT auth, Postgres + `uploads/`
- **Database:** PostgreSQL 16 (`lepakmasjid`)

## Setup

```bash
# PostgreSQL: create role + database (see server/README.md)
cd server && cp .env.example .env && pnpm install
pnpm migrate && pnpm seed
pnpm dev
```

```bash
# Frontend
cp .env.example .env.local   # VITE_API_URL=/api
pnpm install && pnpm dev
```

## Dependency audit

```bash
pnpm audit:deps
```

Runs audit in root and `server/`. Use `pnpm.overrides` in root `package.json` for transitive fixes.
