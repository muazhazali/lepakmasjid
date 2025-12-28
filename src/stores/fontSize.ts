import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FontSizeState {
  fontSize: number; // base font size in px
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 16;
const FONT_SIZE_STEP = 2;

export const useFontSizeStore = create<FontSizeState>()(
  persist(
    (set) => ({
      fontSize: DEFAULT_FONT_SIZE,

      setFontSize: (size: number) => {
        const clampedSize = Math.max(
          MIN_FONT_SIZE,
          Math.min(MAX_FONT_SIZE, size)
        );
        set({ fontSize: clampedSize });

        // Update CSS variable
        document.documentElement.style.setProperty(
          "--base-font-size",
          `${clampedSize}px`
        );
      },

      increaseFontSize: () => {
        set((state) => {
          const newSize = Math.min(
            MAX_FONT_SIZE,
            state.fontSize + FONT_SIZE_STEP
          );
          document.documentElement.style.setProperty(
            "--base-font-size",
            `${newSize}px`
          );
          return { fontSize: newSize };
        });
      },

      decreaseFontSize: () => {
        set((state) => {
          const newSize = Math.max(
            MIN_FONT_SIZE,
            state.fontSize - FONT_SIZE_STEP
          );
          document.documentElement.style.setProperty(
            "--base-font-size",
            `${newSize}px`
          );
          return { fontSize: newSize };
        });
      },

      resetFontSize: () => {
        set({ fontSize: DEFAULT_FONT_SIZE });
        document.documentElement.style.setProperty(
          "--base-font-size",
          `${DEFAULT_FONT_SIZE}px`
        );
      },
    }),
    {
      name: "font-size-storage",
      onRehydrateStorage: () => (state) => {
        // Apply font size on rehydration
        if (state) {
          document.documentElement.style.setProperty(
            "--base-font-size",
            `${state.fontSize}px`
          );
        }
      },
    }
  )
);
