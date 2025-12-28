import { useQuery } from "@tanstack/react-query";
import { amenitiesApi } from "@/lib/api";
import type { Amenity } from "@/types";

export const amenitiesKeys = {
  all: ["amenities"] as const,
  lists: () => [...amenitiesKeys.all, "list"] as const,
  list: () => [...amenitiesKeys.lists()] as const,
  details: () => [...amenitiesKeys.all, "detail"] as const,
  detail: (id: string) => [...amenitiesKeys.details(), id] as const,
};

export const useAmenities = () => {
  return useQuery({
    queryKey: amenitiesKeys.list(),
    queryFn: () => amenitiesApi.list(),
    staleTime: 30 * 60 * 1000, // 30 minutes (amenities don't change often)
  });
};

export const useAmenity = (id: string | null) => {
  return useQuery({
    queryKey: amenitiesKeys.detail(id || ""),
    queryFn: () => amenitiesApi.get(id!),
    enabled: !!id,
    staleTime: 30 * 60 * 1000,
  });
};
