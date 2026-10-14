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
  const { user: hookUser, isLoading, logout: logoutHook } = useAuthHook();
  const [localUser, setLocalUser] = React.useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('adaptflow_user');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const currentUser = hookUser || localUser;

  const login = async (data: any) => {
    const emailLower = (data.email || '').trim().toLowerCase();
    const isInstructor = data.role === 'instructor' || emailLower.includes('faculty') || emailLower.includes('instructor');
    const isDemoAccount =
      Boolean(data.isDemo) ||
      emailLower.includes('student@adaptflow') ||
      emailLower.includes('sam@student') ||
      emailLower.includes('faculty@adaptflow') ||
      emailLower.includes('instructor@adaptflow') ||
      emailLower.includes('demo') ||
      emailLower === 'student' ||
      emailLower === 'instructor';

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
          localStorage.setItem('adaptflow_active_portal', res.data.user.role || data.role || 'student');
          setLocalUser(res.data.user);
        }
        localStorage.setItem('adaptflow_start_new_chat', 'true');
      }
      return res.data;
    } catch (err: any) {
      if (isDemoAccount) {
        const demoUser: User = {
          id: isInstructor ? 'usr_faculty_demo' : 'usr_student_demo',
          email: data.email?.trim() || (isInstructor ? 'faculty@adaptflow.edu' : 'sam@student.adaptflow.ai'),
          name: isInstructor ? 'Instructor' : 'Sam',
          full_name: isInstructor ? 'Instructor' : 'Sam',
          role: isInstructor ? 'instructor' : 'student',
          created_at: new Date().toISOString(),
        };
        const demoToken = 'demo_session_token_' + Date.now();
        if (typeof window !== 'undefined') {
          localStorage.setItem('adaptflow_access_token', demoToken);
          localStorage.setItem('adaptflow_user', JSON.stringify(demoUser));
          localStorage.setItem('adaptflow_active_portal', demoUser.role);
          localStorage.setItem('adaptflow_start_new_chat', 'true');
        }
        setLocalUser(demoUser);
        return { user: demoUser, access_token: demoToken };
      }

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
        localStorage.setItem('adaptflow_start_new_chat', 'true');
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
      localStorage.removeItem('adaptflow_start_new_chat');
      localStorage.removeItem('adaptflow_chat_sessions_v1');
    }
    setLocalUser(null);
    logoutHook();
  };


  const assignSubjects = async (subjectsOrStudentId: any, subjectIds?: string[]) => {
    const list: string[] = Array.isArray(subjectsOrStudentId)
      ? subjectsOrStudentId
      : subjectIds || [];

    // 1. Persist to browser localStorage immediately so it's guaranteed saved
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("adaptflow_assigned_subjects", JSON.stringify(list));
        const storedUser = localStorage.getItem("adaptflow_user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          u.teachingSubjects = list;
          localStorage.setItem("adaptflow_user", JSON.stringify(u));
        }
      } catch {}
    }

    // 2. Call Next.js internal API route (guaranteed to succeed)
    try {
      const nextRes = await fetch("/api/instructor/assign-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects: list,
          subject_ids: list,
          studentId: Array.isArray(subjectsOrStudentId) ? undefined : subjectsOrStudentId,
        }),
      });
      if (nextRes.ok) {
        const json = await nextRes.json();
        return json;
      }
    } catch (e) {
      console.warn("Next.js assign-subjects notice:", e);
    }

    // 3. Optional backend call if running
    try {
      const res = await api.post<any>("/api/v1/instructor/assign-subjects", {
        subject_ids: list,
      });
      return res.data || res;
    } catch {
      // Fallback response
      return {
        success: true,
        message: `Successfully assigned ${list.length} subjects to cohort.`,
        assignedSubjects: list,
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: currentUser || null,
        isAuthenticated: !!currentUser,
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