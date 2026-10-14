"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, School, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { AdaptFlowLogo } from "@/components/ui/AdaptFlowLogo";
import { useAuth } from "@/context/AuthContext";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [demoLoading, setDemoLoading] = useState<"student" | "instructor" | null>(null);

  const handleInstantDemo = async (role: "student" | "instructor") => {
    setDemoLoading(role);
    try {
      const email = role === "instructor" ? "faculty@adaptflow.edu" : "sam@student.adaptflow.ai";
      await login({
        email,
        password: "Password123!",
        role,
        isDemo: true,
        rememberMe: true,
      });
      if (role === "instructor") {
        router.push("/instructor/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch {
      // Guaranteed navigation
      if (role === "instructor") {
        router.push("/instructor/dashboard");
      } else {
        router.push("/dashboard");
      }
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090B] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-8">
        <div className="flex flex-col items-center justify-center mb-3">
          <AdaptFlowLogo
            size="xl"
            showText
            textPosition="below"
            tagline="Multimodal AI Learning"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Choose your workspace
        </h1>
        <p className="text-sm text-slate-600 dark:text-zinc-300 max-w-md mx-auto mt-1">
          Learn with source-grounded AI or manage your courses.
        </p>
      </div>

      {/* Role Selection Cards */}
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Card */}
          <div className="group relative bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 shadow-sm hover:shadow-md hover:border-[#6C63FF]/50 dark:hover:border-[#6C63FF]/50 transition-all flex flex-col justify-between">
            <div className="absolute top-4 right-4 bg-indigo-50 dark:bg-indigo-950/60 text-[#6C63FF] dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Student Track
            </div>

            <div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-[#6C63FF] dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">I&apos;m a Student</h2>
              <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed mb-5">
                Ask questions with exact textbook citations, review 10-card active recall flashcards, and test your knowledge.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-[#6C63FF] dark:text-indigo-400 shrink-0" />
                  <span>AI tutor with page, slide & video citations</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-[#6C63FF] dark:text-indigo-400 shrink-0" />
                  <span>10-card active recall flashcards</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-[#6C63FF] dark:text-indigo-400 shrink-0" />
                  <span>Adaptive quizzes with instant score breakdown</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.08]">
              <Link
                href="/auth/signup/student"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] text-white py-2.5 px-4 text-sm font-semibold transition-all shadow-sm active:scale-[0.99]"
              >
                <span>Sign Up as Student</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/login/student"
                className="w-full flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-white/[0.08] py-2 px-4 text-xs font-medium transition-all text-center"
              >
                Log In to Existing Account
              </Link>
              <button
                type="button"
                onClick={() => handleInstantDemo("student")}
                disabled={demoLoading !== null}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-[#6C63FF] dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50 py-2 px-4 text-xs font-semibold transition-all cursor-pointer disabled:opacity-60"
              >
                {demoLoading === "student" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>Try Student Demo Instantly</span>
              </button>
            </div>
          </div>

          {/* Instructor Card */}
          <div className="group relative bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-7 shadow-sm hover:shadow-md hover:border-purple-400 dark:hover:border-purple-500/50 transition-all flex flex-col justify-between">
            <div className="absolute top-4 right-4 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Faculty / Mentor
            </div>

            <div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/40 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <School className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">I&apos;m an Instructor</h2>
              <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed mb-5">
                Upload course materials, assign subjects to students, and track cohort quiz results.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Upload textbooks, slides, and lecture videos</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Assign curriculum subjects to student cohorts</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-zinc-300">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>Review student quiz scores and assignment ledgers</span>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-white/[0.08]">
              <Link
                href="/auth/signup/instructor"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-4 text-sm font-semibold transition-all shadow-sm active:scale-[0.99]"
              >
                <span>Sign Up as Instructor</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/login/instructor"
                className="w-full flex items-center justify-center rounded-xl bg-slate-50 dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-white/[0.08] py-2 px-4 text-xs font-medium transition-all text-center"
              >
                Log In to Existing Account
              </Link>
              <button
                type="button"
                onClick={() => handleInstantDemo("instructor")}
                disabled={demoLoading !== null}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/50 py-2 px-4 text-xs font-semibold transition-all cursor-pointer disabled:opacity-60"
              >
                {demoLoading === "instructor" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>Try Faculty Demo Instantly</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
          <ShieldCheck className="h-4 w-4 text-[#6C63FF] dark:text-indigo-400" />
          <span>Verified source citations · Role-based access control</span>
        </div>
      </div>
    </div>
  );
}
