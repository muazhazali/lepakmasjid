import type { AuditLog } from "@/types";

export const auditApi = {
  async list(): Promise<AuditLog[]> {
    return [];
  },
  async get(): Promise<AuditLog> {
    throw new Error("Audit API not implemented yet");
  },
  async create(): Promise<AuditLog> {
    throw new Error("Not implemented");
  },
};