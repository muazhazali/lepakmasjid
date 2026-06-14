import "dotenv/config";
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
const PORT = parseInt(process.env.PORT || "3000", 10);
const PUBLIC_URL = process.env.PUBLIC_URL || `http://127.0.0.1:${PORT}`;
const uploadsDir =
  process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://192.168.1.113:8080",
      process.env.VITE_APP_URL,
    ].filter(Boolean) as string[],
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

app.use("/auth", authRouter(PUBLIC_URL));
app.use("/mosques", mosquesRouter(PUBLIC_URL));
app.use("/amenities", amenitiesRouter());
app.use("/submissions", submissionsRouter(PUBLIC_URL, uploadsDir));

app.listen(PORT, () => {
  console.log(`API listening on ${PORT} (public ${PUBLIC_URL})`);
});