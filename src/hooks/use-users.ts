import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import type { User } from '@/types';

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: () => [...usersKeys.lists()] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
};

export const useUsers = () => {
  return useQuery({
    queryKey: usersKeys.list(),
    queryFn: () => usersApi.list(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUser = (id: string | null) => {
  return useQuery({
    queryKey: usersKeys.detail(id || ''),
    queryFn: () => usersApi.get(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name?: string; email?: string }) => usersApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      // Refresh auth store to get updated user data
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword, passwordConfirm }: { 
      oldPassword: string; 
      newPassword: string; 
      passwordConfirm: string;
    }) => usersApi.updatePassword(oldPassword, newPassword, passwordConfirm),
  });
};

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) => usersApi.requestPasswordReset(email),
  });
};

