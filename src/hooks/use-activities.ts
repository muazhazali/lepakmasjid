import { useQuery } from "@tanstack/react-query";
import { activitiesApi } from "@/lib/api";
import type { Activity } from "@/types";

export const activitiesKeys = {
  all: ["activities"] as const,
  lists: () => [...activitiesKeys.all, "list"] as const,
  list: (mosqueId?: string) => [...activitiesKeys.lists(), mosqueId] as const,
  details: () => [...activitiesKeys.all, "detail"] as const,
  detail: (id: string) => [...activitiesKeys.details(), id] as const,
};

export const useActivities = (mosqueId: string | null) => {
  return useQuery({
    queryKey: activitiesKeys.list(mosqueId || undefined),
    queryFn: () => activitiesApi.listByMosque(mosqueId!),
    enabled: !!mosqueId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useActivity = (id: string | null) => {
  return useQuery({
    queryKey: activitiesKeys.detail(id || ""),
    queryFn: () => activitiesApi.get(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};
