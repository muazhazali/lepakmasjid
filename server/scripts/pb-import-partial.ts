/**
 * Import public PB export (mosques, amenities, mosque_amenities + images).
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPORT = path.join(__dirname, "../pb-export");
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");

function ts(v: unknown): Date {
  return typeof v === "string" ? new Date(v) : new Date();
}

function copyFile(collection: string, recordId: string, filename: string): string | null {
  const src = path.join(EXPORT, "files", collection, recordId, filename);
  if (!fs.existsSync(src)) return null;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const destName = `${recordId}_${path.basename(filename)}`.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dest = path.join(UPLOAD_DIR, destName);
  if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
  return destName;
}

const { manifest } = JSON.parse(
  fs.readFileSync(path.join(EXPORT, "manifest.json"), "utf8")
) as { manifest: Record<string, Record<string, unknown>[]> };

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query("BEGIN");

  const admin = await client.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
  const fallbackUser = admin.rows[0]?.id as string;
  if (!fallbackUser) throw new Error("No admin user — run pnpm seed first");

  await client.query(`DELETE FROM mosque_amenities`);
  await client.query(`DELETE FROM activities`);
  await client.query(`DELETE FROM mosques`);
  await client.query(`DELETE FROM amenities`);

  for (const a of manifest.amenities || []) {
    await client.query(
      `INSERT INTO amenities (id, key, label_bm, label_en, icon, "order", created, updated)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        a.id, a.key, a.label_bm, a.label_en, a.icon ?? null,
        Number(a.order) || 0, ts(a.created), ts(a.updated),
      ]
    );
  }

  const mosqueIds = new Set((manifest.mosques || []).map((m) => m.id as string));

  for (const m of manifest.mosques || []) {
    let createdBy = m.created_by as string;
    const u = await client.query(`SELECT id FROM users WHERE id = $1`, [createdBy]);
    if (u.rows.length === 0) createdBy = fallbackUser;

    const img =
      typeof m.image === "string" && m.image
        ? copyFile("mosques", m.id as string, m.image)
        : null;

    await client.query(
      `INSERT INTO mosques (id, name, name_bm, address, contact, state, lat, lng, description, description_bm, image_path, status, created_by, created, updated)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        m.id, m.name, m.name_bm ?? null, m.address, m.contact ?? null, m.state,
        Number(m.lat), Number(m.lng), m.description ?? null, m.description_bm ?? null,
        img, m.status || "approved", createdBy, ts(m.created), ts(m.updated),
      ]
    );
  }

  for (const ma of manifest.mosque_amenities || []) {
    if (!mosqueIds.has(ma.mosque_id as string)) continue;
    await client.query(
      `INSERT INTO mosque_amenities (id, mosque_id, amenity_id, details, verified, created, updated)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        ma.id, ma.mosque_id, ma.amenity_id || null,
        JSON.stringify(ma.details ?? {}), Boolean(ma.verified),
        ts(ma.created), ts(ma.updated),
      ]
    );
  }

  await client.query("COMMIT");
  const withImg = await client.query(
    `SELECT COUNT(*)::int AS c FROM mosques WHERE image_path IS NOT NULL`
  );
  console.log(
    "Imported",
    (manifest.mosques || []).length,
    "mosques,",
    (manifest.mosque_amenities || []).length,
    "amenity links,",
    withImg.rows[0].c,
    "mosques with photos"
  );
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}