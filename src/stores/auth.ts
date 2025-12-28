import { create } from "zustand";
import { pb, getCurrentUser, isAdmin } from "@/lib/pocketbase";
import type { User } from "@/types";
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
  // Initialize auth state
  const checkAuth = () => {
    const user = getCurrentUser() as User | null;
    set({
      user,
      isAuthenticated: !!user,
      isAdmin: isAdmin(),
      isLoading: false,
    });
  };

  // Check auth on store creation
  checkAuth();

  // Listen to auth changes
  pb.authStore.onChange(() => {
    checkAuth();
  });

  return {
    user: getCurrentUser() as User | null,
    isAuthenticated: !!getCurrentUser(),
    isAdmin: isAdmin(),
    isLoading: false,
    oauthStatus: "idle" as OAuthStatus,
    oauthMessage: null,

    login: async (email: string, password: string) => {
      // Rate limiting: 5 attempts per 15 minutes per email
      const rateLimitKey = `login:${email.toLowerCase()}`;
      const maxAttempts = 5;
      const windowMs = 15 * 60 * 1000; // 15 minutes

      if (!checkRateLimit(rateLimitKey, maxAttempts, windowMs)) {
        const remainingTime = getResetTime(rateLimitKey);
        const minutes = remainingTime ? Math.ceil(remainingTime / 60000) : 15;
        throw new Error(
          `Too many login attempts. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`
        );
      }

      await pb.collection("users").authWithPassword(email, password);
      // Reset rate limit on successful login
      resetRateLimit(rateLimitKey);
      checkAuth();
    },

    register: async (
      email: string,
      password: string,
      passwordConfirm: string,
      name?: string
    ) => {
      // Rate limiting: 3 registrations per hour per IP (using email as proxy)
      const rateLimitKey = `register:${email.toLowerCase()}`;
      const maxAttempts = 3;
      const windowMs = 60 * 60 * 1000; // 1 hour

      if (!checkRateLimit(rateLimitKey, maxAttempts, windowMs)) {
        const remainingTime = getResetTime(rateLimitKey);
        const minutes = remainingTime ? Math.ceil(remainingTime / 60000) : 60;
        throw new Error(
          `Too many registration attempts. Please try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`
        );
      }

      // Create user
      await pb.collection("users").create({
        email,
        password,
        passwordConfirm,
        name,
      });

      // Reset rate limit on successful registration
      resetRateLimit(rateLimitKey);

      // Auto-login after registration
      await pb.collection("users").authWithPassword(email, password);
      checkAuth();
    },

    loginWithGoogle: async () => {
      set({
        oauthStatus: "loading",
        oauthMessage: "Signing you in with Google...",
      });
      try {
        // Use PocketBase's built-in OAuth2 method which handles everything automatically
        // This opens a popup window, handles the OAuth flow, and returns auth data via realtime
        // Make sure your click handler is NOT async/await if popups are blocked on Safari
        const authData = await pb.collection("users").authWithOAuth2({
          provider: "google",
        });

        if (authData) {
          set({
            oauthStatus: "success",
            oauthMessage: "Successfully signed in with Google!",
          });
          checkAuth();
          // Clear success message after 3 seconds
          setTimeout(() => {
            set({ oauthStatus: "idle", oauthMessage: null });
          }, 3000);
        }
      } catch (error: unknown) {
        let errorMessage = "Failed to sign in with Google. Please try again.";

        // If popup is blocked or user cancels, handle gracefully
        if (error instanceof Error) {
          if (
            error.message?.includes("popup") ||
            error.message?.includes("blocked")
          ) {
            errorMessage =
              "Popup blocked. Please allow popups for this site and try again.";
          } else {
            errorMessage = error.message;
          }
        }

        set({ oauthStatus: "error", oauthMessage: errorMessage });
        throw error;
      }
    },

    clearOAuthStatus: () => {
      set({ oauthStatus: "idle", oauthMessage: null });
    },

    setOAuthError: (message: string) => {
      set({ oauthStatus: "error", oauthMessage: message });
    },

    logout: () => {
      pb.authStore.clear();
      checkAuth();
    },

    checkAuth,
  };
});
