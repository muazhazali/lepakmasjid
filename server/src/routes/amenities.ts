import { Router } from "express";
import { query } from "../db.js";

export function amenitiesRouter() {
  const router = Router();

  router.get("/", async (_req, res) => {
    const r = await query(
      `SELECT * FROM amenities ORDER BY "order" ASC, key ASC`
    );
    res.json({
      items: r.rows.map((row) => ({
        id: row.id,
        collectionId: "amenities",
        key: row.key,
        label_en: row.label_en,
        label_bm: row.label_bm,
        icon: row.icon,
        order: row.order,
        created: (row.created as Date).toISOString(),
        updated: (row.updated as Date).toISOString(),
      })),
    });
  });

  return router;
}