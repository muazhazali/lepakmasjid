import "dotenv/config";
import { newId } from "../src/id.js";
import { query, pool } from "../src/db.js";
import { hashPassword } from "../src/auth.js";

const AMENITIES = [
  { key: "wifi", label_en: "Free WiFi", label_bm: "WiFi Percuma", icon: "wifi", order: 1 },
  { key: "working_space", label_en: "Working Space", label_bm: "Ruang Kerja", icon: "laptop", order: 2 },
  { key: "library", label_en: "Library", label_bm: "Perpustakaan", icon: "book", order: 3 },
  { key: "oku_access", label_en: "OKU Friendly", label_bm: "Mesra OKU", icon: "accessibility", order: 4 },
  { key: "parking", label_en: "Parking", label_bm: "Tempat Letak Kereta", icon: "car", order: 5 },
  { key: "wudhu", label_en: "Wudhu Area", label_bm: "Tempat Wuduk", icon: "droplet", order: 6 },
  { key: "women_area", label_en: "Women Section", label_bm: "Ruang Wanita", icon: "users", order: 7 },
  { key: "ac", label_en: "Air Conditioned", label_bm: "Berhawa Dingin", icon: "wind", order: 8 },
  { key: "cafe", label_en: "Café/Canteen", label_bm: "Kafe/Kantin", icon: "utensils", order: 9 },
  { key: "quran_class", label_en: "Quran Classes", label_bm: "Kelas Al-Quran", icon: "graduation-cap", order: 10 },
];

const SAMPLE_MOSQUES = [
  {
    name: "Masjid Negara",
    address: "Jalan Perdana, Kuala Lumpur",
    state: "WP Kuala Lumpur",
    lat: 3.1419,
    lng: 101.6865,
    status: "approved" as const,
  },
  {
    name: "Masjid Jamek Sultan Abdul Samad",
    address: "Jalan Tun Perak, Kuala Lumpur",
    state: "WP Kuala Lumpur",
    lat: 3.149,
    lng: 101.6953,
    status: "approved" as const,
  },
];

const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@lepakmasjid.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD || "adminadmin";

const existing = await query(`SELECT id FROM users WHERE email = $1`, [adminEmail]);
let adminId: string;
if (existing.rows.length === 0) {
  adminId = newId();
  const hash = await hashPassword(adminPassword);
  await query(
    `INSERT INTO users (id, email, password_hash, name, role, verified)
     VALUES ($1, $2, $3, $4, 'admin', true)`,
    [adminId, adminEmail, hash, "Admin"]
  );
  console.log(`Admin user: ${adminEmail} / ${adminPassword}`);
} else {
  adminId = existing.rows[0].id as string;
}

for (const a of AMENITIES) {
  const found = await query(`SELECT id FROM amenities WHERE key = $1`, [a.key]);
  if (found.rows.length === 0) {
    await query(
      `INSERT INTO amenities (id, key, label_en, label_bm, icon, "order")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newId(), a.key, a.label_en, a.label_bm, a.icon, a.order]
    );
  }
}

const mosqueCount = await query(`SELECT COUNT(*)::int AS c FROM mosques`);
if ((mosqueCount.rows[0].c as number) === 0) {
  for (const m of SAMPLE_MOSQUES) {
    await query(
      `INSERT INTO mosques (id, name, address, state, lat, lng, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [newId(), m.name, m.address, m.state, m.lat, m.lng, m.status, adminId]
    );
  }
  console.log(`Seeded ${SAMPLE_MOSQUES.length} mosques`);
}

console.log("Seed complete");
await pool.end();