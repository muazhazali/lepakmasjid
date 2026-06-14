/**
 * Legacy module name — backs onto PostgreSQL API (see api-client.ts).
 */
import {
  clearStoredAuth,
  getStoredAuth,
  setStoredAuth,
  apiFetch,
} from "./api-client";
import type { User } from "@/types";

export function getPocketBase(): never {
  throw new Error("PocketBase SDK removed; use api-client");
}

export const pb = {
  authStore: {
    get isValid() {
      return !!getStoredAuth()?.token;
    },
    get model() {
      return getStoredAuth()?.record ?? null;
    },
    save(token: string, model: Record<string, unknown>) {
      setStoredAuth(token, model);
    },
    clear() {
      clearStoredAuth();
    },
    onChange(_cb: () => void) {
      /* Zustand checkAuth on login/logout */
    },
  },
  collection() {
    throw new Error("Use lib/api/* HTTP client");
  },
  health: {
    async check() {
      await apiFetch("/health");
    },
  },
};

export const isAuthenticated = (): boolean => pb.authStore.isValid;

export const getCurrentUser = (): User | null =>
  (pb.authStore.model as User | null) ?? null;

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "admin";
};

export const logout = (): void => {
  pb.authStore.clear();
};

export const checkConnection = async (): Promise<{
  connected: boolean;
  error?: string;
}> => {
  try {
    await apiFetch("/health");
    return { connected: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to connect to API";
    return { connected: false, error: errorMessage };
  }
};

export const getPocketBaseUrl = (): string => {
  return import.meta.env.VITE_API_URL || "/api";
};