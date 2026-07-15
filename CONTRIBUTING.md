# Contributing to LepakMasjid

Thanks for helping improve the mosque directory for Malaysia.

## Get running locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The frontend uses PocketBase directly. Set `VITE_POCKETBASE_URL` to a
development PocketBase instance before starting the app. See
[POCKETBASE.md](./POCKETBASE.md) for the required collections and permissions.

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
