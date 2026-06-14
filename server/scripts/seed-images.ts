import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query, pool } from "../src/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir =
  process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");

fs.mkdirSync(uploadDir, { recursive: true });

/** Minimal valid JPEG (1x1) — avoids external fetch in restricted networks */
const MINI_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A0T//2Q==",
  "base64"
);

const files = ["seed-masjid-negara.jpg", "seed-masjid-jamek.jpg", "seed-placeholder.jpg"];

for (const file of files) {
  const dest = path.join(uploadDir, file);
  if (!fs.existsSync(dest)) {
    fs.writeFileSync(dest, MINI_JPEG);
    console.log("wrote", file);
  }
}

await query(
  `UPDATE mosques SET image_path = 'seed-masjid-negara.jpg', updated = now()
   WHERE name = 'Masjid Negara'`
);
await query(
  `UPDATE mosques SET image_path = 'seed-masjid-jamek.jpg', updated = now()
   WHERE name = 'Masjid Jamek Sultan Abdul Samad'`
);
await query(
  `UPDATE mosques SET image_path = 'seed-placeholder.jpg', updated = now()
   WHERE image_path IS NULL OR image_path = ''`
);

console.log("Mosque images backfilled");
await pool.end();