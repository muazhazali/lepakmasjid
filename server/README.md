# LepakMasjid API (PostgreSQL)

## Setup

```bash
cp .env.example .env   # set DATABASE_URL, JWT_SECRET
pnpm install
pnpm migrate
pnpm seed
pnpm dev
```

Default seed admin: `admin@lepakmasjid.local` / `adminadmin`

## Env

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signing key for auth tokens |
| `PORT` | Default `3000` |
| `PUBLIC_URL` | Base URL for image links |
| `UPLOAD_DIR` | Local file storage |

## Frontend

Set `VITE_API_URL=/api` and proxy `/api/*` to this server (see root `vite.config.ts`).

## Still TODO

- Submissions create/approve/reject (server transaction)
- Users admin CRUD, profile, password reset
- Google OAuth
- PB → Postgres data import from `pb.muaz.app`
- Mosque admin update/delete, file uploads