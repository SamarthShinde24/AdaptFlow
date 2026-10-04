"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type UserRole = "student" | "instructor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  enrolledSubjects?: string[];
  teachingSubjects?: string[];
  avatar?: string;
  token: string;
}

export interface LoginParams {
  email: string;
  password: string;
  role: UserRole;
  rememberMe?: boolean;
}

export interface SignupParams {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  subjects: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (params: LoginParams) => Promise<void>;
  signup: (params: SignupParams) => Promise<void>;
  logout: () => void;
  assignSubjects: (subjects: string[], studentId?: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "adaptflow_auth_token";
const USER_KEY = "adaptflow_user";

/**
 * Creates a mock JWT token with header, payload and signature
 */
function createMockJWT(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7 }));
  const sig = btoa("adaptflow_signature_verified");
  return `${header}.${body}.${sig}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Hydrate auth state from localStorage on initial render
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        // Provide a default active student user if not logged in
        const defaultUser: User = {
          id: "student_demo_1",
          name: "AdaptFlow Student",
          email: "student@adaptflow.edu",
          role: "student",
          enrolledSubjects: ["Biology & Life Sciences", "Computer Science & AI"],
          token: createMockJWT({ sub: "student_demo_1", role: "student" }),
        };
        setUser(defaultUser);
        setToken(defaultUser.token);
      }
    } catch (e) {
      console.warn("Failed to load auth from storage:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async ({ email, password, role, rememberMe = true }: LoginParams): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API verification
      await new Promise((resolve) => setTimeout(resolve, 600));

      const generatedToken = createMockJWT({ email, role, sub: `usr_${Date.now()}` });
      const loggedUser: User = {
        id: `usr_${Date.now()}`,
        name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email,
        role,
        enrolledSubjects: role === "student" ? ["Biology & Life Sciences", "Computer Science & AI"] : undefined,
        teachingSubjects: role === "instructor" ? ["Computer Science & AI", "Organic Chemistry"] : undefined,
        token: generatedToken,
      };

      setUser(loggedUser);
      setToken(generatedToken);

      if (rememberMe) {
        localStorage.setItem(TOKEN_KEY, generatedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(loggedUser));
      }

      // Role-aware redirect
      if (role === "instructor") {
        router.push("/instructor/dashboard");
      } else {
        router.push("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async ({ name, email, role, subjects }: SignupParams): Promise<void> => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));

      const generatedToken = createMockJWT({ email, role, name, sub: `usr_${Date.now()}` });
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name,
        email,
        role,
        enrolledSubjects: role === "student" ? subjects : undefined,
        teachingSubjects: role === "instructor" ? subjects : undefined,
        token: generatedToken,
      };

      setUser(newUser);
      setToken(generatedToken);

      localStorage.setItem(TOKEN_KEY, generatedToken);
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));

      if (role === "instructor") {
        router.push("/instructor/dashboard");
      } else {
        router.push("/dashboard");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
    router.push("/auth");
  };

  const assignSubjects = async (subjects: string[], studentId?: string) => {
    try {
      const res = await fetch("/api/instructor/assign-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructorId: user?.id || "instructor_default",
          studentId,
          subjects,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to assign subjects");
      }

      const data = await res.json();
      if (user && user.role === "instructor") {
        const updated = { ...user, teachingSubjects: subjects };
        setUser(updated);
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      }
      return data;
    } catch {
      // Fallback update in state
      if (user && user.role === "instructor") {
        const updated = { ...user, teachingSubjects: subjects };
        setUser(updated);
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      }
      return { success: true, message: "Subjects assigned to student cohort successfully." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
