# PocketBase development

LepakMasjid uses PocketBase as its application backend. The React app talks to
PocketBase directly for authentication, mosque data, amenities, activities,
submissions, users, audit logs, and image files.

## Local configuration

Copy the environment template and point it at a development PocketBase server:

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Set `VITE_POCKETBASE_URL` in `.env.local` to the URL of the PocketBase instance.
Do not point contributor development environments at production unless you are
an authorized maintainer.

## Required collections

The instance must provide these collections:

- `users`
- `mosques`
- `amenities`
- `mosque_amenities`
- `activities`
- `submissions`
- `audit_logs`

Collection rules should allow public read access only for approved mosque data
and public catalog data. Create, update, delete, moderation, and audit access
must be restricted to authenticated users or admins as appropriate.

## Data and secrets

Never commit `pb_data/`, production exports, uploaded images, admin credentials,
or API tokens. Use a disposable development instance or a sanitized fixture for
contributors and CI.
