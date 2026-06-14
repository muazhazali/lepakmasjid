# PocketBase → PostgreSQL migration

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

## Import from PocketBase

```bash
cd server
pnpm pb:export:public    # mosques, amenities, images from pb.muaz.app
pnpm pb:import:public    # into Postgres (keeps local admin user)

# Full export (needs superuser):
# POCKETBASE_ADMIN_EMAIL=... POCKETBASE_ADMIN_PASSWORD=... pnpm pb:export
# pnpm pb:import
```

## Commits (migration history)

1. Server schema + core (Postgres migrations, auth, serializers)
2. REST routes (mosques, amenities, submissions approve)
3. PocketBase export/import scripts
4. Frontend HTTP client + env
5. Replace PocketBase SDK usage in app
6. Vite dev proxy + docs