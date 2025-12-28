import { useQuery } from "@tanstack/react-query";
import { auditApi } from "@/lib/api";
import type { AuditLog } from "@/types";

export const auditKeys = {
  all: ["audit"] as const,
  lists: () => [...auditKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...auditKeys.lists(), filters] as const,
  details: () => [...auditKeys.all, "detail"] as const,
  detail: (id: string) => [...auditKeys.details(), id] as const,
};

export const useAuditLogs = (filters?: {
  action?: string;
  entityType?: string;
  actorId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => auditApi.list(filters),
    staleTime: 1 * 60 * 1000,
  });
};

export const useAuditLog = (id: string | null) => {
  return useQuery({
    queryKey: auditKeys.detail(id || ""),
    queryFn: () => auditApi.get(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};
