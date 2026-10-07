"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  GraduationCap,
  School,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  Layers,
  Brain,
  FileText,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
} from "lucide-react";
import { useAuth, UserRole } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const LEARNING_TRACKS = [
  { id: "sub_cs", name: "Computer Science & AI (CS201)" },
  { id: "sub_bio", name: "Biology & Life Sciences (BIO101)" },
  { id: "sub_chem", name: "Organic Chemistry (CHEM301)" },
  { id: "sub_phys", name: "Physics & Mechanics (PHYS102)" },
];

export default function HomePage() {
  const router = useRouter();
  const { signup, login, isAuthenticated } = useAuth();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [role, setRole] = useState<UserRole>("student");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedTrack, setSelectedTrack] = useState(LEARNING_TRACKS[0].name);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect straight to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("adaptflow_access_token");
      const userStr = localStorage.getItem("adaptflow_user");
      if (token) {
        try {
          const user = userStr ? JSON.parse(userStr) : null;
          if (user?.role === "instructor") {
            router.replace("/instructor/dashboard");
          } else {
            router.replace("/dashboard");
          }
          return;
        } catch {
          router.replace("/dashboard");
          return;
        }
      }
    }
    setCheckingAuth(false);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password.trim()) {
      setFormError("Please enter both email and password.");
      return;
    }

    if (authMode === "signup" && !name.trim()) {
      setFormError("Please provide your full name.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === "signup") {
        await signup({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          subjects: [selectedTrack],
        });
      } else {
        await login({
          email: email.trim(),
          password,
        });
      }

      if (role === "instructor") {
        router.push("/instructor/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setFormError(err?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary animate-pulse">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="text-xs text-muted-foreground animate-pulse">Initializing AdaptFlow...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground flex flex-col selection:bg-primary/20">
      {/* Top Navigation */}
      <header className="border-b border-border/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AdaptFlow
              </span>
              <span className="text-xs font-semibold ml-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                AI 2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">AI Engine Online</span>
            </div>

            <Link
              href="/auth"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary/50"
            >
              Role Selection
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero & Sign-Up Flow */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Platform Mission & Core Capabilities */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Brain className="h-3.5 w-3.5" />
            <span>Multimodal Source-Grounded Learning</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Master Any Subject with an{" "}
              <span className="bg-gradient-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                Authentic AI Tutor
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              AdaptFlow eliminates hallucinations by connecting intelligent Socratic guidance directly to your course textbooks, lecture videos, and slide decks with exact clickable citations.
            </p>
          </div>

          {/* Three Core Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BookOpen className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Socratic AI Tutor</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Conceptual intuition, step-by-step mechanics, and grounded source citations.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <GraduationCap className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">10-Q Adaptive Quizzes</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Standardized 10-question mastery tests with high-contrast diagnostic rationale.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-2">
              <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Multimodal RAG</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Seamless semantic search across PDFs, slides, and lecture video timestamps.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% Verifiable Citations
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Instant Diagnostic Feedback
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Open Source & Fast
            </span>
          </div>
        </div>

        {/* Right Column: Embedded Sign-Up Journey Card */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl space-y-6">
            {/* Form Mode Toggle */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("signup");
                  setFormError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  authMode === "signup"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Create Account (Start Here)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setFormError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  authMode === "login"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Sign In
              </button>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {authMode === "signup" ? "Get Started with AdaptFlow" : "Welcome Back"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {authMode === "signup"
                  ? "Create your account to unlock your personalized AI Tutor and Adaptive Quizzes."
                  : "Sign in with your credentials to jump straight to your learning dashboard."}
              </p>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 p-3 text-xs text-rose-800 dark:text-rose-200 font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection (Only in signup mode) */}
              {authMode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Select Your Role:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        role === "student"
                          ? "border-primary bg-primary/10 text-primary shadow-xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <GraduationCap className="h-4 w-4" />
                      <span>Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("instructor")}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        role === "instructor"
                          ? "border-purple-600 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 shadow-xs"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <School className="h-4 w-4" />
                      <span>Instructor</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Full Name (Only for signup) */}
              {authMode === "signup" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Samarth Shinde"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Primary Learning Track (Only for signup) */}
              {authMode === "signup" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Primary Learning Track
                  </label>
                  <select
                    value={selectedTrack}
                    onChange={(e) => setSelectedTrack(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                  >
                    {LEARNING_TRACKS.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit CTA */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 text-xs sm:text-sm font-bold gap-2 bg-[#6C63FF] hover:bg-[#5a52e0] text-white shadow-md active:scale-[0.99] transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {authMode === "signup"
                        ? "Create Free Account & Go to Dashboard"
                        : "Sign In to Dashboard"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {authMode === "signup" ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("login")}
                      className="text-[#6C63FF] hover:underline font-bold"
                    >
                      Sign In here
                    </button>
                  </>
                ) : (
                  <>
                    Need a new account?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className="text-[#6C63FF] hover:underline font-bold"
                    >
                      Sign Up free
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        <p>© 2026 AdaptFlow AI 2.0. Multimodal Source-Grounded Learning Platform.</p>
      </footer>
    </div>
  );
}
