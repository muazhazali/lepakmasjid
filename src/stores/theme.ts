import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const getSystemTheme = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const applyThemeToDOM = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const isDark = theme === "dark" || (theme === "system" && getSystemTheme());
  document.documentElement.classList.toggle("dark", isDark);
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => {
      // Set up system theme listener (only once)
      let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;

      const setupSystemThemeListener = () => {
        if (typeof window === "undefined") return;

        // Remove existing listener if any
        if (systemThemeListener) {
          window
            .matchMedia("(prefers-color-scheme: dark)")
            .removeEventListener("change", systemThemeListener);
        }

        // Add new listener
        systemThemeListener = () => {
          if (get().theme === "system") {
            const isDark = getSystemTheme();
            if (typeof document !== "undefined") {
              document.documentElement.classList.toggle("dark", isDark);
            }
            set({ isDark });
          }
        };

        window
          .matchMedia("(prefers-color-scheme: dark)")
          .addEventListener("change", systemThemeListener);
      };

      return {
        theme: "system",
        isDark: getSystemTheme(),

        setTheme: (theme: Theme) => {
          const isDark =
            theme === "dark" || (theme === "system" && getSystemTheme());

          // Apply to DOM
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", isDark);
          }

          // Update state
          set({ theme, isDark });

          // Update system theme listener
          if (theme === "system") {
            setupSystemThemeListener();
          } else if (systemThemeListener && typeof window !== "undefined") {
            window
              .matchMedia("(prefers-color-scheme: dark)")
              .removeEventListener("change", systemThemeListener);
            systemThemeListener = null;
          }
        },
      };
    },
    {
      name: "theme-storage",
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== "undefined") {
          // Apply theme to DOM after rehydration
          const theme = state.theme || "system";
          applyThemeToDOM(theme);

          // Update isDark based on current theme
          const isDark =
            theme === "dark" || (theme === "system" && getSystemTheme());
          if (state.isDark !== isDark) {
            useThemeStore.setState({ isDark });
          }

          // Set up system theme listener if needed
          if (theme === "system") {
            setTimeout(() => {
              const mediaQuery = window.matchMedia(
                "(prefers-color-scheme: dark)"
              );
              const listener = () => {
                const currentState = useThemeStore.getState();
                if (currentState.theme === "system") {
                  const isDark = getSystemTheme();
                  document.documentElement.classList.toggle("dark", isDark);
                  useThemeStore.setState({ isDark });
                }
              };
              mediaQuery.addEventListener("change", listener);
            }, 0);
          }
        }
      },
    }
  )
);

// Initialize theme on module load
if (typeof window !== "undefined") {
  // Apply initial theme after a short delay to ensure DOM is ready
  setTimeout(() => {
    const state = useThemeStore.getState();
    applyThemeToDOM(state.theme || "system");
  }, 0);
}
