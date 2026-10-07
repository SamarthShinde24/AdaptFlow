"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  GraduationCap,
  School,
  User as UserIcon,
  Mail,
  Lock,
  BookOpen,
  Check,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Info,
} from "lucide-react";
import { useAuth, UserRole } from "@/context/AuthContext";

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  description?: string;
}

const FALLBACK_SUBJECTS: SubjectItem[] = [
  { id: "sub_bio", name: "Biology & Life Sciences", code: "BIO101" },
  { id: "sub_cs", name: "Computer Science & AI", code: "CS201" },
  { id: "sub_chem", name: "Organic Chemistry", code: "CHEM301" },
  { id: "sub_phys", name: "Physics & Mechanics", code: "PHYS102" },
  { id: "sub_hist", name: "World History & Heritage", code: "HIST110" },
  { id: "sub_math", name: "Calculus & Linear Algebra", code: "MATH205" },
];

export default function SignupPage() {
  const params = useParams();
  const router = useRouter();
  const rawRole = (params?.role as string)?.toLowerCase();
  const role: UserRole = rawRole === "instructor" ? "instructor" : "student";
  const isInstructor = role === "instructor";

  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Subjects state
  const [availableSubjects, setAvailableSubjects] = useState<SubjectItem[]>(FALLBACK_SUBJECTS);
  const [selectedStudentSubject, setSelectedStudentSubject] = useState<string>("");
  const [selectedInstructorSubjects, setSelectedInstructorSubjects] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch subjects from API GET /api/subjects
  useEffect(() => {
    fetch("/api/subjects")
      .then((res) => {
        if (!res.ok) throw new Error("Failed fetching subjects");
        return res.json();
      })
      .then((data) => {
        if (data.subjects && Array.isArray(data.subjects) && data.subjects.length > 0) {
          setAvailableSubjects(data.subjects);
          if (!selectedStudentSubject) {
            setSelectedStudentSubject(data.subjects[0].name);
          }
        }
      })
      .catch((err) => {
        console.warn("Using fallback subjects:", err);
        if (!selectedStudentSubject && FALLBACK_SUBJECTS.length > 0) {
          setSelectedStudentSubject(FALLBACK_SUBJECTS[0].name);
        }
      });
  }, []);

  const toggleInstructorSubject = (subjectName: string) => {
    setSelectedInstructorSubjects((prev) =>
      prev.includes(subjectName)
        ? prev.filter((s) => s !== subjectName)
        : [...prev, subjectName]
    );
    if (errors.subjects) {
      setErrors((prev) => ({ ...prev, subjects: undefined }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = "Full name is required.";
    } else if (name.trim().length < 2) {
      errs.name = "Please provide your full legal or display name.";
    }

    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters long.";
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    if (isInstructor) {
      if (selectedInstructorSubjects.length === 0) {
        errs.subjects = "Please select at least one subject you teach.";
      }
    } else {
      if (!selectedStudentSubject) {
        errs.subjects = "Please select your enrolled subject.";
      }
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
      const chosenSubjects = isInstructor
        ? selectedInstructorSubjects
        : [selectedStudentSubject];

      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        subjects: chosenSubjects,
      });

      if (role === "instructor") {
        router.push("/instructor/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrors({
        general: err?.message || "Registration failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Navigation */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl px-4 mb-4">
        <Link
          href="/auth"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Role Selection</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl shadow-sm mb-3 ${
              isInstructor ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-[#6C63FF]"
            }`}
          >
            {isInstructor ? <School className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {isInstructor ? "Create Instructor Account" : "Create Student Account"}
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            {isInstructor
              ? "Set up your faculty account and assign default course curriculum to student cohorts."
              : "Register to access source-grounded AI tutors with interactive citations."}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-gray-200 py-8 px-6 shadow-sm rounded-2xl sm:px-10">
          {errors.general && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{errors.general}</span>
              </div>
              {errors.general.toLowerCase().includes("already registered") && (
                <Link
                  href={isInstructor ? "/auth/login/instructor" : "/auth/login/student"}
                  className="font-bold underline text-[#6C63FF] hover:text-indigo-800 shrink-0 ml-1"
                >
                  Log In &rarr;
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder={isInstructor ? "Dr. Samantha Wright" : "Alex Johnson"}
                  className={`block w-full rounded-xl border bg-white pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.name
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-[#6C63FF] focus:ring-indigo-100"
                  }`}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                Institutional / Work Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder={isInstructor ? "s.wright@university.edu" : "alex@student.edu"}
                  className={`block w-full rounded-xl border bg-white pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.email
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-[#6C63FF] focus:ring-indigo-100"
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password & Confirm Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pass" className="block text-xs font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="pass"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="Min 8 chars"
                    className={`block w-full rounded-xl border bg-white pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                      errors.password
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-[#6C63FF] focus:ring-indigo-100"
                    }`}
                  />
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPass" className="block text-xs font-semibold text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirmPass"
                    name="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    placeholder="Re-enter password"
                    className={`block w-full rounded-xl border bg-white pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                      errors.confirmPassword
                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-[#6C63FF] focus:ring-indigo-100"
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Role-Specific Fields */}
            <div className="pt-2 border-t border-gray-100">
              {!isInstructor ? (
                /* Student Role: Dropdown of Enrolled Subjects (populated from GET /api/subjects) */
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="studentSubject" className="block text-xs font-semibold text-gray-700">
                      Enrolled Subject Curriculum
                    </label>
                    <span className="text-[11px] text-gray-500">From /api/subjects</span>
                  </div>

                  <div className="relative rounded-xl shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <select
                      id="studentSubject"
                      value={selectedStudentSubject}
                      onChange={(e) => {
                        setSelectedStudentSubject(e.target.value);
                        if (errors.subjects) setErrors((prev) => ({ ...prev, subjects: undefined }));
                      }}
                      className="block w-full rounded-xl border border-gray-200 bg-white pl-9 pr-8 py-2.5 text-sm text-gray-900 focus:border-[#6C63FF] focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                    >
                      {availableSubjects.map((sub) => (
                        <option key={sub.id} value={sub.name}>
                          [{sub.code}] {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    Your initial AI dialogue and assessment questions will ground in materials matching this subject.
                  </p>
                  {errors.subjects && <p className="mt-1 text-xs text-red-600">{errors.subjects}</p>}
                </div>
              ) : (
                /* Instructor Role: Multi-select of subjects taught */
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Subjects You Teach (Multi-Select)
                    </label>
                    <span className="text-[11px] text-purple-600 font-medium">
                      {selectedInstructorSubjects.length} selected
                    </span>
                  </div>

                  <div className="rounded-xl bg-purple-50/70 border border-purple-100 p-2.5 text-xs text-purple-900 flex items-start gap-2 mb-3">
                    <Info className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>
                      These subjects become the <strong>default assigned curriculum</strong> for students linked to your courses. You can reassign or update subjects anytime from your dashboard.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableSubjects.map((sub) => {
                      const isSelected = selectedInstructorSubjects.includes(sub.name);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => toggleInstructorSubject(sub.name)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all ${
                            isSelected
                              ? "border-purple-600 bg-purple-50 text-purple-950 font-medium shadow-xs"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex flex-col pr-2">
                            <span className="font-semibold">{sub.name}</span>
                            <span className="text-[10px] text-gray-500">{sub.code}</span>
                          </div>
                          <div
                            className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                              isSelected
                                ? "bg-purple-600 border-purple-600 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.subjects && <p className="mt-1.5 text-xs text-red-600">{errors.subjects}</p>}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3">
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
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Complete {isInstructor ? "Instructor" : "Student"} Registration</span>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 border-t border-gray-100 pt-5 text-center text-xs text-gray-600">
            <span>Already have an account? </span>
            <Link
              href={`/auth/login/${role}`}
              className="font-semibold text-[#6C63FF] hover:text-[#5850e0] underline underline-offset-2 transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
