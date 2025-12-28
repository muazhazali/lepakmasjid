import PocketBase from "pocketbase";

// Require environment variable - no hardcoded fallback for security
const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL;

if (!POCKETBASE_URL) {
  throw new Error(
    "VITE_POCKETBASE_URL environment variable is required. " +
      "Please set it in your .env.local file or deployment environment variables."
  );
}

// Create a singleton instance
let pbInstance: PocketBase | null = null;

export const getPocketBase = (): PocketBase => {
  if (!pbInstance) {
    pbInstance = new PocketBase(POCKETBASE_URL);

    // Enable auto-cancellation for requests
    pbInstance.autoCancellation(false);

    // Load auth from localStorage if available
    const authData = localStorage.getItem("pocketbase_auth");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        pbInstance.authStore.save(parsed.token, parsed.model);
      } catch (e) {
        // Invalid auth data, clear it
        localStorage.removeItem("pocketbase_auth");
      }
    }

    // Save auth to localStorage on change
    pbInstance.authStore.onChange((token, model) => {
      if (token && model) {
        localStorage.setItem(
          "pocketbase_auth",
          JSON.stringify({ token, model })
        );
      } else {
        localStorage.removeItem("pocketbase_auth");
      }
    });
  }

  return pbInstance;
};

// Export the instance for direct use
export const pb = getPocketBase();

// Helper to check if user is authenticated
export const isAuthenticated = (): boolean => {
  return pb.authStore.isValid;
};

// Helper to get current user
export const getCurrentUser = () => {
  return pb.authStore.model;
};

// Helper to check if user is admin
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === "admin" || false;
};

// Helper to logout
export const logout = (): void => {
  pb.authStore.clear();
};

// Helper to check PocketBase connection health
export const checkConnection = async (): Promise<{
  connected: boolean;
  error?: string;
}> => {
  try {
    await pb.health.check();
    return { connected: true };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to connect to PocketBase";
    return {
      connected: false,
      error: errorMessage,
    };
  }
};

// Helper to get PocketBase URL (for debugging)
export const getPocketBaseUrl = (): string => {
  return POCKETBASE_URL;
};
