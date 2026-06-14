# Production deployment (self-hosted + Cloudflare Tunnel)

One process serves the built React app and the API on **port 8080** (default). Paths:

| Path | Handler |
|------|---------|
| `/api/*` | Express API (auth, mosques, uploads, …) |
| `/*` | Static files from `dist/`, SPA fallback to `index.html` |

You run **Cloudflare Tunnel** yourself and point it at `http://127.0.0.1:8080` (or `APP_PORT`).

## Prerequisites

- Docker + Docker Compose v2
- A public hostname on Cloudflare (tunnel)

## 1. Configure environment

```bash
cd /path/to/lepakmasjid
cp .env.prod.example .env.prod
```

Edit `.env.prod`:

| Variable | Example |
|----------|---------|
| `APP_URL` | `https://lepakmasjid.hrzhkm.xyz` (no trailing slash) |
| `POSTGRES_PASSWORD` | strong random |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `RUN_SEED` | `1` on **first** deploy only, then `0` |
| `SEED_ADMIN_PASSWORD` | change before setting `RUN_SEED=1` |

`APP_URL` is baked into the frontend at **image build time** and used for CORS on the API.

## 2. Build and start (Docker)

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

On each container start, **migrations** run automatically. If `RUN_SEED=1`, the admin user is seeded once (set back to `0` afterward).

Logs:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f app
```

## 3. Cloudflare Tunnel

Point your tunnel’s public hostname at the app on this host:

```text
https://your-hostname.example.com  →  http://127.0.0.1:8080
```

Example `config.yml`:

```yaml
ingress:
  - hostname: lepakmasjid.hrzhkm.xyz
    service: http://127.0.0.1:8080
  - service: http_status:404
```

No path-based rules needed: SPA and `/api` share one origin.

## 4. Verify

```bash
curl -sS http://127.0.0.1:8080/api/health
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/
```

Then open `APP_URL` through the tunnel.

## 5. Updates

```bash
git pull
# bump APP_URL in .env.prod if hostname changed — triggers frontend rebuild
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Keep `RUN_SEED=0` on routine deploys.

## Without Docker (Node on the host)

Requires Node 20+ and pnpm 10+.

```bash
cp .env.prod.example .env.prod
# Copy server env (DATABASE_URL must reach Postgres)
cp server/.env.example server/.env
# Edit server/.env: DATABASE_URL, JWT_SECRET, PUBLIC_URL=APP_URL, APP_URL, PORT=8080

export VITE_APP_URL="https://your-public-url"
export VITE_API_URL=/api
pnpm install && pnpm --dir server install
pnpm build && pnpm --dir server build
pnpm --dir server migrate
RUN_SEED=1 pnpm --dir server seed   # first time only

pnpm start:prod   # root script → server production entry
```

Keep the process alive with systemd or pm2. Tunnel → `http://127.0.0.1:8080`.

## Optional: systemd for Docker Compose

Edit `deploy/lepakmasjid.service` (`WorkingDirectory` = your clone path), then:

```bash
sudo cp deploy/lepakmasjid.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now lepakmasjid
```

## Security checklist

- [ ] Unique `JWT_SECRET` and `POSTGRES_PASSWORD`
- [ ] Change admin password after first login
- [ ] Postgres not published publicly (default compose: internal network only)
- [ ] Volumes: `lepakmasjid_pg_prod`, `lepakmasjid_uploads` — back up regularly

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm build` | Production frontend (`VITE_*` from env) |
| `pnpm start:prod` | Run `server` production server (after builds) |