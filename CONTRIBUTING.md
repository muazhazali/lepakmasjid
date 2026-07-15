# Contributing to LepakMasjid

Thanks for helping improve the mosque directory for Malaysia.

## Get running locally

1. Install Node.js 24+ and pnpm 11+.
2. Install PocketBase and start a local instance on port `8090`.
3. Create the PocketBase superuser in its web UI.
4. Run:

   ```bash
   pnpm install
   pnpm setup
   ```

5. Add the PocketBase superuser credentials to `.env.local` as
   `POCKETBASE_ADMIN_EMAIL` and `POCKETBASE_ADMIN_PASSWORD`.
6. Create the schema and sample data:

   ```bash
   pnpm setup:pocketbase
   pnpm dev
   ```

The setup command creates `.env.local` without overwriting an existing file.
The PocketBase setup command checks connectivity, creates the collections, and
seeds mosques, amenities, relationships, and activities. See
[POCKETBASE.md](./POCKETBASE.md) for the complete backend setup.

## Before you open a PR

```bash
pnpm format:check
pnpm lint
pnpm audit:deps
pnpm build
```

## Scope

- **UI copy**: English and Bahasa Melayu where user-facing
- **Accessibility**: keyboard navigation, labels, contrast
- **Stack**: React + Vite + PocketBase

## Questions

- [GitHub Issues](https://github.com/muazhazali/lepakmasjid/issues)
- [hello@lepakmasjid.app](mailto:hello@lepakmasjid.app)

License: AGPL v3 — see [LICENSE](./LICENSE).
