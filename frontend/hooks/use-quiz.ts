import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { QuizGenerateData } from '@/lib/schemas';

export function useStartQuiz() {
  return useMutation({
    mutationFn: (data: QuizGenerateData) => api.post<any>('/api/v1/quiz/generate', data),
  });
}

export function useQuizSession(id: string) {
  return useQuery({
    queryKey: ['quiz', id],
    queryFn: () => api.get<any>(`/api/v1/quiz/sessions/${id}`).then(res => res.data),
    enabled: !!id,
  });
}

export function useSubmitAnswer() {
  return useMutation({
    mutationFn: (data: { sessionId: string; questionId: string; answer: string }) => 
      api.post<any>('/api/v1/quiz/answer', data),
  });
}

export function useCompleteQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => api.post<any>('/api/v1/quiz/complete', { sessionId }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz', variables] });
    }
  });
}