import { create } from "zustand";
import { persist } from "zustand/middleware";

type Language = "en" | "bm";

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => {
      // Detect language from URL or browser
      const detectLanguage = (): Language => {
        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get("lang");
        if (langParam === "bm" || langParam === "en") {
          return langParam;
        }

        // Check localStorage
        const stored = localStorage.getItem("language");
        if (stored === "bm" || stored === "en") {
          return stored;
        }

        // Browser detection
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith("ms")) {
          return "bm";
        }

        return "en";
      };

      return {
        language: detectLanguage(),

        setLanguage: (lang: Language) => {
          set({ language: lang });

          // Update URL parameter
          const url = new URL(window.location.href);
          url.searchParams.set("lang", lang);
          window.history.replaceState({}, "", url.toString());

          // Persist to localStorage (handled by persist middleware)
        },
      };
    },
    {
      name: "language-storage",
    }
  )
);
