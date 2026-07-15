# LepakMasjid.app

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](./LICENSE)

Community-maintained, searchable directory of mosques in Malaysia — facilities,
activities, and events. Built for mobile use and accessible browsing with a
bilingual English/Bahasa Melayu interface.

**Live site:** [https://lepakmasjid.app](https://lepakmasjid.app)

## Contribute locally

Requirements: Node.js 24+ (LTS), pnpm 11+, and PocketBase. Contributors should
use a disposable local PocketBase instance; do not use production.

```bash
git clone https://github.com/muazhazali/lepakmasjid.git
cd lepakmasjid
pnpm install
pnpm setup

# In a second terminal, start PocketBase on http://127.0.0.1:8090.
# Create its first superuser when prompted, then add these values to .env.local:
# POCKETBASE_ADMIN_EMAIL=...
# POCKETBASE_ADMIN_PASSWORD=...
pnpm setup:pocketbase
pnpm dev
```

Open http://localhost:8080. `pnpm setup` writes
`VITE_POCKETBASE_URL=http://127.0.0.1:8090` by default. See
[POCKETBASE.md](./POCKETBASE.md) for installing and starting PocketBase,
creating an optional application admin, and the expected collections/rules.

## Architecture

```text
Browser :8080  →  Vite development server  →  PocketBase
Browser         →  Static production build →  PocketBase
```

Vite also proxies selected third-party requests for geocoding and the Sedekah
integration during development. No PostgreSQL database or application server
is required by this repository.

## Repository structure

| Path                    | Purpose                                                 |
| ----------------------- | ------------------------------------------------------- |
| `src/`                  | React SPA, routes, components, PocketBase data services |
| `src/lib/api/`          | PocketBase collection accessors                         |
| `src/lib/pocketbase.ts` | PocketBase client and auth state                        |
| `POCKETBASE.md`         | Backend collections and contributor setup               |
| `wrangler.toml`         | Static deployment configuration                         |

## Common commands

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `pnpm dev`              | Start the Vite development server      |
| `pnpm build`            | Create the production frontend build   |
| `pnpm preview`          | Preview the production build locally   |
| `pnpm setup`            | Create `.env.local` safely             |
| `pnpm setup:pocketbase` | Create schema and complete sample data |
| `pnpm seed:pocketbase`  | Re-seed complete sample data           |
| `pnpm format:check`     | Check formatting                       |
| `pnpm lint`             | Run ESLint                             |
| `pnpm audit:deps`       | Audit dependencies                     |
| `pnpm deploy`           | Deploy the static build with Wrangler  |

## Pull requests

Before opening a PR, run:

```bash
pnpm format:check
pnpm lint
pnpm audit:deps
pnpm build
```

Please keep user-facing copy available in both English and Bahasa Melayu and
preserve keyboard accessibility, labels, contrast, and mobile usability.

## Features

- Mosque directory with map, filters, and state search
- Community submissions and admin moderation
- Amenities, activities, trip planner, and Sedekah QR integration
- PocketBase authentication and image storage
- Bilingual UI, dark mode, font-size controls, and accessible navigation

## Community

- Issues: [GitHub Issues](https://github.com/muazhazali/lepakmasjid/issues)
- Email: [hello@lepakmasjid.app](mailto:hello@lepakmasjid.app)

License: AGPL v3 — see [LICENSE](./LICENSE).
