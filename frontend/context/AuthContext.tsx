'use client';

import React, { createContext, useContext } from 'react';
import { useAuth as useAuthHook } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';

export type UserRole = 'student' | 'instructor';

export interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  role: UserRole;
  subject_ids?: string[];
  enrolled_subjects?: string[];
  subjects?: string[];
  teachingSubjects?: string[];
  created_at?: string;
}

export type AuthContextType = {
  user: User | null;
  token?: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<any>;
  signup: (data: any) => Promise<any>;
  logout: () => Promise<void> | void;
  assignSubjects: (subjectsOrStudentId: any, subjectIds?: string[]) => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout: logoutHook } = useAuthHook();

  const login = async (data: any) => {
    try {
      const payload = {
        email: data.email,
        password: data.password,
      };
      const res = await api.post<any>('/api/v1/auth/login', payload);
      if (!res.success && res.error) {
        throw new Error(res.error);
      }
      const token = res.data?.access_token;
      if (token && typeof window !== 'undefined') {
        localStorage.setItem('adaptflow_access_token', token);
        if (res.data?.user) {
          localStorage.setItem('adaptflow_user', JSON.stringify(res.data.user));
        }
      }
      return res.data;
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        (Array.isArray(err?.response?.data?.detail)
          ? err?.response?.data?.detail[0]?.msg
          : null) ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Invalid credentials. Please try again.';
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
  };

  const signup = async (data: any) => {
    try {
      const payload = {
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword || data.confirm_password || data.password,
        full_name: data.name || data.fullName || data.full_name || 'User',
        role: data.role || 'student',
        subject_ids: data.subject_ids || data.subjects || [],
      };
      const res = await api.post<any>('/api/v1/auth/signup', payload);
      if (!res.success && res.error) {
        throw new Error(res.error);
      }
      const token = res.data?.access_token;
      if (token && typeof window !== 'undefined') {
        localStorage.setItem('adaptflow_access_token', token);
        if (res.data?.user) {
          localStorage.setItem('adaptflow_user', JSON.stringify(res.data.user));
        }
      }
      return res.data;
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        (Array.isArray(err?.response?.data?.detail)
          ? err?.response?.data?.detail[0]?.msg
          : null) ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Registration failed. Please try again.';
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (e) {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adaptflow_access_token');
      localStorage.removeItem('adaptflow_user');
    }
    logoutHook();
  };


  const assignSubjects = async (subjectsOrStudentId: any, subjectIds?: string[]) => {
    if (Array.isArray(subjectsOrStudentId)) {
      const res = await api.post<any>('/api/v1/instructor/assign-subjects', {
        subject_ids: subjectsOrStudentId,
      });
      return res.data || res;
    }
    const res = await api.post<any>('/api/v1/instructor/assign-subjects', {
      student_id: subjectsOrStudentId,
      subject_ids: subjectIds || [],
    });
    return res.data || res;
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        assignSubjects,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export const useAuth = useAuthContext;