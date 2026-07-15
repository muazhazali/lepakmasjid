# PocketBase development

LepakMasjid uses PocketBase as its application backend. The React app talks to
PocketBase directly for authentication, mosque data, amenities, activities,
submissions, users, audit logs, and image files.

## Local configuration

### 1. Install and start PocketBase

Install the PocketBase binary using the official PocketBase release for your
platform, then start a disposable development instance from the repository
root:

```bash
./pocketbase serve --http=127.0.0.1:8090
```

On first start, open `http://127.0.0.1:8090/_/` and create a superuser. Keep
the PocketBase process running in a separate terminal. PocketBase stores local
data in `pb_data/`; this directory is development-only and must never be
committed.

### 2. Configure the frontend and provisioning script

Copy the environment template and point it at the development server:

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Set `VITE_POCKETBASE_URL` in `.env.local` to the URL of the PocketBase instance.
Do not point contributor development environments at production unless you are
an authorized maintainer.

Add the superuser credentials used only by the provisioning scripts:

```dotenv
POCKETBASE_ADMIN_EMAIL=you@example.test
POCKETBASE_ADMIN_PASSWORD=your-superuser-password
```

## Provision the development schema and data

For a fresh development PocketBase instance, the setup command checks the
connection, creates the required collections, permissions, and user fields,
then seeds three approved mosques plus amenities, mosque-amenity relationships,
and sample activities. It is safe to run repeatedly: existing records are
preserved.

```bash
pnpm setup
# Edit .env.local and set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD
pnpm setup:pocketbase
```

The seed is idempotent and skips records that already exist. If the
`mosques.created_by` relation is required by your collection, set
`POCKETBASE_SEED_CREATED_BY` to a valid `users` record ID before running the
command.

To test admin pages, optionally create a verified application admin user:

```dotenv
POCKETBASE_SEED_USER_EMAIL=admin@example.test
POCKETBASE_SEED_USER_PASSWORD=a-local-only-password
```

These are application-user credentials, not PocketBase superuser credentials.
Never commit either set of credentials or a PocketBase data directory.

The command creates:

- `users` custom fields: `role`, `trust_score`
- `mosques`
- `amenities`
- `mosque_amenities`
- `activities`
- `submissions`
- `audit_logs`

If setup fails, first check that PocketBase is running at
`VITE_POCKETBASE_URL`, then verify the superuser credentials. The provisioning
script reports these two failures separately.

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
