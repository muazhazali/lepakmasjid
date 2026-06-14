const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

const AUTH_KEY = "lepakmasjid_auth";

export interface StoredAuth {
  token: string;
  record: Record<string, unknown>;
}

export function getStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export function setStoredAuth(token: string, record: Record<string, unknown>) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ token, record }));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const auth = getStoredAuth();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (auth?.token) {
    headers.set("Authorization", `Bearer ${auth.token}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function getApiBase(): string {
  return API_BASE;
}