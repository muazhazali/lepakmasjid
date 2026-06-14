/**
 * Full export (admin): all collections + files.
 * Env: POCKETBASE_URL, POCKETBASE_ADMIN_EMAIL, POCKETBASE_ADMIN_PASSWORD
 */
import "dotenv/config";
import PocketBase from "pocketbase";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pocketbaseFileUrl } from "./pb-file-url.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../pb-export");
const PB_URL = process.env.POCKETBASE_URL || "https://pb.muaz.app";

const COLLECTIONS = [
  "users",
  "amenities",
  "mosques",
  "mosque_amenities",
  "activities",
  "submissions",
  "audit_logs",
] as const;

const FILE_FIELDS: Record<string, string[]> = {
  users: ["avatar"],
  mosques: ["image"],
  submissions: ["image"],
};

async function fetchAll(pb: PocketBase, name: string) {
  const items: Record<string, unknown>[] = [];
  let page = 1;
  for (;;) {
    const res = await pb.collection(name).getList(page, 200, { sort: "-created" });
    items.push(...(res.items as Record<string, unknown>[]));
    if (page >= res.totalPages) break;
    page++;
  }
  return items;
}

async function downloadFile(
  collection: string,
  record: Record<string, unknown>,
  field: string
) {
  const val = record[field];
  if (!val || typeof val !== "string") return null;
  const filename = val;
  const recordId = record.id as string;
  const collectionId = record.collectionId as string;
  const url = pocketbaseFileUrl(PB_URL, collectionId, recordId, filename);
  const dir = path.join(OUT, "files", collection, recordId);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, filename);
  if (fs.existsSync(dest)) return filename;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  skip ${collection}/${recordId}/${filename}: ${res.status}`);
    return null;
  }
  fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  return filename;
}

const email = process.env.POCKETBASE_ADMIN_EMAIL;
const password = process.env.POCKETBASE_ADMIN_PASSWORD;
if (!email || !password) {
  console.error("Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD");
  process.exit(1);
}

const pb = new PocketBase(PB_URL);
await pb.collection("_superusers").authWithPassword(email, password);
console.log("Authenticated to", PB_URL);

fs.mkdirSync(OUT, { recursive: true });
const manifest: Record<string, unknown[]> = {};

for (const name of COLLECTIONS) {
  console.log(`Export ${name}...`);
  const items = await fetchAll(pb, name);
  for (const row of items) {
    for (const field of FILE_FIELDS[name] || []) {
      await downloadFile(name, row, field);
    }
  }
  manifest[name] = items;
  console.log(`  ${items.length} records`);
}

fs.writeFileSync(
  path.join(OUT, "manifest.json"),
  JSON.stringify({ exportedAt: new Date().toISOString(), pbUrl: PB_URL, manifest }, null, 2)
);
console.log("Wrote manifest.json — run pnpm pb:import for full DB replace");