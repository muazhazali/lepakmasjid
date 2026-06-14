# Frontend data layer

The UI loads data through **React Query hooks** and **`src/lib/api/*`** helpers, which call the REST API (`VITE_API_URL`, default `/api`).

## Hooks (examples)

| Hook | Purpose |
|------|---------|
| `useMosques` | Paginated mosque list + filters |
| `useMosque` | Single mosque with amenities/activities |
| `useSubmissions` | Admin submission queue |
| `useMySubmissions` | Current user's submissions |
| `useAmenities` | Amenities catalog |
| `useUsers` | Admin user list |

## REST surface (implemented in `server/`)

- `GET /health`
- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /mosques`, `GET /mosques/:id`
- `GET /amenities`
- `POST /submissions`, `GET /submissions`, `GET /submissions/mine`
- `POST /submissions/:id/approve`, `POST /submissions/:id/reject`
- `GET /uploads/:file`

## Auth

JWT in `localStorage` key `lepakmasjid_auth`. Helpers: `src/lib/api-client.ts`, `src/lib/auth.ts`.

## Errors

API errors throw `ApiError` with `status` and message; hooks surface them via React Query `error`.