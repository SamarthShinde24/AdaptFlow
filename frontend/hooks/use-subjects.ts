import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: () => api.get<any[]>('/api/v1/subjects').then(res => res.data || []),
  });
}

export function useAssignSubjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { subjectIds: string[] }) => api.post<any>('/api/v1/instructor/assign-subjects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}