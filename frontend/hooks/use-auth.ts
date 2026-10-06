import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { LoginFormData, SignupFormData } from '@/lib/schemas';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const userQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<any>('/api/v1/auth/me').then(res => res.data),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => api.post<any>('/api/v1/auth/login', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      if (res.data?.role === 'instructor') {
        router.push('/instructor/dashboard');
      } else {
        router.push('/dashboard');
      }
    },
  });

  const signupMutation = useMutation({
    mutationFn: (data: SignupFormData) => api.post<any>('/api/v1/auth/signup', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      if (res.data?.role === 'instructor') {
        router.push('/instructor/dashboard');
      } else {
        router.push('/dashboard');
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post('/api/v1/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
      router.push('/auth');
    },
  });

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}