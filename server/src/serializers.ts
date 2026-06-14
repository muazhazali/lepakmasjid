/** API shapes consumed by the Vite frontend (PocketBase-compatible field names). */

export interface ClientUser {
  id: string;
  email: string;
  name?: string;
  role?: "user" | "admin";
  verified?: boolean;
  avatar?: string;
  collectionId: string;
  created: string;
  updated: string;
}

export interface ClientMosque {
  id: string;
  collectionId: string;
  name: string;
  name_bm?: string;
  address: string;
  contact?: string;
  state: string;
  lat: number;
  lng: number;
  description?: string;
  description_bm?: string;
  image?: string;
  status: "pending" | "approved" | "rejected";
  created_by: string;
  created: string;
  updated: string;
}

export function rowDates(row: { created: Date; updated: Date }) {
  return {
    created: row.created.toISOString(),
    updated: row.updated.toISOString(),
  };
}

/** Browser loads uploads via Vite proxy: /api/uploads → API /uploads */
export function uploadPublicPath(storedPath: string): string {
  return `/api/uploads/${storedPath.replace(/^\//, "")}`;
}

export function mosqueRow(
  row: Record<string, unknown>,
  _apiBase: string
): ClientMosque {
  const imagePath = row.image_path as string | null;
  return {
    id: row.id as string,
    collectionId: "mosques",
    name: row.name as string,
    name_bm: (row.name_bm as string) || undefined,
    address: row.address as string,
    contact: (row.contact as string) || undefined,
    state: row.state as string,
    lat: Number(row.lat),
    lng: Number(row.lng),
    description: (row.description as string) || undefined,
    description_bm: (row.description_bm as string) || undefined,
    image: imagePath ? uploadPublicPath(imagePath) : undefined,
    status: row.status as ClientMosque["status"],
    created_by: row.created_by as string,
    ...rowDates(row as { created: Date; updated: Date }),
  };
}

export function userRow(
  row: Record<string, unknown>,
  _apiBase: string
): ClientUser {
  const avatarPath = row.avatar_path as string | null;
  return {
    id: row.id as string,
    email: row.email as string,
    name: (row.name as string) || undefined,
    role: row.role as ClientUser["role"],
    verified: row.verified as boolean,
    avatar: avatarPath ? uploadPublicPath(avatarPath) : undefined,
    collectionId: "users",
    ...rowDates(row as { created: Date; updated: Date }),
  };
}