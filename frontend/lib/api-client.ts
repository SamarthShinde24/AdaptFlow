import axios from 'axios';
import { toast } from 'sonner';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://adaptflow-production.up.railway.app',
  withCredentials: true,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adaptflow_access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adaptflow_access_token');
        localStorage.removeItem('adaptflow_user');
      }
      return { success: false, data: null, error: null };
    }

    // Attempt token refresh on protected business endpoints only
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const refreshHeaders: Record<string, string> = {};
        if (typeof window !== 'undefined') {
          const storedToken = localStorage.getItem('adaptflow_access_token');
          if (storedToken) refreshHeaders.Authorization = `Bearer ${storedToken}`;
        }
        const refreshRes = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://adaptflow-production.up.railway.app'}/api/v1/auth/refresh`,
          {},
          { withCredentials: true, headers: refreshHeaders }
        );
        const newToken = refreshRes.data?.data?.access_token || refreshRes.data?.access_token;
        if (newToken && typeof window !== 'undefined') {
          localStorage.setItem('adaptflow_access_token', newToken);
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('adaptflow_access_token');
          localStorage.removeItem('adaptflow_user');
          if (!window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    // Suppress intrusive error toast on expected auth checks
    if (!isAuthEndpoint) {
      let errorMessage = 'An unexpected error occurred';
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
        errorMessage = 'Request timed out after 10 seconds. Please check your connection.';
      } else {
        const rawDetail = error.response?.data?.detail;
        errorMessage =
          (typeof rawDetail === 'string' ? rawDetail : (Array.isArray(rawDetail) ? rawDetail[0]?.msg : null)) ||
          error.response?.data?.error ||
          (error.message === 'Network Error' ? 'Unable to connect to backend server. Please verify connection.' : error.message) ||
          'An unexpected error occurred';
      }
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