import { MALAYSIAN_STATES } from "@/types";

/**
 * Validates Malaysian state name against allowlist
 */
export function validateState(state: string): boolean {
  return (MALAYSIAN_STATES as readonly string[]).includes(state);
}

/**
 * Validates action type for audit logs
 */
const VALID_ACTIONS = [
  "create",
  "update",
  "delete",
  "approve",
  "reject",
] as const;
export function validateAction(action: string): boolean {
  return (VALID_ACTIONS as readonly string[]).includes(action);
}

/**
 * Validates entity type for audit logs
 */
const VALID_ENTITY_TYPES = ["mosque", "submission", "user"] as const;
export function validateEntityType(entityType: string): boolean {
  return (VALID_ENTITY_TYPES as readonly string[]).includes(entityType);
}

/**
 * Validates ISO date format (YYYY-MM-DDTHH:mm:ss)
 */
export function validateISODate(dateString: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  if (!isoDateRegex.test(dateString)) {
    return false;
  }
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validates PocketBase record ID format
 * PocketBase IDs are typically 15 characters alphanumeric
 */
export function validateRecordId(id: string): boolean {
  // PocketBase IDs are typically 15 characters, alphanumeric
  // Allow empty string for optional fields
  if (!id) return false;
  return /^[a-zA-Z0-9]{15}$/.test(id);
}

/**
 * Sanitizes search term by escaping quotes and limiting length
 */
export function sanitizeSearchTerm(search: string): string {
  if (!search) return "";
  // Trim and limit length
  const trimmed = search.trim().slice(0, 200);
  // Escape quotes to prevent filter injection
  return trimmed.replace(/"/g, '\\"');
}

/**
 * Validates submission status
 */
const VALID_SUBMISSION_STATUSES = ["pending", "approved", "rejected"] as const;
export function validateSubmissionStatus(status: string): boolean {
  return (VALID_SUBMISSION_STATUSES as readonly string[]).includes(status);
}
