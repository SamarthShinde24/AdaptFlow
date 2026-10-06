import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useMaterials() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: () => api.get<any[]>('/api/v1/materials').then(res => res.data || []),
  });
}

export function useMaterial(id: string) {
  return useQuery({
    queryKey: ['materials', id],
    queryFn: () => api.get<any>(`/api/v1/materials/${id}`).then(res => res.data),
    enabled: !!id,
  });
}

export function useUploadMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => api.post<any>('/api/v1/materials/upload', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/materials/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useMaterialStatus(jobId: string) {
  return useQuery({
    queryKey: ['processing', jobId],
    queryFn: () => api.get<any>(`/api/v1/tasks/${jobId}/status`).then(res => res.data),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return (status === 'completed' || status === 'failed') ? false : 3000;
    },
  });
}