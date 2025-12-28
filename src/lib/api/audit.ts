import { pb } from "../pocketbase";
import type { AuditLog } from "@/types";
import {
  validateAction,
  validateEntityType,
  validateISODate,
  validateRecordId,
} from "../validation";
import { sanitizeError } from "../error-handler";

export const auditApi = {
  // List audit logs (admin only)
  async list(filters?: {
    action?: string;
    entityType?: string;
    actorId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLog[]> {
    const filterParts: string[] = [];

    if (filters?.action) {
      // Validate action against allowlist to prevent filter injection
      if (!validateAction(filters.action)) {
        throw new Error("Invalid action parameter");
      }
      filterParts.push(`action = "${filters.action}"`);
    }

    if (filters?.entityType) {
      // Validate entity type against allowlist to prevent filter injection
      if (!validateEntityType(filters.entityType)) {
        throw new Error("Invalid entity type parameter");
      }
      filterParts.push(`entity_type = "${filters.entityType}"`);
    }

    if (filters?.actorId) {
      // Validate actor ID format to prevent injection
      if (!validateRecordId(filters.actorId)) {
        throw new Error("Invalid actor ID format");
      }
      filterParts.push(`actor_id = "${filters.actorId}"`);
    }

    if (filters?.startDate) {
      // Validate ISO date format to prevent injection
      if (!validateISODate(filters.startDate)) {
        throw new Error("Invalid start date format");
      }
      filterParts.push(`timestamp >= "${filters.startDate}"`);
    }

    if (filters?.endDate) {
      // Validate ISO date format to prevent injection
      if (!validateISODate(filters.endDate)) {
        throw new Error("Invalid end date format");
      }
      filterParts.push(`timestamp <= "${filters.endDate}"`);
    }

    const result = await pb.collection("audit_logs").getList(1, 100, {
      filter: filterParts.length > 0 ? filterParts.join(" && ") : undefined,
      sort: "-timestamp",
    });
    return result.items as unknown as AuditLog[];
  },

  // Get single audit log
  async get(id: string): Promise<AuditLog> {
    // Validate ID format to prevent injection
    if (!validateRecordId(id)) {
      throw new Error("Invalid audit log ID format");
    }
    return (await pb
      .collection("audit_logs")
      .getOne(id)) as unknown as AuditLog;
  },

  // Create audit log (typically done server-side via hooks)
  async create(data: Partial<AuditLog>): Promise<AuditLog> {
    return (await pb
      .collection("audit_logs")
      .create(data)) as unknown as AuditLog;
  },
};
