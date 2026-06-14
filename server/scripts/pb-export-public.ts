/**
 * Export mosques, amenities, mosque_amenities from public PB + mosque images.
 */
import PocketBase from "pocketbase";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pocketbaseFileUrl } from "./pb-file-url.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../pb-export");
const PB_URL = process.env.POCKETBASE_URL || "https://pb.muaz.app";

async function fetchAll(pb: PocketBase, name: string) {
  const items: Record<string, unknown>[] = [];
  let page = 1;
  for (;;) {
    const res = await pb.collection(name).getList(page, 200);
    items.push(...(res.items as Record<string, unknown>[]));
    if (page >= res.totalPages) break;
    page++;
  }
  return items;
}

const pb = new PocketBase(PB_URL);
fs.mkdirSync(path.join(OUT, "files", "mosques"), { recursive: true });

const mosques = await fetchAll(pb, "mosques");
const amenities = await fetchAll(pb, "amenities");
const mosque_amenities = await fetchAll(pb, "mosque_amenities");

let downloaded = 0;
for (const m of mosques) {
  const image = m.image;
  if (typeof image !== "string" || !image) continue;
  const url = pocketbaseFileUrl(
    PB_URL,
    m.collectionId as string,
    m.id as string,
    image
  );
  const dir = path.join(OUT, "files", "mosques", m.id as string);
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, image);
  if (fs.existsSync(dest)) continue;
  const res = await fetch(url);
  if (res.ok) {
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    downloaded++;
  } else {
    console.warn("fail", m.id, image, res.status);
  }
}

const manifest = {
  mosques,
  amenities,
  mosque_amenities,
  users: [],
  activities: [],
  submissions: [],
  audit_logs: [],
};
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(
  path.join(OUT, "manifest.json"),
  JSON.stringify(
    { manifest, exportedAt: new Date().toISOString(), mode: "public" },
    null,
    2
  )
);
console.log(
  `Exported ${mosques.length} mosques (${downloaded} new images), ${amenities.length} amenities, ${mosque_amenities.length} mosque_amenities`
);