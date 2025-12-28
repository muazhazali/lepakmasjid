import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionsApi } from "@/lib/api";
import type { Submission } from "@/types";

export const submissionsKeys = {
  all: ["submissions"] as const,
  lists: () => [...submissionsKeys.all, "list"] as const,
  list: (status?: string) => [...submissionsKeys.lists(), status] as const,
  details: () => [...submissionsKeys.all, "detail"] as const,
  detail: (id: string) => [...submissionsKeys.details(), id] as const,
};

export const useSubmissions = (
  status?: "pending" | "approved" | "rejected"
) => {
  return useQuery({
    queryKey: submissionsKeys.list(status),
    queryFn: () => submissionsApi.list(status),
    staleTime: 1 * 60 * 1000, // 1 minute (admin data changes frequently)
  });
};

export const useMySubmissions = (
  status?: "pending" | "approved" | "rejected"
) => {
  return useQuery({
    queryKey: ["submissions", "my", status],
    queryFn: () => submissionsApi.listMySubmissions(status),
    staleTime: 1 * 60 * 1000,
  });
};

export const useSubmission = (id: string | null) => {
  return useQuery({
    queryKey: submissionsKeys.detail(id || ""),
    queryFn: () => submissionsApi.get(id!),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  });
};

export const useCreateSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Submission>) => submissionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionsKeys.all });
    },
  });
};

export const useApproveSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reviewedBy }: { id: string; reviewedBy: string }) =>
      submissionsApi.approve(id, reviewedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["mosques"] });
    },
  });
};

export const useRejectSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      reviewedBy,
      reason,
    }: {
      id: string;
      reviewedBy: string;
      reason: string;
    }) => submissionsApi.reject(id, reviewedBy, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionsKeys.all });
    },
  });
};
