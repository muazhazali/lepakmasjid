# Database schema (PostgreSQL)

LepakMasjid stores data in **PostgreSQL 16**. The canonical DDL is `server/migrations/001_schema.sql`.

## Tables

| Table | Purpose |
|-------|---------|
| `users` | Accounts (email, password hash, role, avatar path) |
| `mosques` | Mosque directory entries |
| `amenities` | Catalog of facility types |
| `mosque_amenities` | Mosque ↔ amenity links + JSON `details` |
| `activities` | Events and schedules per mosque |
| `submissions` | Community proposals (new/edit mosque) |
| `audit_logs` | Admin action history |

## Identifiers

Primary keys are **15-character text IDs** (`nanoid`), same shape as the historical backend for stable URLs and imports.

## Users

| Column | Notes |
|--------|--------|
| `email` | Unique, login identity |
| `password_hash` | bcrypt |
| `role` | `user` or `admin` |
| `avatar_path` | File under API `uploads/` |

Auth tokens are **JWT** (7-day default), not stored in the database.

## Mosques

Key fields: `name`, `name_bm`, `address`, `state`, `lat`, `lng`, `description`, `description_bm`, `image_path`, `status` (`pending` \| `approved` \| `rejected`), `created_by` → `users`.

Indexes on `status`, `(lat, lng)`, `state`.

## Submissions

`type`: `new_mosque` \| `edit_mosque`. `data` is JSON. Workflow: `pending` → `approved` \| `rejected` via API (admin). Approval creates/updates `mosques` in a transaction.

## API access

The React app calls the **Express API** (`server/`); it does not connect to Postgres directly. See [server/README.md](./server/README.md).

## Sample data

```bash
cd server && pnpm seed          # admin + amenities catalog
cd server && pnpm seed:images   # optional placeholder mosque images
```