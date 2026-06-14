/**
 * Import pb-export/manifest.json + files into PostgreSQL
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import bcrypt from "bcryptjs";
import { newId } from "../src/id.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPORT = path.join(__dirname, "../pb-export");
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(__dirname, "../uploads");

const PLACEHOLDER_HASH = await bcrypt.hash(
  process.env.IMPORT_DEFAULT_PASSWORD || "changeme-import-2026",
  10
);

function ts(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === "string") return new Date(v);
  return new Date();
}

function copyFile(
  collection: string,
  recordId: string,
  filename: string
): string | null {
  const src = path.join(EXPORT, "files", collection, recordId, filename);
  if (!fs.existsSync(src)) return null;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const base = path.basename(filename);
  const destName = `${recordId}_${base}`.replace(/[^a-zA-Z0-9._-]/g, "_");
  const dest = path.join(UPLOAD_DIR, destName);
  if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
  return destName;
}

function imageField(
  collection: string,
  record: Record<string, unknown>,
  field: string
): string | null {
  const val = record[field];
  if (!val || typeof val !== "string") return null;
  return copyFile(collection, record.id as string, val);
}

const manifestPath = path.join(EXPORT, "manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("Run pb-export first:", manifestPath);
  process.exit(1);
}

const { manifest } = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
  manifest: Record<string, Record<string, unknown>[]>;
};

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query("BEGIN");

  await client.query(`
    TRUNCATE audit_logs, submissions, activities, mosque_amenities, mosques, amenities, users CASCADE
  `);

  const users = manifest.users || [];
  for (const u of users) {
    const avatar = imageField("users", u, "avatar");
    await client.query(
      `INSERT INTO users (id, email, password_hash, name, avatar_path, role, verified, created, updated)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email, name = EXCLUDED.name, avatar_path = EXCLUDED.avatar_path,
         role = EXCLUDED.role, verified = EXCLUDED.verified, updated = EXCLUDED.updated`,
      [
        u.id,
        String(u.email).toLowerCase(),
        PLACEHOLDER_HASH,
        u.name ?? null,
        avatar,
        u.role === "admin" ? "admin" : "user",
        Boolean(u.verified),
        ts(u.created),
        ts(u.updated),
      ]
    );
  }
  console.log("users", users.length);

  for (const a of manifest.amenities || []) {
    await client.query(
      `INSERT INTO amenities (id, key, label_bm, label_en, icon, "order", created, updated)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        a.id,
        a.key,
        a.label_bm,
        a.label_en,
        a.icon ?? null,
        Number(a.order) || 0,
        ts(a.created),
        ts(a.updated),
      ]
    );
  }
  console.log("amenities", (manifest.amenities || []).length);

  for (const m of manifest.mosques || []) {
    const img = imageField("mosques", m, "image");
    const createdBy = m.created_by as string;
    await client.query(
      `INSERT INTO mosques (
        id, name, name_bm, address, contact, state, lat, lng,
        description, description_bm, image_path, status, created_by, created, updated
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        m.id,
        m.name,
        m.name_bm ?? null,
        m.address,
        m.contact ?? null,
        m.state,
        Number(m.lat),
        Number(m.lng),
        m.description ?? null,
        m.description_bm ?? null,
        img,
        m.status || "approved",
        createdBy,
        ts(m.created),
        ts(m.updated),
      ]
    );
  }
  console.log("mosques", (manifest.mosques || []).length);

  for (const ma of manifest.mosque_amenities || []) {
    await client.query(
      `INSERT INTO mosque_amenities (id, mosque_id, amenity_id, details, verified, created, updated)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        ma.id,
        ma.mosque_id,
        ma.amenity_id || null,
        JSON.stringify(ma.details ?? {}),
        Boolean(ma.verified),
        ts(ma.created),
        ts(ma.updated),
      ]
    );
  }
  console.log("mosque_amenities", (manifest.mosque_amenities || []).length);

  for (const act of manifest.activities || []) {
    await client.query(
      `INSERT INTO activities (
        id, mosque_id, title, title_bm, description, description_bm,
        type, schedule_json, start_date, end_date, status, created_by, created, updated
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        act.id,
        act.mosque_id,
        act.title,
        act.title_bm ?? null,
        act.description ?? null,
        act.description_bm ?? null,
        act.type,
        JSON.stringify(act.schedule_json ?? {}),
        act.start_date ?? null,
        act.end_date ?? null,
        act.status || "active",
        act.created_by,
        ts(act.created),
        ts(act.updated),
      ]
    );
  }
  console.log("activities", (manifest.activities || []).length);

  for (const s of manifest.submissions || []) {
    const img = imageField("submissions", s, "image");
    await client.query(
      `INSERT INTO submissions (
        id, type, mosque_id, data, status, submitted_by, submitted_at,
        reviewed_by, reviewed_at, rejection_reason, image_path, created, updated
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        s.id,
        s.type,
        s.mosque_id ?? null,
        JSON.stringify(s.data ?? {}),
        s.status,
        s.submitted_by,
        ts(s.submitted_at || s.created),
        s.reviewed_by ?? null,
        s.reviewed_at ? ts(s.reviewed_at) : null,
        s.rejection_reason ?? null,
        img,
        ts(s.created),
        ts(s.updated),
      ]
    );
  }
  console.log("submissions", (manifest.submissions || []).length);

  for (const log of manifest.audit_logs || []) {
    await client.query(
      `INSERT INTO audit_logs (
        id, actor_id, action, entity_type, entity_id, before, after,
        timestamp, ip_address, user_agent, created, updated
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        log.id,
        log.actor_id,
        log.action,
        log.entity_type,
        log.entity_id,
        log.before ? JSON.stringify(log.before) : null,
        log.after ? JSON.stringify(log.after) : null,
        ts(log.timestamp || log.created),
        log.ip_address ?? null,
        log.user_agent ?? null,
        ts(log.created),
        ts(log.updated),
      ]
    );
  }
  console.log("audit_logs", (manifest.audit_logs || []).length);

  await client.query("COMMIT");
  console.log("Import complete. User passwords reset to IMPORT_DEFAULT_PASSWORD (default: changeme-import-2026)");
} catch (e) {
  await client.query("ROLLBACK");
  console.error(e);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}