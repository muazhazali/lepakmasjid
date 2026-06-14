import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { mosquesRouter } from "./routes/mosques.js";
import { amenitiesRouter } from "./routes/amenities.js";
import { submissionsRouter } from "./routes/submissions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface AppOptions {
  /** Base URL for serializers (absolute links when needed). */
  publicUrl: string;
  uploadsDir?: string;
  /** Extra CORS origins (e.g. production site URL). */
  corsOrigins?: string[];
}

export function createApp(options: AppOptions) {
  const { publicUrl, corsOrigins = [] } = options;
  const uploadsDir =
    options.uploadsDir ||
    (process.env.UPLOAD_DIR
      ? path.resolve(process.env.UPLOAD_DIR)
      : path.resolve(__dirname, "../../uploads"));

  const app = express();
  const originList = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    process.env.VITE_APP_URL,
    process.env.APP_URL,
    publicUrl,
    ...corsOrigins,
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: originList,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use("/uploads", express.static(uploadsDir));

  app.get("/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ ok: false, error: String(e) });
    }
  });

  app.use("/auth", authRouter(publicUrl));
  app.use("/mosques", mosquesRouter(publicUrl));
  app.use("/amenities", amenitiesRouter());
  app.use("/submissions", submissionsRouter(publicUrl, uploadsDir));

  return app;
}