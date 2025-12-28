import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mosquesApi } from "@/lib/api";
import type { Mosque, MosqueFilters, PaginatedResponse } from "@/types";

export const mosquesKeys = {
  all: ["mosques"] as const,
  lists: () => [...mosquesKeys.all, "list"] as const,
  list: (filters?: MosqueFilters) => [...mosquesKeys.lists(), filters] as const,
  listAll: (filters?: Omit<MosqueFilters, "page" | "perPage">) =>
    [...mosquesKeys.lists(), "all", filters] as const,
  details: () => [...mosquesKeys.all, "detail"] as const,
  detail: (id: string) => [...mosquesKeys.details(), id] as const,
};

export const useMosques = (filters?: MosqueFilters) => {
  return useQuery<PaginatedResponse<Mosque>>({
    queryKey: mosquesKeys.list(filters),
    queryFn: () => mosquesApi.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMosquesAll = (
  filters?: Omit<MosqueFilters, "page" | "perPage">
) => {
  return useQuery<Mosque[]>({
    queryKey: mosquesKeys.listAll(filters),
    queryFn: () => mosquesApi.listAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMosque = (id: string | null) => {
  return useQuery({
    queryKey: mosquesKeys.detail(id || ""),
    queryFn: () => mosquesApi.get(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMosquesAdmin = () => {
  return useQuery({
    queryKey: [...mosquesKeys.all, "admin"],
    queryFn: () => mosquesApi.listAllAdmin(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateMosque = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      imageFile,
      deleteImage,
    }: {
      id: string;
      data: Partial<Mosque>;
      imageFile?: File;
      deleteImage?: boolean;
    }) => mosquesApi.update(id, data, imageFile, deleteImage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mosquesKeys.all });
    },
  });
};
