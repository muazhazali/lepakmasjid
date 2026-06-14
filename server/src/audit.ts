import { query } from "./db.js";
import { newId } from "./id.js";

export async function logAudit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  before: unknown,
  after: unknown,
  meta?: { ip?: string; userAgent?: string }
) {
  await query(
    `INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, before, after, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      newId(),
      actorId,
      action,
      entityType,
      entityId,
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
      meta?.ip ?? null,
      meta?.userAgent ?? null,
    ]
  );
}