# LepakMasjid.app

A community-maintained, searchable directory of mosques in Malaysia focused on facilities, activities, and events. Optimized for mobile and elderly users.

## Quick start (open source contributors)

**Node 20+**, **pnpm 10+**, and **Docker** (easiest) or your own PostgreSQL 16.

```bash
git clone https://github.com/muazhazali/lepakmasjid.git
cd lepakmasjid
pnpm setup:docker    # Postgres + .env + migrate + seed
pnpm dev:all         # API + frontend in one terminal
```

Open **http://localhost:8080** — admin: `admin@lepakmasjid.local` / `adminadmin`

**With real mosque data** from production PocketBase (optional, needs network):

```bash
pnpm setup:import
pnpm dev:all
```

More detail: **[docs/LOCAL_DEV.md](./docs/LOCAL_DEV.md)** · **[CONTRIBUTING.md](./CONTRIBUTING.md)**

## Features

- 🕌 **Mosque Directory**: Searchable directory with GPS coordinates and detailed information
- 🔍 **Advanced Search**: Search by name, location, state, and amenities with filtering capabilities
- 🗺️ **Interactive Map**: Map view with marker clustering using Leaflet.js and OpenStreetMap
- 📱 **Mobile-First**: Responsive design optimized for mobile devices
- ♿ **Accessibility**: Large fonts, high contrast, adjustable font size, skip links, and ARIA labels
- 🌐 **Bilingual**: Full Bahasa Melayu and English support with language toggle
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 👥 **Community-Driven**: Users can submit new mosques and suggest edits to existing mosque information
- 🔐 **Admin Panel**: Moderation workflow for submissions with audit logging
- 📊 **Activities & Events**: Track one-off, recurring, and fixed activities at mosques
- 🏢 **Amenities Management**: Standardized amenities catalog with custom amenities support
- 🔒 **User Authentication**: Email/password (JWT); Google OAuth planned on the new API
- 📝 **Submission Workflow**: Structured submission system with approval/rejection workflow
- 📈 **Analytics Dashboard**: Admin dashboard with statistics and insights

## Analytics

View our public web analytics dashboard: [https://umami.muaz.app/share/vH9QwmwSuIv2mDiu](https://umami.muaz.app/share/vH9QwmwSuIv2mDiu)

## Architecture

The app is a **monorepo-style** setup: React frontend + Node API + PostgreSQL.

```
Browser  →  Vite dev server (:8080)  →  /api/*  →  Express API (:3000)  →  PostgreSQL
                                              ↘  static uploads (mosque images)
```

In development, Vite proxies `/api` and `/api/uploads` to the API so the UI uses a single origin. In production, serve `dist/` and reverse-proxy `/api` to the same Express process.

**Historical note:** Production data was originally on [PocketBase](https://pb.muaz.app). The stack has migrated to **PostgreSQL + Express**; import scripts can still pull from PocketBase. See [docs/MIGRATION_POSTGRES.md](./docs/MIGRATION_POSTGRES.md).

## Tech Stack

### Frontend

- **Framework**: React 18.3+ with TypeScript
- **Build Tool**: Vite 7.3+
- **Routing**: React Router DOM 6.30+
- **UI**: shadcn-ui (Radix UI), Tailwind CSS 3.4+
- **State**: Zustand, TanStack Query
- **Maps**: Leaflet / React Leaflet, OpenStreetMap
- **Forms**: React Hook Form + Zod

### Backend (`server/`)

- **Runtime**: Node.js, Express 5
- **Database**: PostgreSQL 16
- **Auth**: JWT (bcrypt password hashes)
- **IDs**: PocketBase-compatible 15-character text IDs (nanoid)
- **Files**: Local `uploads/` directory, served at `/uploads` (exposed as `/api/uploads` via proxy)

### Tooling

- **Package manager**: pnpm 10+
- **Lint / format**: ESLint 9, Prettier 3
- **Security**: `pnpm audit:deps` (root + server)

## Prerequisites

- **Node.js** 20+ (22 LTS recommended)
- **pnpm** 10+ (`corepack enable` on recent Node)
- **Docker** (recommended) or PostgreSQL 16+
- **Git**

## Local development (manual)

If you prefer not to use `pnpm setup:docker`:

1. Start Postgres (or `pnpm db:up` with Docker).
2. `pnpm setup` — creates env files, installs deps, migrates, seeds.
3. `pnpm dev:all`

Docker Postgres credentials (default in `docker-compose.yml` / `server/.env.example`):

`postgresql://lepakmasjid:lepakmasjid_dev@127.0.0.1:5432/lepakmasjid`

### Production build

```bash
pnpm build
pnpm preview
```

Deploy `dist/` behind a reverse proxy that forwards `/api` to the Node API.

## Project structure

```
lepakmasjid/
├── docker-compose.yml      # dev Postgres only
├── server/                 # Express API + PostgreSQL
├── src/                    # React app
├── scripts/setup-local.mjs # pnpm setup
├── docs/LOCAL_DEV.md
└── package.json
```

## Database schema

Tables: `users`, `mosques`, `amenities`, `mosque_amenities`, `activities`, `submissions`, `audit_logs`. SQL: `server/migrations/001_schema.sql`.

See **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** and **[server/README.md](./server/README.md)**.

## Environment variables

| Frontend (`.env.local`) | API (`server/.env`) |
|-------------------------|---------------------|
| `VITE_API_URL=/api` | `DATABASE_URL` |
| `VITE_APP_URL` | `JWT_SECRET`, `PORT`, `UPLOAD_DIR` |

Copy from `.env.example` files; `pnpm setup` creates them if missing.

## Scripts

| Command | What it does |
|---------|----------------|
| `pnpm setup:docker` | Docker Postgres + first-time setup |
| `pnpm setup:import` | Setup + import public PB mosque data |
| `pnpm dev:all` | API + Vite together |
| `pnpm dev:api` / `pnpm dev:web` | One process only |
| `pnpm db:up` / `pnpm db:down` | Postgres container |
| `pnpm build` | Production frontend |
| `pnpm audit:deps` | Security audit |

Legacy PocketBase scripts under `scripts/` are optional and not needed for the Postgres stack.

## Roadmap / known gaps

- Google OAuth on the API
- Full admin CRUD (users, mosque edit/delete) parity
- Multipart image upload on submission create (API)

## Contributing

See **[CONTRIBUTING.md](./CONTRIBUTING.md)**. Before a PR: `pnpm format`, `pnpm lint`, `pnpm audit:deps`, `pnpm build`.

## License

**AGPL v3** — see [LICENSE](./LICENSE).

## Cool Projects

- [sedekah.je](https://sedekah.je)
- [getdoa.com](https://getdoa.com)
- [waktusolat.app](https://waktusolat.app)
- [pasarmalam.app](https://pasarmalam.app)
- [kalori-api.my](https://kalori-api.my)

## Support

- **Email**: [hello@lepakmasjid.app](mailto:hello@lepakmasjid.app)
- **Issues**: [github.com/muazhazali/lepakmasjid](https://github.com/muazhazali/lepakmasjid/issues)

---

**Made with ❤️ for the Malaysian Muslim community**