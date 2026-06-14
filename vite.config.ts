import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const apiTarget = process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3000";

const apiProxy = {
  target: apiTarget,
  changeOrigin: true,
  rewrite: (p: string) => p.replace(/^\/api/, ""),
};

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["50f4d4b2fdfc.ngrok-free.app", "lepakmasjid.hrzhkm.xyz"],
    proxy: {
      "/api/sedekah-proxy": {
        target: "https://sedekahjeapi.netlify.app",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/sedekah-proxy/, "/api/masjid"),
      },
      "/api/nominatim": {
        target: "https://nominatim.openstreetmap.org",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/nominatim/, ""),
        headers: {
          "User-Agent": "LepakMasjid/1.0 (community directory search)",
          Referer: "http://localhost:8080",
        },
      },
      "/api/uploads": apiProxy,
      "/api/health": apiProxy,
      "/api/auth": apiProxy,
      "/api/mosques": apiProxy,
      "/api/amenities": apiProxy,
      "/api/submissions": apiProxy,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));