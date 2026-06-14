# Contributing to LepakMasjid

Thanks for helping improve the mosque directory for Malaysia.

## Get running locally

See **[docs/LOCAL_DEV.md](./docs/LOCAL_DEV.md)** — shortest path:

```bash
pnpm setup:docker
pnpm dev:all
```

## Before you open a PR

```bash
pnpm format
pnpm lint
pnpm audit:deps
pnpm build
```

If you changed the API, smoke-test with `pnpm dev:api` and hit `http://localhost:8080/api/health`.

## Scope

- **UI copy**: English and Bahasa Melayu where user-facing
- **Accessibility**: keyboard navigation, labels, contrast
- **Stack**: React + `server/` Express API + PostgreSQL (not PocketBase for new features)

## Questions

- [GitHub Issues](https://github.com/muazhazali/lepakmasjid/issues)
- [hello@lepakmasjid.app](mailto:hello@lepakmasjid.app)

License: AGPL v3 — see [LICENSE](./LICENSE).