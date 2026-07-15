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

## Provision the development schema and data

For a fresh development PocketBase instance, the setup command creates the
required collections, permissions, and user fields, then seeds three approved
mosques. It is safe to run repeatedly: existing collections and mosque names
are preserved.

```bash
pnpm setup
# Edit .env.local and set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD
pnpm setup:pocketbase
```

The seed is idempotent: it creates three approved Malaysian mosques and skips
records that already exist with the same name. If the `mosques.created_by`
relation is required by your collection, also set `POCKETBASE_SEED_CREATED_BY`
to a valid `users` record ID before running the command. Never commit these
credentials or a PocketBase data directory.

The command creates:

- `users` custom fields: `role`, `trust_score`
- `mosques`
- `amenities`
- `mosque_amenities`
- `activities`
- `submissions`
- `audit_logs`

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
