import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

// Initialize font size on app load (default 16px)
const storedFontSize = localStorage.getItem("font-size-storage");
if (storedFontSize) {
  try {
    const parsed = JSON.parse(storedFontSize);
    const fontSize = parsed?.state?.fontSize || 16;
    document.documentElement.style.setProperty(
      "--base-font-size",
      `${fontSize}px`
    );
  } catch {
    document.documentElement.style.setProperty("--base-font-size", "16px");
  }
} else {
  document.documentElement.style.setProperty("--base-font-size", "16px");
}

createRoot(document.getElementById("root")!).render(<App />);
