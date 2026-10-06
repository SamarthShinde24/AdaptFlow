import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useChatSessions() {
  return useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => api.get<any[]>('/api/v1/chat/sessions').then(res => res.data || []),
  });
}

export function useCreateChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { materialId?: string, title?: string }) => api.post<any>('/api/v1/chat/sessions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}

export function useChatMessages(sessionId: string) {
  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => api.get<any[]>(`/api/v1/chat/sessions/${sessionId}/messages`).then(res => res.data || []),
    enabled: !!sessionId,
  });
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/chat/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}