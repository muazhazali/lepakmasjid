import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Repo root: server/dist/src → ../../../ */
const repoRoot = path.resolve(__dirname, "../../..");

const PORT = parseInt(process.env.PORT || "8080", 10);
const PUBLIC_URL = (process.env.PUBLIC_URL || process.env.APP_URL || "").replace(
  /\/$/,
  ""
);
const appUrl = (process.env.APP_URL || PUBLIC_URL || "").replace(/\/$/, "");

if (!PUBLIC_URL) {
  console.error(
    "Set PUBLIC_URL (and APP_URL) to your public site URL, e.g. https://lepakmasjid.example.com"
  );
  process.exit(1);
}

const staticDir =
  process.env.STATIC_DIR || path.join(repoRoot, "dist");

const uploadsDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, "../../uploads");

const api = createApp({
  publicUrl: PUBLIC_URL,
  corsOrigins: appUrl ? [appUrl] : [],
  uploadsDir,
});

const app = express();

app.use("/api", (req, _res, next) => {
  const rest = req.url.startsWith("/") ? req.url : `/${req.url}`;
  req.url = rest === "/" ? "/" : rest;
  next();
}, api);

app.use(express.static(staticDir, { index: false }));

app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(staticDir, "index.html"), (err) => {
    if (err) next(err);
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Production server on 0.0.0.0:${PORT}`);
  console.log(`  static: ${staticDir}`);
  console.log(`  uploads: ${uploadsDir}`);
  console.log(`  public: ${PUBLIC_URL}`);
});