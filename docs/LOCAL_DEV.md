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
pnpm setup
pnpm dev:all
```

Open **http://localhost:8080**

| What | Value |
|------|--------|
| Admin email | `admin@lepakmasjid.local` |
| Admin password | `adminadmin` |

`pnpm setup` will:

1. Create `.env.local` and `server/.env` from examples (if missing)
2. Install root + server dependencies
3. Run migrations and seed (amenities + admin user)

It does **not** start Postgres. Do that first:

```bash
pnpm db:up          # Docker Postgres on localhost:5432
pnpm setup          # then migrate + seed
```

Or one command:

```bash
pnpm setup:docker   # db:up + setup
```

## Real mosque data (optional)

Imports public listings + photos from `pb.muaz.app` (network required):

```bash
pnpm db:up
pnpm setup:docker -- --import-pb
# or after setup:
pnpm --dir server pb:export:public && pnpm --dir server pb:import:public
```

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

## Without Docker

1. Create DB/user matching `server/.env.example` (`DATABASE_URL`).
2. `pnpm setup` (skip `db:up`).
3. `pnpm dev:all`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED` on API | Run `pnpm dev:api` or `pnpm db:up` + `pnpm setup` |
| Empty mosque list | Run seed only gives admin + amenities; use `--import-pb` or add mosques via admin |
| Port 5432 in use | Change Docker port in `docker-compose.yml` and `DATABASE_URL` |
| Images 404 | Ensure `pnpm dev:api` is running; images served via `/api/uploads` |

## Code quality before PR

```bash
pnpm format && pnpm lint && pnpm audit:deps && pnpm build
```