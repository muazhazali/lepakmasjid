# LepakMasjid.app

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)

Community-maintained, searchable directory of mosques in Malaysia — facilities, activities, and events. Built for mobile use and accessible browsing (large type, bilingual UI).

**Live site:** [https://lepakmasjid.app](https://lepakmasjid.app)  
**Source:** [github.com/muazhazali/lepakmasjid](https://github.com/muazhazali/lepakmasjid)

---

## Contribute in 5 minutes

**Requirements:** Node.js **20+**, **pnpm 10+**, and **Docker** (recommended) or PostgreSQL **16+**.

```bash
git clone https://github.com/muazhazali/lepakmasjid.git
cd lepakmasjid
pnpm setup:docker    # Postgres, .env, migrate, seed
pnpm dev:all         # API + Vite together
```

Open **http://localhost:8080**

| Role | Dev login (seed only) |
|------|------------------------|
| Admin | `admin@lepakmasjid.local` / `adminadmin` |

Change the admin password after first login in any real deployment.

**Before a pull request:** see **[CONTRIBUTING.md](./CONTRIBUTING.md)** — format, lint, build, and API smoke checks.

**Good first issues:** [GitHub Issues](https://github.com/muazhazali/lepakmasjid/issues) — UI copy (EN + BM), accessibility, mosque data, and API fixes are always welcome.

---

## What’s in the repo

| Path | Purpose |
|------|---------|
| `src/` | React SPA (Vite, TypeScript, shadcn-ui, Tailwind) |
| `server/` | Express 5 API, JWT auth, migrations, uploads |
| `server/migrations/` | PostgreSQL schema (run via `pnpm --dir server migrate`) |
| `scripts/setup-local.mjs` | First-time local env + install helper |
| `deploy/` | Example systemd units (Node or Docker Compose) |
| `PRODUCTION.md` | Self-hosted production + Cloudflare Tunnel |

**Not in git (keep local):** `.env`, `.env.prod`, `server/.env` — copy from `*.example` files.

---

## Architecture

**Development** — two processes, one browser origin:

```text
Browser :8080  →  Vite dev server  →  proxies /api/*  →  Express :3000  →  PostgreSQL
```

**Production** — single Node process on **8080** (static `dist/` + `/api`):

```text
Browser  →  Express production server (:8080)  →  PostgreSQL
              ├── /*     SPA (index.html fallback)
              └── /api/* JSON API + uploads
```

Self-hosting: **[PRODUCTION.md](./PRODUCTION.md)** (Docker Compose or Node + optional Cloudflare Tunnel to `http://127.0.0.1:8080`).

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 18, TypeScript, Vite, shadcn-ui, Tailwind, TanStack Query, Zustand, Leaflet / OSM |
| API | Node.js, Express 5, JWT, Zod, Multer (uploads) |
| Database | PostgreSQL 16 |

---

## Common commands

| Command | Description |
|---------|-------------|
| `pnpm setup:docker` | Start Postgres + full local setup |
| `pnpm setup` | Local setup without Docker (you provide Postgres) |
| `pnpm dev:all` | API + frontend (contributor default) |
| `pnpm dev:api` / `pnpm dev:web` | API or frontend only |
| `pnpm db:up` / `pnpm db:down` | Postgres container |
| `pnpm build` | Production frontend build |
| `pnpm start:prod` | Run production server (after `pnpm build` + `pnpm --dir server build`) |
| `pnpm format` / `pnpm lint` | Code style and ESLint |
| `pnpm audit:deps` | Dependency security audit |

Default Docker database URL:

`postgresql://lepakmasjid:lepakmasjid_dev@127.0.0.1:5432/lepakmasjid`

API health (dev or prod): `http://localhost:8080/api/health`

---

## Features

- Mosque directory with map, filters, and state search
- Community submissions and admin moderation + audit log
- Amenities catalog, activities, trip planner, Sedekah QR integration
- Bilingual (EN / BM), dark mode, font size toggle, skip links
- Email/password auth (JWT); Google OAuth not wired on API yet

Public analytics: [Umami dashboard](https://umami.muaz.app/share/vH9QwmwSuIv2mDiu)

---

## Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) — how to open a PR
- [PRODUCTION.md](./PRODUCTION.md) — deploy your own instance
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — PostgreSQL tables
- [server/README.md](./server/README.md) — API-focused notes

---

## License & community

**AGPL v3** — see [LICENSE](./LICENSE). Network use of modified versions must share source under the same license.

- **Email:** [hello@lepakmasjid.app](mailto:hello@lepakmasjid.app)
- **Issues & discussions:** [GitHub](https://github.com/muazhazali/lepakmasjid/issues)

Made for the Malaysian Muslim community — contributions from everyone who uses or cares for masjid spaces are encouraged.