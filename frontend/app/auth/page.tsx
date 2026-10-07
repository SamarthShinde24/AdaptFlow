"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, School, Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function RoleSelectionPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-8">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#6C63FF] to-indigo-500 shadow-md mb-4 text-white">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            AdaptFlow <span className="text-[#6C63FF]">AI 2.0</span>
          </h1>
          <span className="bg-indigo-50 text-[#6C63FF] border border-indigo-200 text-xs px-2 py-0.5 rounded-full font-semibold">
            EdTech Platform
          </span>
        </div>
        <p className="text-base text-gray-600 max-w-md mx-auto">
          Welcome! Please select your role to access your personalized learning or teaching workspace.
        </p>
      </div>

      {/* Role Selection Cards */}
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Card */}
          <div className="group relative bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-[#6C63FF]/50 transition-all flex flex-col justify-between">
            <div className="absolute top-4 right-4 bg-indigo-50 text-[#6C63FF] text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Student Track
            </div>

            <div>
              <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-[#6C63FF] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">I&apos;m a Student</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Interact with source-grounded AI tutors, inspect verified citations in textbooks and lecture slides, and practice with adaptive skill quizzes.
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2.5 text-xs text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-[#6C63FF] shrink-0" />
                  <span>Multimodal Q&A with exact page & slide citations</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-[#6C63FF] shrink-0" />
                  <span>Personalized subject curriculum tracking</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-[#6C63FF] shrink-0" />
                  <span>Adaptive quizzes with instant diagnostic scoring</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <Link
                href="/auth/signup/student"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#6C63FF] hover:bg-[#5b52e0] text-white py-3 px-4 text-sm font-semibold transition-all shadow-sm active:scale-[0.99]"
              >
                <span>Sign Up as Student (Free)</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/login/student"
                className="w-full flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 py-2.5 px-4 text-sm font-medium transition-all text-center"
              >
                Log In to Existing Account
              </Link>
            </div>
          </div>

          {/* Instructor Card */}
          <div className="group relative bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-purple-400 transition-all flex flex-col justify-between">
            <div className="absolute top-4 right-4 bg-purple-50 text-purple-700 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Faculty / Mentor
            </div>

            <div>
              <div className="h-14 w-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                <School className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">I&apos;m an Instructor</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Upload and manage multimodal course materials, curate assigned subjects for student cohorts, and review AI assessment metrics.
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2.5 text-xs text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                  <span>Ingest textbooks, slide decks, and video lectures</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                  <span>Assign and reassign default subjects to students</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                  <span>Cohort analytics and knowledge unit verification</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <Link
                href="/auth/signup/instructor"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 text-sm font-semibold transition-all shadow-sm active:scale-[0.99]"
              >
                <span>Sign Up as Instructor</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/login/instructor"
                className="w-full flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 py-2.5 px-4 text-sm font-medium transition-all text-center"
              >
                Log In to Existing Account
              </Link>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="h-4 w-4 text-[#6C63FF]" />
          <span>Role-aware authentication with JWT session encryption & source provenance protection</span>
        </div>
      </div>
    </div>
  );
}
