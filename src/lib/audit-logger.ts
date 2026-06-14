/** Client-side audit hooks disabled; API writes audit logs on mutations. */
export async function logAuditEvent(): Promise<void> {
  /* no-op */
}

export function createEntitySnapshot(
  entity: Record<string, unknown>
): Record<string, unknown> {
  const copy = { ...entity };
  delete copy.password;
  delete copy.password_hash;
  return copy;
}