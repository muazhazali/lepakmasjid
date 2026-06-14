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

See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for PR guidelines.

## Production (self-hosted)

See **[PRODUCTION.md](./PRODUCTION.md)** — Docker Compose, one port **8080** (SPA + `/api`), point **Cloudflare Tunnel** at `http://127.0.0.1:8080`.


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
- 🔒 **User Authentication**: Email/password (JWT); Google OAuth planned
- 📝 **Submission Workflow**: Structured submission system with approval/rejection workflow
- 📈 **Analytics Dashboard**: Admin dashboard with statistics and insights

## Analytics

View our public web analytics dashboard: [https://umami.muaz.app/share/vH9QwmwSuIv2mDiu](https://umami.muaz.app/share/vH9QwmwSuIv2mDiu)

## Architecture

```
Browser  →  Vite (:8080)  →  /api/*  →  Express API (:3000)  →  PostgreSQL
```

In development, Vite proxies `/api` and `/api/uploads` to the API. In production, serve `dist/` and reverse-proxy `/api` to Express.

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React, TypeScript, Vite, shadcn-ui, Tailwind, React Query, Zustand, Leaflet |
| API | Node.js, Express 5, JWT, PostgreSQL 16, local `uploads/` |

## Prerequisites

- Node.js 20+, pnpm 10+, Docker (recommended) or PostgreSQL 16+, Git

## Scripts

| Command | What it does |
|---------|----------------|
| `pnpm setup:docker` | Docker Postgres + first-time setup |
| `pnpm dev:all` | API (:3000) + Vite (:8080) |
| `pnpm dev:api` / `pnpm dev:web` | One process only |
| `pnpm db:up` / `pnpm db:down` | Postgres container |
| `pnpm build` | Production frontend |
| `pnpm audit:deps` | Security audit |

Default Docker DB URL: `postgresql://lepakmasjid:lepakmasjid_dev@127.0.0.1:5432/lepakmasjid`

## Documentation

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — PostgreSQL tables
- [server/README.md](./server/README.md) — API setup

## Contributing

See **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

## License

**AGPL v3** — see [LICENSE](./LICENSE).

## Support

- [hello@lepakmasjid.app](mailto:hello@lepakmasjid.app)
- [GitHub Issues](https://github.com/muazhazali/lepakmasjid/issues)

---

**Made with ❤️ for the Malaysian Muslim community**