import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { createApp } from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = parseInt(process.env.PORT || "3000", 10);
const PUBLIC_URL = process.env.PUBLIC_URL || `http://127.0.0.1:${PORT}`;

const uploadsDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, "../../uploads");

const app = createApp({ publicUrl: PUBLIC_URL, uploadsDir });

app.listen(PORT, () => {
  console.log(`API listening on ${PORT} (public ${PUBLIC_URL})`);
});
