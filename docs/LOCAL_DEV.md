# Local development (contributors)

Fast path to run LepakMasjid on your laptop.

## Requirements

- [Node.js](https://nodejs.org/) **20+**
- [pnpm](https://pnpm.io/installation) **10+** (`corepack enable` on recent Node)
- **Either** [Docker](https://docs.docker.com/get-docker/) **or** PostgreSQL 16 you manage yourself

## Quick start (recommended)

```bash
git clone https://github.com/muazhazali/lepakmasjid.git
cd lepakmasjid
pnpm setup:docker
pnpm dev:all
```

Open **http://localhost:8080**

| What | Value |
|------|--------|
| Admin email | `admin@lepakmasjid.local` |
| Admin password | `adminadmin` |

`pnpm setup:docker` starts Postgres (Docker), creates `.env` files, installs dependencies, runs migrations and seed.

Without Docker: start your own Postgres, set `server/.env` `DATABASE_URL`, then `pnpm setup` and `pnpm dev:all`.

## More mosque data

Seed only adds admin + amenities. Add mosques via the app (submit flow + admin approve) or extend `server/scripts/seed.ts`.

Optional placeholder images: `cd server && pnpm seed:images`

## Scripts cheat sheet

| Command | Purpose |
|---------|---------|
| `pnpm db:up` | Start Postgres container |
| `pnpm db:down` | Stop Postgres container |
| `pnpm setup` | Env + install + migrate + seed |
| `pnpm setup:docker` | `db:up` then `setup` |
| `pnpm dev:api` | API on :3000 |
| `pnpm dev:web` | Vite on :8080 |
| `pnpm dev:all` | API + web in parallel |
| `pnpm audit:deps` | Security audit |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED` on API | Run `pnpm dev:api` or `pnpm db:up` + `pnpm setup` |
| Empty mosque list | Expected after seed — submit mosques or extend seed script |
| Port 5432 in use | Change Docker port in `docker-compose.yml` and `DATABASE_URL` |
| Images 404 | Ensure `pnpm dev:api` is running; images at `/api/uploads` |

## Before a PR

```bash
pnpm format && pnpm lint && pnpm audit:deps && pnpm build
```