import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { CreateAssignmentData } from '@/lib/schemas';

export function useAssignments(filters?: any) {
  return useQuery({
    queryKey: ['assignments', filters],
    queryFn: () => api.get<any[]>('/api/v1/assignments', { params: filters }).then(res => res.data || []),
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssignmentData) => api.post<any>('/api/v1/assignments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

export function useSubmitAssignment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => api.post<any>(`/api/v1/assignments/${id}/submit`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/assignments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}