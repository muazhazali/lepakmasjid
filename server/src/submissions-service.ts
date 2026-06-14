import type pg from "pg";
import { newId } from "./id.js";
import { logAudit } from "./audit.js";

const ID_RE = /^[a-z0-9]{15}$/;

const ALLOWED_MOSQUE_FIELDS = [
  "name",
  "name_bm",
  "address",
  "contact",
  "state",
  "lat",
  "lng",
  "description",
  "description_bm",
] as const;

export function isValidId(id: string): boolean {
  return ID_RE.test(id);
}

function pickMosqueFields(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of ALLOWED_MOSQUE_FIELDS) {
    if (data[field] !== undefined) out[field] = data[field];
  }
  return out;
}

export async function approveSubmission(
  client: pg.PoolClient,
  submissionId: string,
  reviewedBy: string
): Promise<Record<string, unknown>> {
  const subRes = await client.query(
    `SELECT * FROM submissions WHERE id = $1 FOR UPDATE`,
    [submissionId]
  );
  const submission = subRes.rows[0] as Record<string, unknown> | undefined;
  if (!submission) throw new Error("Submission not found");
  if (submission.status !== "pending") {
    throw new Error("Submission is not pending");
  }

  const before = { ...submission, data: submission.data };
  const data = submission.data as Record<string, unknown>;
  const sanitized = pickMosqueFields(data);
  const type = submission.type as string;
  const submittedBy = submission.submitted_by as string;
  let mosqueId: string | undefined;

  if (type === "new_mosque") {
    mosqueId = newId();
    const imagePath = submission.image_path as string | null;
    await client.query(
      `INSERT INTO mosques (
        id, name, name_bm, address, contact, state, lat, lng,
        description, description_bm, image_path, status, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'approved',$12)`,
      [
        mosqueId,
        sanitized.name,
        sanitized.name_bm ?? null,
        sanitized.address,
        sanitized.contact ?? null,
        sanitized.state,
        sanitized.lat,
        sanitized.lng,
        sanitized.description ?? null,
        sanitized.description_bm ?? null,
        imagePath,
        submittedBy,
      ]
    );
  } else if (type === "edit_mosque") {
    mosqueId = submission.mosque_id as string;
    if (!mosqueId || !isValidId(mosqueId)) {
      throw new Error("Invalid mosque ID");
    }
    const imagePath = submission.image_path as string | null;
    await client.query(
      `UPDATE mosques SET
        name = COALESCE($2, name),
        name_bm = COALESCE($3, name_bm),
        address = COALESCE($4, address),
        contact = COALESCE($5, contact),
        state = COALESCE($6, state),
        lat = COALESCE($7, lat),
        lng = COALESCE($8, lng),
        description = COALESCE($9, description),
        description_bm = COALESCE($10, description_bm),
        image_path = COALESCE($11, image_path),
        updated = now()
      WHERE id = $1`,
      [
        mosqueId,
        sanitized.name ?? null,
        sanitized.name_bm ?? null,
        sanitized.address ?? null,
        sanitized.contact ?? null,
        sanitized.state ?? null,
        sanitized.lat ?? null,
        sanitized.lng ?? null,
        sanitized.description ?? null,
        sanitized.description_bm ?? null,
        imagePath,
      ]
    );
    await client.query(`DELETE FROM activities WHERE mosque_id = $1`, [mosqueId]);
  } else {
    throw new Error("Unknown submission type");
  }

  if (mosqueId) {
    await client.query(`DELETE FROM mosque_amenities WHERE mosque_id = $1`, [
      mosqueId,
    ]);

    const amenities =
      (data.amenities as Array<Record<string, unknown>>) || [];
    const customAmenities =
      (data.customAmenities as Array<Record<string, unknown>>) || [];

    for (const a of amenities) {
      const amenityId = a.amenity_id as string;
      if (!amenityId || !isValidId(amenityId)) continue;
      await client.query(
        `INSERT INTO mosque_amenities (id, mosque_id, amenity_id, details, verified)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          newId(),
          mosqueId,
          amenityId,
          JSON.stringify(a.details ?? {}),
          Boolean(a.verified),
        ]
      );
    }

    for (const custom of customAmenities) {
      const key = String(custom.key ?? "").slice(0, 64);
      if (!key) continue;
      let amenityId: string | null = null;
      const existing = await client.query(
        `SELECT id FROM amenities WHERE key = $1`,
        [key]
      );
      if (existing.rows.length > 0) {
        amenityId = existing.rows[0].id as string;
      } else {
        amenityId = newId();
        await client.query(
          `INSERT INTO amenities (id, key, label_en, label_bm, icon, "order")
           VALUES ($1, $2, $3, $4, $5, 0)`,
          [
            amenityId,
            key,
            String(custom.custom_name_en ?? custom.custom_name ?? key),
            String(custom.custom_name ?? key),
            custom.custom_icon ?? null,
          ]
        );
      }
      await client.query(
        `INSERT INTO mosque_amenities (id, mosque_id, amenity_id, details, verified)
         VALUES ($1, $2, $3, $4, false)`,
        [
          newId(),
          mosqueId,
          amenityId,
          JSON.stringify({
            ...(custom.details as object),
            custom_name: custom.custom_name,
            custom_name_en: custom.custom_name_en,
            custom_icon: custom.custom_icon,
          }),
        ]
      );
    }

    const activities = (data.activities as Array<Record<string, unknown>>) || [];
    for (const act of activities) {
      await client.query(
        `INSERT INTO activities (
          id, mosque_id, title, title_bm, description, description_bm,
          type, schedule_json, start_date, end_date, status, created_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          newId(),
          mosqueId,
          act.title,
          act.title_bm ?? null,
          act.description ?? null,
          act.description_bm ?? null,
          act.type,
          JSON.stringify(act.schedule_json ?? {}),
          act.start_date ?? null,
          act.end_date ?? null,
          act.status ?? "active",
          submittedBy,
        ]
      );
    }
  }

  const updated = await client.query(
    `UPDATE submissions SET
      status = 'approved',
      reviewed_by = $2,
      reviewed_at = now(),
      updated = now()
    WHERE id = $1
    RETURNING *`,
    [submissionId, reviewedBy]
  );

  const row = updated.rows[0];
  await logAudit(reviewedBy, "approve", "submission", submissionId, before, row);
  return row as Record<string, unknown>;
}

export async function rejectSubmission(
  client: pg.PoolClient,
  submissionId: string,
  reviewedBy: string,
  reason: string
): Promise<Record<string, unknown>> {
  const subRes = await client.query(
    `SELECT * FROM submissions WHERE id = $1 FOR UPDATE`,
    [submissionId]
  );
  const submission = subRes.rows[0];
  if (!submission) throw new Error("Submission not found");
  if (submission.status !== "pending") {
    throw new Error("Submission is not pending");
  }

  const updated = await client.query(
    `UPDATE submissions SET
      status = 'rejected',
      reviewed_by = $2,
      reviewed_at = now(),
      rejection_reason = $3,
      updated = now()
    WHERE id = $1
    RETURNING *`,
    [submissionId, reviewedBy, reason]
  );
  const row = updated.rows[0];
  await logAudit(
    reviewedBy,
    "reject",
    "submission",
    submissionId,
    submission,
    row
  );
  return row as Record<string, unknown>;
}