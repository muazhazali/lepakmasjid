import { Router } from "express";
import type { Response } from "express";
import { query } from "../db.js";
import { mosqueRow } from "../serializers.js";
import {
  createOptionalAuth,
  createRequireAuth,
  requireAdmin,
  type AuthedRequest,
} from "../auth.js";

const MALAYSIAN_STATES = new Set([
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Penang",
  "Perak", "Perlis", "Sabah", "Sarawak", "Selangor", "Terengganu",
  "WP Kuala Lumpur", "WP Labuan", "WP Putrajaya",
]);

function sanitizeSearch(term: string): string {
  return term.replace(/[%_\\"']/g, "").trim().slice(0, 100);
}

async function attachAmenities(
  mosqueIds: string[],
  apiBase: string
): Promise<Map<string, unknown[]>> {
  const map = new Map<string, unknown[]>();
  if (mosqueIds.length === 0) return map;
  const r = await query(
    `SELECT ma.*, a.key, a.label_en, a.label_bm, a.icon, a."order"
     FROM mosque_amenities ma
     LEFT JOIN amenities a ON a.id = ma.amenity_id
     WHERE ma.mosque_id = ANY($1::text[])`,
    [mosqueIds]
  );
  for (const row of r.rows) {
    const mid = row.mosque_id as string;
    const list = map.get(mid) ?? [];
    list.push({
      id: row.amenity_id ?? row.id,
      collectionId: "amenities",
      key: row.key,
      label_en: row.label_en,
      label_bm: row.label_bm,
      icon: row.icon,
      order: row.order,
      details: row.details,
      verified: row.verified,
    });
    map.set(mid, list);
  }
  return map;
}

async function attachActivities(mosqueIds: string[]): Promise<Map<string, unknown[]>> {
  const map = new Map<string, unknown[]>();
  if (mosqueIds.length === 0) return map;
  const r = await query(
    `SELECT * FROM activities WHERE mosque_id = ANY($1::text[]) AND status = 'active'`,
    [mosqueIds]
  );
  for (const row of r.rows) {
    const mid = row.mosque_id as string;
    const list = map.get(mid) ?? [];
    list.push({
      ...row,
      collectionId: "activities",
      schedule_json: row.schedule_json,
      created: (row.created as Date).toISOString(),
      updated: (row.updated as Date).toISOString(),
    });
    map.set(mid, list);
  }
  return map;
}

function enrich(
  row: Record<string, unknown>,
  apiBase: string,
  amenities: unknown[],
  activities: unknown[]
) {
  return {
    ...mosqueRow(row, apiBase),
    amenities,
    activities,
  };
}

export function mosquesRouter(apiBase: string) {
  const router = Router();
  const optionalAuth = createOptionalAuth(apiBase);
  const requireAuth = createRequireAuth(apiBase);

  router.get("/", optionalAuth, async (req: AuthedRequest, res: Response) => {
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const perPage = Math.min(
      50,
      Math.max(1, parseInt(String(req.query.perPage || "12"), 10) || 12)
    );
    const state = req.query.state as string | undefined;
    const search = req.query.search as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;
    const amenityFilter = req.query.amenities as string | undefined;
    const amenityIds = amenityFilter
      ? amenityFilter.split(",").filter(Boolean)
      : [];

    const isAdmin = req.user?.role === "admin";
    const params: unknown[] = [];
    const where: string[] = [];
    if (!isAdmin) {
      where.push(`status = 'approved'`);
    }
    if (state && state !== "all" && MALAYSIAN_STATES.has(state)) {
      params.push(state);
      where.push(`state = $${params.length}`);
    }
    if (search?.trim()) {
      const s = `%${sanitizeSearch(search)}%`;
      params.push(s, s, s);
      const i = params.length;
      where.push(
        `(name ILIKE $${i - 2} OR address ILIKE $${i - 1} OR state ILIKE $${i})`
      );
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const all = await query<Record<string, unknown>>(
      `SELECT * FROM mosques ${whereSql} ORDER BY created DESC LIMIT 500`,
      params
    );
    let rows = all.rows;

    if (amenityIds.length > 0 || sortBy === "most_amenities") {
      const ids = rows.map((r) => r.id as string);
      const amap = await attachAmenities(ids, apiBase);
      rows = rows.map((r) => ({
        ...r,
        _amenities: amap.get(r.id as string) ?? [],
      }));
      if (amenityIds.length > 0) {
        rows = rows.filter((r) => {
          const idsSet = new Set(
            ((r._amenities as { id: string }[]) ?? []).map((a) => a.id)
          );
          return amenityIds.every((id) => idsSet.has(id));
        });
      }
      if (sortBy === "most_amenities") {
        rows.sort(
          (a, b) =>
            ((b._amenities as unknown[])?.length ?? 0) -
            ((a._amenities as unknown[])?.length ?? 0)
        );
      }
    } else if (sortBy === "alphabetical") {
      rows.sort((a, b) =>
        String(a.name).localeCompare(String(b.name))
      );
    }

    const totalItems = rows.length;
    const totalPages = Math.ceil(totalItems / perPage) || 1;
    const slice = rows.slice((page - 1) * perPage, page * perPage);
    const sliceIds = slice.map((r) => r.id as string);
    const amap =
      amenityIds.length > 0 || sortBy === "most_amenities"
        ? new Map(
            slice.map((r) => [r.id as string, (r._amenities as unknown[]) ?? []])
          )
        : await attachAmenities(sliceIds, apiBase);
    const actmap = await attachActivities(sliceIds);

    const items = slice.map((r) =>
      enrich(
        r,
        apiBase,
        (r._amenities as unknown[]) ?? amap.get(r.id as string) ?? [],
        actmap.get(r.id as string) ?? []
      )
    );

    res.json({ items, page, perPage, totalItems, totalPages });
  });

  router.get("/all", optionalAuth, async (req: AuthedRequest, res) => {
    const isAdmin = req.user?.role === "admin";
    const state = req.query.state as string | undefined;
    const params: unknown[] = [];
    const where: string[] = [];
    if (!isAdmin) where.push(`status = 'approved'`);
    if (state && state !== "all" && MALAYSIAN_STATES.has(state)) {
      params.push(state);
      where.push(`state = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const r = await query(`SELECT * FROM mosques ${whereSql}`, params);
    const ids = r.rows.map((row) => row.id as string);
    const amap = await attachAmenities(ids, apiBase);
    const items = r.rows.map((row) =>
      enrich(row as Record<string, unknown>, apiBase, amap.get(row.id as string) ?? [], [])
    );
    res.json({ items });
  });

  router.get(
    "/admin/all",
    requireAuth,
    requireAdmin,
    async (_req, res) => {
      const r = await query(`SELECT * FROM mosques ORDER BY created DESC`);
      res.json({
        items: r.rows.map((row) =>
          mosqueRow(row as Record<string, unknown>, apiBase)
        ),
      });
    }
  );

  router.get("/:id", optionalAuth, async (req: AuthedRequest, res) => {
    const r = await query(`SELECT * FROM mosques WHERE id = $1`, [req.params.id]);
    const row = r.rows[0] as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    if (row.status !== "approved" && req.user?.role !== "admin") {
      res.status(404).json({ message: "Not found" });
      return;
    }
    const amap = await attachAmenities([req.params.id], apiBase);
    const actmap = await attachActivities([req.params.id]);
    res.json({
      record: enrich(
        row,
        apiBase,
        amap.get(req.params.id) ?? [],
        actmap.get(req.params.id) ?? []
      ),
    });
  });

  return router;
}