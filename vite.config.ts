import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/

// add allowed host https://50f4d4b2fdfc.ngrok-free.app

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["50f4d4b2fdfc.ngrok-free.app", "lepakmasjid.hrzhkm.xyz"],
    proxy: {
      '/api/sedekah-proxy': {
        target: 'https://sedekahjeapi.netlify.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sedekah-proxy/, '/api/masjid'),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
