import axios from 'axios';
import { toast } from 'sonner';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || '';
    const isAuthEndpoint =
      url.includes('/auth/login') ||
      url.includes('/auth/signup') ||
      url.includes('/auth/me') ||
      url.includes('/auth/refresh');

    // On 401 for /auth/me, the visitor is simply unauthenticated.
    // Return empty payload gracefully without looping or redirecting.
    if (error.response?.status === 401 && url.includes('/auth/me')) {
      return { success: false, data: null, error: null };
    }

    // Attempt token refresh on protected business endpoints only
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails and we are not already on the auth page, navigate to /auth
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth';
        }
        return Promise.reject(refreshError);
      }
    }

    // Suppress intrusive error toast on expected auth checks
    if (!isAuthEndpoint) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.detail ||
        'An unexpected error occurred';
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export const api = {
  get: <T>(url: string, config?: any): Promise<{ success: boolean; data: T | null; error: string | null; meta?: any }> =>
    apiClient.get(url, config),
  post: <T>(url: string, data?: any, config?: any): Promise<{ success: boolean; data: T | null; error: string | null; meta?: any }> =>
    apiClient.post(url, data, config),
  put: <T>(url: string, data?: any, config?: any): Promise<{ success: boolean; data: T | null; error: string | null; meta?: any }> =>
    apiClient.put(url, data, config),
  delete: <T>(url: string, config?: any): Promise<{ success: boolean; data: T | null; error: string | null; meta?: any }> =>
    apiClient.delete(url, config),
};