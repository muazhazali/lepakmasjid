# LepakMasjid.app

A community-maintained, searchable directory of mosques in Malaysia focused on facilities, activities, and events. Optimized for mobile and elderly users.

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
- **pnpm** 10+ ([install](https://pnpm.io/installation))
- **PostgreSQL** 16+ (local or remote)
- **Git**

## Local development

### 1. Clone and install

```bash
git clone https://github.com/muazhazali/lepakmasjid.git
cd lepakmasjid
pnpm install
cd server && pnpm install && cd ..
```

### 2. PostgreSQL

Create a database and user, for example:

```sql
CREATE USER lepakmasjid_app WITH PASSWORD 'your-secure-password';
CREATE DATABASE lepakmasjid OWNER lepakmasjid_app;
```

### 3. API (`server/`)

```bash
cd server
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, PORT=3000, UPLOAD_DIR, PUBLIC_URL
pnpm migrate
pnpm seed
pnpm dev
```

Default seed admin: **`admin@lepakmasjid.local`** / **`adminadmin`** (change in production).

API health: `http://127.0.0.1:3000/health`

### 4. Frontend (repo root)

```bash
cp .env.example .env.local
```

```env
VITE_API_URL=/api
VITE_APP_URL=http://localhost:8080
```

```bash
pnpm dev
```

Open **http://localhost:8080** (or your LAN IP on `:8080`).

### 5. Import data from PocketBase (optional)

```bash
cd server
pnpm pb:export:public    # mosques, amenities, images from pb.muaz.app
pnpm pb:import:public    # into Postgres
```

Full export (users, submissions, audit) requires PocketBase superuser env vars — see `server/.env.example` and [docs/MIGRATION_POSTGRES.md](./docs/MIGRATION_POSTGRES.md).

### 6. Production build

```bash
pnpm build          # output in dist/
pnpm preview        # local preview of static build
```

Deploy `dist/` behind a reverse proxy that forwards `/api` to the Node API.

## Project structure

```
lepakmasjid/
├── server/                 # Express API + PostgreSQL
│   ├── migrations/         # SQL schema
│   ├── scripts/            # migrate, seed, pb:export/import
│   ├── src/routes/         # REST handlers
│   └── uploads/            # mosque images (gitignored)
├── src/                    # React app
│   ├── components/
│   ├── hooks/
│   ├── lib/api/            # REST client wrappers
│   ├── lib/api-client.ts   # fetch + JWT
│   ├── pages/
│   └── stores/
├── scripts/                # Legacy PocketBase setup scripts (optional)
├── docs/MIGRATION_POSTGRES.md
├── DATABASE_SCHEMA.md      # Domain model (originally PB-oriented)
├── vite.config.ts          # /api proxy to :3000
└── package.json
```

## Database schema

Tables: `users`, `mosques`, `amenities`, `mosque_amenities`, `activities`, `submissions`, `audit_logs`. SQL source: `server/migrations/001_schema.sql`.

Field-level documentation and relationships: **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** (conceptual; some PB-specific wording may still apply).

API details: **[server/README.md](./server/README.md)**

## Environment variables

### Frontend (`.env.local`)

| Variable        | Description              | Example                    |
| --------------- | ------------------------ | -------------------------- |
| `VITE_API_URL`  | API base path            | `/api`                     |
| `VITE_APP_URL`  | App URL (OAuth redirects)| `http://localhost:8080`    |

### API (`server/.env`)

| Variable         | Description                    |
| ---------------- | ------------------------------ |
| `DATABASE_URL`   | PostgreSQL connection string   |
| `JWT_SECRET`     | Token signing secret           |
| `PORT`           | API port (default `3000`)      |
| `PUBLIC_URL`     | Public API base (image URLs)   |
| `UPLOAD_DIR`     | Directory for uploaded files   |

Optional for PocketBase import: `POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, `POCKETBASE_ADMIN_PASSWORD`.

## Scripts

### Frontend (root)

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `pnpm dev`          | Vite dev server (:8080)              |
| `pnpm build`        | Production build → `dist/`           |
| `pnpm preview`      | Preview production build             |
| `pnpm lint`         | ESLint                               |
| `pnpm format`       | Prettier                             |
| `pnpm audit:deps`   | `pnpm audit` in root and `server/`   |

### API (`server/`)

| Script                 | Description                    |
| ---------------------- | ------------------------------ |
| `pnpm dev`             | API with hot reload            |
| `pnpm migrate`         | Apply SQL migrations           |
| `pnpm seed`            | Seed admin + amenities         |
| `pnpm pb:export:public`| Export public PB collections   |
| `pnpm pb:import:public`| Import into Postgres           |

### Legacy PocketBase scripts (root `scripts/`)

Still present for the old hosted PocketBase workflow (`pnpm test:connection`, `setup:collections`, etc.). **Not required** for the PostgreSQL + Express stack.

## Roadmap / known gaps

- Google OAuth on the API
- Full admin CRUD (users, mosque edit/delete) parity
- Multipart image upload on submission create (API)
- systemd / production hardening guides

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**

   ```bash
   git clone <YOUR_FORK_URL>
   cd lepakmasjid
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Update documentation as needed
   - Run API + frontend locally before opening a PR

4. **Commit and push**

   ```bash
   git commit -m 'Add some amazing feature'
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request** with a clear description and linked issues.

### Code quality

Before committing:

```bash
pnpm format
pnpm lint
pnpm audit:deps
cd server && pnpm dev   # smoke-test API if you touched server/
pnpm build              # if you touched frontend
```

**Guidelines:** shadcn-ui components, Zustand + React Query, bilingual strings, accessibility (ARIA, keyboard), TypeScript strictness where applicable.

## License

This project is licensed under the **AGPL v3** (GNU Affero General Public License v3.0).

See the [LICENSE](./LICENSE) file for details.

## Cool Projects

- [sedekah.je](https://sedekah.je)
- [getdoa.com](https://getdoa.com)
- [waktusolat.app](https://waktusolat.app)
- [pasarmalam.app](https://pasarmalam.app)
- [kalori-api.my](https://kalori-api.my)

## Support

For issues, questions, or feature requests:

- **Email**: [hello@lepakmasjid.app](mailto:hello@lepakmasjid.app)
- **GitHub Issues**: [muazhazali/lepakmasjid](https://github.com/muazhazali/lepakmasjid/issues)

---

**Made with ❤️ for the Malaysian Muslim community**