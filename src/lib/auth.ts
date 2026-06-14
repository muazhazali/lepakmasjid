import { apiFetch, clearStoredAuth, getStoredAuth } from "./api-client";
import type { User } from "@/types";

export function isAuthenticated(): boolean {
  return !!getStoredAuth()?.token;
}

export function getCurrentUser(): User | null {
  const record = getStoredAuth()?.record;
  return (record as User | null) ?? null;
}

export function isAdmin(): boolean {
  return getCurrentUser()?.role === "admin";
}

export function logout(): void {
  clearStoredAuth();
}

export async function checkConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    await apiFetch("/health");
    return { connected: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to connect to API";
    return { connected: false, error: errorMessage };
  }
}