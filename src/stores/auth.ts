import { create } from "zustand";
import { getCurrentUser, isAdmin, logout as clearAuthSession } from "@/lib/auth";
import type { User } from "@/types";
import { apiFetch, setStoredAuth } from "@/lib/api-client";
import {
  checkRateLimit,
  resetRateLimit,
  getRemainingAttempts,
  getResetTime,
} from "@/lib/rate-limit";

type OAuthStatus = "idle" | "loading" | "success" | "error";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  oauthStatus: OAuthStatus;
  oauthMessage: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    passwordConfirm: string,
    name?: string
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  clearOAuthStatus: () => void;
  setOAuthError: (message: string) => void;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const checkAuth = () => {
    const user = getCurrentUser() as User | null;
    set({
      user,
      isAuthenticated: !!user,
      isAdmin: isAdmin(),
      isLoading: false,
    });
  };

  checkAuth();

  return {
    user: getCurrentUser() as User | null,
    isAuthenticated: !!getCurrentUser(),
    isAdmin: isAdmin(),
    isLoading: false,
    oauthStatus: "idle" as OAuthStatus,
    oauthMessage: null,

    login: async (email: string, password: string) => {
      const rateLimitKey = `login:${email.toLowerCase()}`;
      const maxAttempts = 5;
      const windowMs = 15 * 60 * 1000;

      if (!checkRateLimit(rateLimitKey, maxAttempts, windowMs)) {
        const remainingTime = getResetTime(rateLimitKey);
        const minutes = remainingTime ? Math.ceil(remainingTime / 60000) : 15;
        throw new Error(
          `Too many login attempts. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`
        );
      }

      const res = await apiFetch<{ token: string; record: User }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        }
      );
      setStoredAuth(res.token, res.record as unknown as Record<string, unknown>);
      resetRateLimit(rateLimitKey);
      checkAuth();
    },

    register: async (
      email: string,
      password: string,
      passwordConfirm: string,
      name?: string
    ) => {
      const rateLimitKey = `register:${email.toLowerCase()}`;
      const maxAttempts = 3;
      const windowMs = 60 * 60 * 1000;

      if (!checkRateLimit(rateLimitKey, maxAttempts, windowMs)) {
        const remainingTime = getResetTime(rateLimitKey);
        const minutes = remainingTime ? Math.ceil(remainingTime / 60000) : 60;
        throw new Error(
          `Too many registration attempts. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`
        );
      }

      const res = await apiFetch<{ token: string; record: User }>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ email, password, passwordConfirm, name }),
        }
      );
      setStoredAuth(res.token, res.record as unknown as Record<string, unknown>);
      resetRateLimit(rateLimitKey);
      checkAuth();
    },

    loginWithGoogle: async () => {
      set({
        oauthStatus: "loading",
        oauthMessage: "Signing you in with Google...",
      });
      set({
        oauthStatus: "error",
        oauthMessage:
          "Google sign-in is not configured for the PostgreSQL API yet. Use email/password.",
      });
      throw new Error("Google OAuth not configured");
    },

    clearOAuthStatus: () => {
      set({ oauthStatus: "idle", oauthMessage: null });
    },

    setOAuthError: (message: string) => {
      set({ oauthStatus: "error", oauthMessage: message });
    },

    logout: () => {
      clearAuthSession();
      checkAuth();
    },

    checkAuth,
  };
});