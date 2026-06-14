import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { z } from "zod";
import { pool, query } from "../db.js";
import { newId } from "../id.js";
import {
  createRequireAuth,
  requireAdmin,
  type AuthedRequest,
} from "../auth.js";
import {
  approveSubmission,
  rejectSubmission,
  isValidId,
} from "../submissions-service.js";
import { logAudit } from "../audit.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function submissionToClient(
  row: Record<string, unknown>,
  apiBase: string
): Record<string, unknown> {
  const imagePath = row.image_path as string | null;
  return {
    id: row.id,
    collectionId: "submissions",
    type: row.type,
    mosque_id: row.mosque_id ?? undefined,
    data: row.data,
    status: row.status,
    submitted_by: row.submitted_by,
    submitted_at: (row.submitted_at as Date).toISOString(),
    reviewed_by: row.reviewed_by ?? undefined,
    reviewed_at: row.reviewed_at
      ? (row.reviewed_at as Date).toISOString()
      : undefined,
    rejection_reason: row.rejection_reason ?? undefined,
    image: imagePath ? `/api/uploads/${imagePath}` : undefined,
    created: (row.created as Date).toISOString(),
    updated: (row.updated as Date).toISOString(),
  };
}

export function submissionsRouter(apiBase: string, uploadDir: string) {
  const router = Router();
  const requireAuth = createRequireAuth(apiBase);

  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${newId()}${ext}`);
    },
  });
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  router.get("/", requireAuth, requireAdmin, async (req, res) => {
    const status = req.query.status as string | undefined;
    const allowed = ["pending", "approved", "rejected"];
    const params: unknown[] = [];
    let sql = `SELECT * FROM submissions`;
    if (status && allowed.includes(status)) {
      params.push(status);
      sql += ` WHERE status = $1`;
    }
    sql += ` ORDER BY submitted_at DESC LIMIT 100`;
    const r = await query(sql, params);
    res.json({
      items: r.rows.map((row) =>
        submissionToClient(row as Record<string, unknown>, apiBase)
      ),
    });
  });

  router.get("/mine", requireAuth, async (req: AuthedRequest, res) => {
    const status = req.query.status as string | undefined;
    const allowed = ["pending", "approved", "rejected"];
    const params: unknown[] = [req.user!.id];
    let sql = `SELECT * FROM submissions WHERE submitted_by = $1`;
    if (status && allowed.includes(status)) {
      params.push(status);
      sql += ` AND status = $2`;
    }
    sql += ` ORDER BY submitted_at DESC LIMIT 100`;
    const r = await query(sql, params);
    res.json({
      items: r.rows.map((row) =>
        submissionToClient(row as Record<string, unknown>, apiBase)
      ),
    });
  });

  router.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
    if (!isValidId(req.params.id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }
    const r = await query(`SELECT * FROM submissions WHERE id = $1`, [
      req.params.id,
    ]);
    const row = r.rows[0] as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    if (
      req.user!.role !== "admin" &&
      row.submitted_by !== req.user!.id
    ) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    res.json({ record: submissionToClient(row, apiBase) });
  });

  router.post(
    "/",
    requireAuth,
    upload.single("image"),
    async (req: AuthedRequest, res) => {
      try {
        const body = req.body as Record<string, string>;
        const type = body.type;
        if (type !== "new_mosque" && type !== "edit_mosque") {
          res.status(400).json({ message: "Invalid type" });
          return;
        }
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(body.data || "{}") as Record<string, unknown>;
        } catch {
          res.status(400).json({ message: "Invalid data JSON" });
          return;
        }

        const mosqueId =
          type === "edit_mosque" ? body.mosque_id : body.mosque_id || null;
        if (type === "edit_mosque" && (!mosqueId || !isValidId(mosqueId))) {
          res.status(400).json({ message: "Invalid mosque_id" });
          return;
        }

        const id = newId();
        const imagePath = req.file ? path.basename(req.file.path) : null;
        const r = await query(
          `INSERT INTO submissions (
            id, type, mosque_id, data, status, submitted_by, submitted_at, image_path
          ) VALUES ($1,$2,$3,$4,'pending',$5,now(),$6)
          RETURNING *`,
          [
            id,
            type,
            mosqueId,
            JSON.stringify(data),
            req.user!.id,
            imagePath,
          ]
        );
        const row = r.rows[0] as Record<string, unknown>;
        await logAudit(req.user!.id, "create", "submission", id, null, row);
        res.status(201).json({
          record: submissionToClient(row, apiBase),
        });
      } catch (e) {
        res.status(500).json({ message: String(e) });
      }
    }
  );

  router.post(
    "/:id/approve",
    requireAuth,
    requireAdmin,
    async (req: AuthedRequest, res) => {
      if (!isValidId(req.params.id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const row = await approveSubmission(
          client,
          req.params.id,
          req.user!.id
        );
        await client.query("COMMIT");
        res.json({ record: submissionToClient(row, apiBase) });
      } catch (e) {
        await client.query("ROLLBACK");
        res.status(400).json({ message: String(e) });
      } finally {
        client.release();
      }
    }
  );

  const rejectSchema = z.object({ reason: z.string().min(1).max(2000) });

  router.post(
    "/:id/reject",
    requireAuth,
    requireAdmin,
    async (req: AuthedRequest, res) => {
      if (!isValidId(req.params.id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
      }
      const parsed = rejectSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: "Reason required" });
        return;
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const row = await rejectSubmission(
          client,
          req.params.id,
          req.user!.id,
          parsed.data.reason
        );
        await client.query("COMMIT");
        res.json({ record: submissionToClient(row, apiBase) });
      } catch (e) {
        await client.query("ROLLBACK");
        res.status(400).json({ message: String(e) });
      } finally {
        client.release();
      }
    }
  );

  return router;
}