import { pb } from "./pocketbase";
import { auditApi } from "./api/audit";
import type { AuditLog } from "@/types";

/**
 * Audit logger utility
 *
 * Creates audit log entries for important actions in the system.
 * Note: IP address cannot be reliably captured client-side and should be
 * handled server-side via PocketBase hooks for production use.
 */

/**
 * Gets user agent from browser
 */
function getUserAgent(): string {
  if (typeof navigator !== "undefined" && navigator.userAgent) {
    return navigator.userAgent;
  }
  return "";
}

/**
 * Creates an audit log entry
 *
 * @param action - The action performed (create, update, delete, approve, reject)
 * @param entityType - The type of entity (mosque, submission, user)
 * @param entityId - The ID of the entity
 * @param before - Snapshot of entity before change (for update/delete)
 * @param after - Snapshot of entity after change (for create/update)
 */
export async function logAuditEvent(
  action: "create" | "update" | "delete" | "approve" | "reject",
  entityType: "mosque" | "submission" | "user",
  entityId: string,
  before?: Record<string, unknown> | null,
  after?: Record<string, unknown> | null
): Promise<void> {
  try {
    // Get current user
    const currentUser = pb.authStore.model;
    if (!currentUser) {
      // Don't log if user is not authenticated (shouldn't happen in normal flow)
      console.warn("Cannot create audit log: user not authenticated");
      return;
    }

    // Prepare audit log data
    const auditData: Partial<AuditLog> = {
      actor_id: currentUser.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      before: before || null,
      after: after || null,
      timestamp: new Date().toISOString(),
      ip_address: undefined, // Cannot be reliably captured client-side
      user_agent: getUserAgent(),
    };

    // Create audit log entry
    // Use the audit API which handles validation
    await auditApi.create(auditData);
  } catch (error) {
    // Don't throw errors from audit logging - it should not break the main operation
    // Log to console for debugging
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Helper to create a sanitized snapshot of an entity for audit logging
 * Removes sensitive fields and large data that shouldn't be logged
 */
export function createEntitySnapshot(
  entity: Record<string, unknown>
): Record<string, unknown> {
  // Fields to exclude from audit logs
  const EXCLUDED_FIELDS = [
    "password",
    "passwordConfirm",
    "token",
    "refreshToken",
    "accessToken",
  ];

  const snapshot: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(entity)) {
    // Skip excluded fields
    if (EXCLUDED_FIELDS.includes(key)) {
      continue;
    }

    // Skip functions
    if (typeof value === "function") {
      continue;
    }

    // For file fields, just store the filename if it's a string
    if (key === "image" && typeof value === "string") {
      snapshot[key] = value; // Store filename
      continue;
    }

    // Skip File objects (can't be serialized)
    if (value instanceof File) {
      snapshot[key] = `[File: ${value.name}]`;
      continue;
    }

    // Store other values as-is (will be JSON serialized)
    snapshot[key] = value;
  }

  return snapshot;
}
