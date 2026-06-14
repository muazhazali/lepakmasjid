import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
/** `server/migrations` whether run from `scripts/` (tsx) or `dist/scripts/` (node). */
const serverRoot = existsSync(join(here, "..", "migrations"))
  ? join(here, "..")
  : join(here, "..", "..");
const sql = readFileSync(
  join(serverRoot, "migrations/001_schema.sql"),
  "utf8"
);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(sql);
  console.log("Migration 001 applied");
} finally {
  await client.end();
}