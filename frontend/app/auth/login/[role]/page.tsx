"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { GraduationCap, School, Mail, Lock, AlertCircle, ArrowLeft, Loader2, Sparkles, Check } from "lucide-react";
import { useAuth, UserRole } from "@/context/AuthContext";

export default function LoginPage() {
  const params = useParams();
  const router = useRouter();
  const rawRole = (params?.role as string)?.toLowerCase();
  const role: UserRole = rawRole === "instructor" ? "instructor" : "student";
  const isInstructor = role === "instructor";

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        email: email.trim(),
        password,
        role,
        rememberMe,
      });
      // Routing is handled in login, but add fallback redirect
      if (role === "instructor") {
        router.push("/instructor/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrors({
        general: err?.message || "Invalid credentials. Please verify your email and password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrors({ email: "Please enter your email to receive password reset instructions." });
      return;
    }
    setForgotSent(true);
    setTimeout(() => setForgotSent(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Navigation */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4">
        <Link
          href="/auth"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Role Selection</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Card Header */}
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl shadow-sm mb-3 ${
              isInstructor ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-[#6C63FF]"
            }`}
          >
            {isInstructor ? <School className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {isInstructor ? "Instructor Login" : "Student Login"}
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            Enter your credentials to access your {isInstructor ? "courseware and cohort analytics" : "adaptive learning workspace"}.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-gray-200 py-8 px-6 shadow-sm rounded-2xl sm:px-10">
          {errors.general && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{errors.general}</span>
            </div>
          )}

          {forgotSent && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Password reset instructions sent to <strong>{email}</strong>.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder={isInstructor ? "prof.smith@university.edu" : "student@adaptflow.edu"}
                  className={`block w-full rounded-xl border bg-white pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-[#6C63FF] focus:ring-indigo-100"
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-[#6C63FF] hover:text-[#5850e0] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className={`block w-full rounded-xl border bg-white pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.password
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-[#6C63FF] focus:ring-indigo-100"
                  }`}
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#6C63FF] focus:ring-[#6C63FF]"
                />
                <span className="text-xs text-gray-600 font-medium">Remember me for 7 days</span>
              </label>

              {/* Quick Role Switcher */}
              <Link
                href={`/auth/login/${isInstructor ? "student" : "instructor"}`}
                className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                Log in as {isInstructor ? "Student" : "Instructor"} instead
              </Link>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.99] disabled:opacity-70 ${
                  isInstructor ? "bg-purple-600 hover:bg-purple-700" : "bg-[#6C63FF] hover:bg-[#5950e0]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In as {isInstructor ? "Instructor" : "Student"}</span>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Signup */}
          <div className="mt-6 border-t border-gray-100 pt-5 text-center text-xs text-gray-600">
            <span>Don&apos;t have an account yet? </span>
            <Link
              href={`/auth/signup/${role}`}
              className="font-semibold text-[#6C63FF] hover:text-[#5850e0] underline underline-offset-2 transition-colors"
            >
              Sign up here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
