# LepakMasjid API (PostgreSQL)

Express REST API for [LepakMasjid](https://github.com/muazhazali/lepakmasjid).

**Easiest full stack:** from repo root, `pnpm setup:docker` then `pnpm dev:all` — [docs/LOCAL_DEV.md](../docs/LOCAL_DEV.md).

## Quick start (API only)

```bash
cp .env.example .env   # DATABASE_URL, JWT_SECRET
pnpm install
pnpm migrate
pnpm seed
pnpm dev
```

Default seed admin: `admin@lepakmasjid.local` / `adminadmin`

## Environment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signing key for auth tokens |
| `PORT` | Default `3000` |
| `PUBLIC_URL` | Base URL for absolute image links |
| `UPLOAD_DIR` | Local file storage (mosque images) |

## Endpoints (overview)

- `GET /health`
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /mosques`, `GET /mosques/:id`
- `GET /amenities`
- `POST /submissions`, `GET /submissions`, `GET /submissions/mine`
- `POST /submissions/:id/approve`, `POST /submissions/:id/reject` (admin)
- `GET /uploads/:filename` (static files)

## PocketBase import

```bash
pnpm pb:export:public
pnpm pb:import:public
```

Full export: set `POCKETBASE_ADMIN_EMAIL` / `POCKETBASE_ADMIN_PASSWORD` in `.env`, then `pnpm pb:export` and `pnpm pb:import`.

## Frontend

Set `VITE_API_URL=/api` in root `.env.local`. Vite proxies `/api/*` to this server (see root `vite.config.ts`).

## Roadmap

- Users admin CRUD, profile, password reset
- Mosque PATCH/DELETE, multipart uploads on submissions
- Google OAuth
- Audit log API parity