"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  GraduationCap,
  History,
  Settings,
  Sparkles,
  X,
  Plus,
  Search,
  LogOut,
  User as UserIcon,
  Clock,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  ClipboardList,
  BookOpen,
  School,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/hooks/useSidebar";
import {
  ChatSession,
  getStoredChatSessions,
  deleteChatSession,
  HISTORY_UPDATE_EVENT,
  createNewChatSession,
} from "@/lib/chat-history";
import { GlobalSearch } from "@/components/GlobalSearch";
import { mergeStoredSubmissions } from "@/lib/assignments-client";
import { SettingsModal } from "@/components/SettingsModal";
import { AdaptFlowLogo } from "@/components/ui/AdaptFlowLogo";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isExpanded, toggleSidebar } = useSidebar();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyItems, setHistoryItems] = useState<ChatSession[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [pendingAssignmentsCount, setPendingAssignmentsCount] = useState<number>(2);

  const historyPanelRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Synchronize pending assignments count
  useEffect(() => {
    const fetchPendingAssignments = async () => {
      try {
        const studentId = user?.id || "student_demo_1";
        const res = await fetch(`/api/assignments?student_id=${studentId}`);
        if (res.ok) {
          const data = await res.json();
          const merged = mergeStoredSubmissions(data.assignments || [], studentId);
          const pending = merged.filter(
            (a: any) =>
              (a.studentStatus === "pending" || a.status === "pending") &&
              !a.submissions?.some((s: any) => s.studentId === studentId && s.status === "submitted")
          );
          setPendingAssignmentsCount(pending.length);
        }
      } catch {
        // Fall back to default
      }
    };

    fetchPendingAssignments();
    window.addEventListener("assignments_updated", fetchPendingAssignments);
    return () => {
      window.removeEventListener("assignments_updated", fetchPendingAssignments);
    };
  }, [user?.id]);

  // Synchronize history items from persistent storage & reactive events
  useEffect(() => {
    const syncSessions = () => {
      setHistoryItems(getStoredChatSessions());
    };
    syncSessions();

    window.addEventListener(HISTORY_UPDATE_EVENT, syncSessions);
    window.addEventListener("storage", syncSessions);
    return () => {
      window.removeEventListener(HISTORY_UPDATE_EVENT, syncSessions);
      window.removeEventListener("storage", syncSessions);
    };
  }, []);

  // Close history drawer when navigating to different route
  useEffect(() => {
    setIsHistoryOpen(false);
  }, [pathname]);

  // Handle global keyboard shortcut: Ctrl+K / Cmd+K opens Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Handle click outside history drawer & profile menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        historyPanelRef.current &&
        !historyPanelRef.current.contains(event.target as Node)
      ) {
        setIsHistoryOpen(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }

    if (isHistoryOpen || isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHistoryOpen, isProfileMenuOpen]);

  const [activePortal, setActivePortal] = useState<"student" | "instructor">("student");

  useEffect(() => {
    if (pathname.startsWith("/instructor")) {
      setActivePortal("instructor");
      if (typeof window !== "undefined") {
        localStorage.setItem("adaptflow_active_portal", "instructor");
      }
    } else if (pathname === "/dashboard" || pathname === "/assignments") {
      setActivePortal("student");
      if (typeof window !== "undefined") {
        localStorage.setItem("adaptflow_active_portal", "student");
      }
    } else {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("adaptflow_active_portal");
        if (stored === "instructor" || user?.role === "instructor") {
          setActivePortal("instructor");
        } else {
          setActivePortal("student");
        }
      }
    }
  }, [pathname, user?.role]);

  const isInstructorSection =
    pathname.startsWith("/instructor") ||
    user?.role === "instructor" ||
    activePortal === "instructor";

  const isDashboardActive = isInstructorSection
    ? pathname === "/instructor/dashboard"
    : (pathname === "/dashboard" || pathname.startsWith("/dashboard"));

  const isChatActive = isInstructorSection
    ? (pathname === "/instructor/chat" || pathname.startsWith("/instructor/chat"))
    : (pathname === "/chat" || pathname.startsWith("/chat"));

  const isQuizActive = isInstructorSection
    ? (pathname === "/instructor/quiz" || pathname.startsWith("/instructor/quiz"))
    : (pathname === "/quiz" || pathname.startsWith("/quiz"));

  const isAssignmentsActive = isInstructorSection
    ? (pathname === "/instructor/assignments" || pathname.startsWith("/instructor/assignments"))
    : (pathname === "/assignments" || pathname.startsWith("/assignments"));

  const filteredHistory = historyItems.filter((item) =>
    item.title.toLowerCase().includes(historySearch.toLowerCase())
  );

  const dateGroups: Array<"Today" | "Yesterday" | "Last 7 Days"> = [
    "Today",
    "Yesterday",
    "Last 7 Days",
  ];

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChatSession(id);
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSelectHistorySession = (session: ChatSession) => {
    setIsHistoryOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("adaptflow:select-session", { detail: { sessionId: session.id } })
      );
    }
    const targetChatPath = isInstructorSection ? "/instructor/chat" : "/chat";
    router.push(`${targetChatPath}?session=${session.id}`);
  };

  const displayName = user?.name || user?.full_name || "AF";
  const userInitials = displayName
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const effectiveRole = isInstructorSection ? "instructor" : (user?.role || "student");
  const effectiveName = isInstructorSection
    ? (user?.role === "instructor" && user?.name && user.name !== "Instructor" ? user.name : "Instructor")
    : (user?.name && user.name !== "Student" && user.name !== "Samarth" ? user.name : "Sam");

  const effectiveEmail = isInstructorSection
    ? (user?.role === "instructor" && user?.email ? user.email : "faculty@adaptflow.edu")
    : (user?.email ? user.email : "sam@student.adaptflow.ai");

  const effectiveInitials = isInstructorSection ? "IN" : "S";

  return (
    <>
      {/* ========================================================================= */}
      {/* PRIMARY SIDEBAR: COLLAPSED RAIL (56px / w-14) VS EXPANDED (240px / w-60)  */}
      {/* ========================================================================= */}
      <aside
        data-sidebar="true"
        className={cn(
          "fixed left-0 top-0 z-50 hidden md:flex h-screen flex-col justify-between border-r border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] backdrop-blur-md select-none transition-all duration-200 ease-in-out shadow-xs",
          isExpanded ? "w-60 p-3" : "w-14 py-3 px-2"
        )}
      >
        {/* Top: Header / Logo + Nav Items + History Section */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* Header Row */}
          {isExpanded ? (
            <div className="flex items-center justify-between px-1 pb-3 border-b border-slate-200 dark:border-white/[0.08]">
              <Link
                href={isInstructorSection ? "/instructor/dashboard" : "/dashboard"}
                className="flex items-center gap-2.5 group"
                aria-label="AdaptFlow Home"
              >
                <AdaptFlowLogo size={36} showText tagline="Multimodal AI Platform" />
              </Link>

              {/* Collapse Sidebar Toggle Button (PanelLeftClose) */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSidebar();
                }}
                className="group relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:border-white/[0.08] hover:shadow-xs z-10"
                aria-label="Hide sidebar"
                title="Hide sidebar"
              >
                <PanelLeftClose className="h-4.5 w-4.5" />
                {/* Floating Tooltip */}
                <span className="pointer-events-none absolute right-0 top-full mt-1.5 z-50 hidden group-hover:flex items-center gap-1.5 whitespace-nowrap rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] px-2 py-1 text-xs font-medium text-slate-900 dark:text-white shadow-md">
                  <span>Hide sidebar</span>
                  <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                    Ctrl+B
                  </kbd>
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 pb-2">
              {/* Expand Sidebar Toggle Button (PanelLeftOpen) */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSidebar();
                }}
                className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 shadow-xs hover:bg-slate-200 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white hover:border-[#6C63FF]/30 transition-all cursor-pointer z-10"
                aria-label="Show sidebar"
                title="Show sidebar"
              >
                <PanelLeftOpen className="h-4.5 w-4.5" />
                {/* Floating Tooltip */}
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1.5 whitespace-nowrap rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  <span>Show sidebar</span>
                  <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                    Ctrl+B
                  </kbd>
                </span>
              </button>

              {/* Home Icon */}
              <Link
                href={isInstructorSection ? "/instructor/dashboard" : "/dashboard"}
                className="group relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden shadow-xs hover:scale-105 transition-all"
                aria-label="AdaptFlow Home"
              >
                <AdaptFlowLogo size={36} showText={false} />
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  AdaptFlow Home
                </span>
              </Link>

              <div className="h-[1px] w-6 bg-slate-200 dark:bg-[#262642] my-0.5" />
            </div>
          )}

          {/* Navigation Items */}
          <nav className={cn("flex flex-col gap-1 mt-2", isExpanded ? "px-0" : "items-center")}>
            {/* 1. Dashboard */}
            <Link
              href={isInstructorSection ? "/instructor/dashboard" : "/dashboard"}
              className={cn(
                "group relative flex items-center transition-all duration-200 ease-out",
                isExpanded
                  ? "w-full gap-3 px-3 py-2 rounded-xl text-xs font-medium"
                  : "h-10 w-10 justify-center rounded-xl",
                isDashboardActive
                  ? isExpanded
                    ? "bg-[#6C63FF]/10 dark:bg-zinc-900 text-[#6C63FF] dark:text-[#8B85FF] border-l-[3px] border-[#6C63FF] pl-2.5 font-semibold shadow-xs"
                    : "bg-[#6C63FF]/10 dark:bg-zinc-900 text-[#6C63FF] dark:text-[#8B85FF] font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
              )}
              aria-label="Dashboard"
            >
              <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
              {isExpanded && <span>Dashboard</span>}
              {!isExpanded && isDashboardActive && (
                <span className="absolute left-0 h-5 w-1 rounded-r-full bg-[#6C63FF]" />
              )}
              {!isExpanded && (
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  Dashboard
                </span>
              )}
            </Link>

            {/* 2. Global Search Nav Item */}
            <button
              type="button"
              onClick={() => setIsGlobalSearchOpen(true)}
              className={cn(
                "group relative flex items-center transition-all duration-200 ease-out cursor-pointer",
                isExpanded
                  ? "w-full justify-between px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-zinc-900/60 hover:bg-slate-200/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] shadow-xs"
                  : "h-10 w-10 justify-center rounded-xl bg-slate-100 dark:bg-zinc-900/60 hover:bg-slate-200/80 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]"
              )}
              aria-label="AI Search"
            >
              <div className="flex items-center gap-3">
                <Search className="h-4.5 w-4.5 shrink-0" />
                {isExpanded && <span>AI Search</span>}
              </div>

              {isExpanded ? (
                <kbd className="rounded bg-white dark:bg-[#222240] px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] shadow-xs">
                  Ctrl+K
                </kbd>
              ) : (
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 flex items-center gap-1.5 whitespace-nowrap rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  <span>AI Search</span>
                  <kbd className="rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                    Ctrl+K
                  </kbd>
                </span>
              )}
            </button>

            {/* 3. Source Chat */}
            <Link
              href={isInstructorSection ? "/instructor/chat" : "/chat"}
              className={cn(
                "group relative flex items-center transition-all duration-200 ease-out",
                isExpanded
                  ? "w-full gap-3 px-3 py-2 rounded-xl text-xs font-medium"
                  : "h-10 w-10 justify-center rounded-xl",
                isChatActive
                  ? isExpanded
                    ? "bg-[#6C63FF]/10 dark:bg-zinc-900 text-[#6C63FF] dark:text-[#8B85FF] border-l-[3px] border-[#6C63FF] pl-2.5 font-semibold shadow-xs"
                    : "bg-[#6C63FF]/10 dark:bg-zinc-900 text-[#6C63FF] dark:text-[#8B85FF] font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
              )}
              aria-label="Source Chat"
            >
              <MessageSquare className="h-4.5 w-4.5 shrink-0" />
              {isExpanded && <span>Source Chat</span>}
              {!isExpanded && isChatActive && (
                <span className="absolute left-0 h-5 w-1 rounded-r-full bg-[#6C63FF]" />
              )}
              {!isExpanded && (
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  Source Chat
                </span>
              )}
            </Link>

            {/* 4. Adaptive Quiz */}
            <Link
              href={isInstructorSection ? "/instructor/quiz" : "/quiz"}
              className={cn(
                "group relative flex items-center transition-all duration-200 ease-out",
                isExpanded
                  ? "w-full gap-3 px-3 py-2 rounded-xl text-xs font-medium"
                  : "h-10 w-10 justify-center rounded-xl",
                isQuizActive
                  ? isExpanded
                    ? "bg-[#6C63FF]/10 dark:bg-zinc-900 text-[#6C63FF] dark:text-[#8B85FF] border-l-[3px] border-[#6C63FF] pl-2.5 font-semibold shadow-xs"
                    : "bg-[#6C63FF]/10 dark:bg-zinc-900 text-[#6C63FF] dark:text-[#8B85FF] font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
              )}
              aria-label="Adaptive Quiz"
            >
              <GraduationCap className="h-4.5 w-4.5 shrink-0" />
              {isExpanded && <span>Adaptive Quiz</span>}
              {!isExpanded && isQuizActive && (
                <span className="absolute left-0 h-5 w-1 rounded-r-full bg-[#6C63FF]" />
              )}
              {!isExpanded && (
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  Adaptive Quiz
                </span>
              )}
            </Link>

            {/* 5. Assignments Nav Item */}
            <Link
              href={isInstructorSection ? "/instructor/assignments" : "/assignments"}
              className={cn(
                "group relative flex items-center transition-all duration-200 ease-out",
                isExpanded
                  ? "w-full justify-between px-3 py-2 rounded-xl text-xs font-medium"
                  : "h-10 w-10 justify-center rounded-xl",
                isAssignmentsActive
                  ? isExpanded
                    ? "bg-[#6C63FF]/10 dark:bg-zinc-900 text-[#6C63FF] dark:text-[#8B85FF] border-l-[3px] border-[#6C63FF] pl-2.5 font-semibold shadow-xs"
                    : "bg-[#6C63FF]/10 dark:bg-zinc-900 text-[#6C63FF] dark:text-[#8B85FF] font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
              )}
              aria-label="Assignments"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="h-4.5 w-4.5 shrink-0" />
                {isExpanded && <span>Assignments</span>}
              </div>

              {isExpanded ? (
                pendingAssignmentsCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-300 shadow-2xs">
                    {pendingAssignmentsCount}
                  </span>
                )
              ) : (
                <>
                  {pendingAssignmentsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#121215]" />
                  )}
                  {isAssignmentsActive && (
                    <span className="absolute left-0 h-5 w-1 rounded-r-full bg-[#6C63FF]" />
                  )}
                  <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                    Assignments
                  </span>
                </>
              )}
            </Link>

            {/* 7. Dialogue History (in collapsed rail mode) */}
            {!isExpanded && (
              <button
                type="button"
                onClick={() => setIsHistoryOpen((prev) => !prev)}
                className={cn(
                  "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 cursor-pointer",
                  isHistoryOpen
                    ? "bg-[#6C63FF]/10 dark:bg-zinc-900 text-[#6C63FF] dark:text-[#8B85FF] shadow-xs font-semibold border border-slate-200 dark:border-white/[0.08]"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
                )}
                aria-label="Dialogue History"
                title="Dialogue History"
              >
                <History className="h-4.5 w-4.5 shrink-0" />
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  Dialogue History
                </span>
              </button>
            )}
          </nav>

          {/* Expanded State: Grouped History Section directly below nav items */}
          {isExpanded && (
            <div className="flex-1 flex flex-col min-h-0 mt-4 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Dialogue History
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newSession = createNewChatSession();
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(
                        new CustomEvent("adaptflow:select-session", { detail: { sessionId: newSession.id } })
                      );
                    }
                    const targetChatPath = isInstructorSection ? "/instructor/chat" : "/chat";
                    router.push(`${targetChatPath}?session=${newSession.id}`);
                  }}
                  className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-[#6C63FF] dark:text-[#8B85FF] hover:bg-purple-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Create new dialogue"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New</span>
                </button>
              </div>

              {/* History Search Bar (Preserved inside history section) */}
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search past conversations..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-zinc-900 focus:border-[#6C63FF] focus:outline-none transition-all"
                />
              </div>

              {/* Grouped History Sessions List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-700">
                {dateGroups.map((group) => {
                  const itemsInGroup = filteredHistory.filter(
                    (item) => item.dateGroup === group
                  );
                  if (itemsInGroup.length === 0) return null;

                  return (
                    <div key={group} className="space-y-1">
                      <div className="px-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {group}
                      </div>
                      {itemsInGroup.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => handleSelectHistorySession(session)}
                          className="group relative flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white hover:shadow-xs cursor-pointer transition-all"
                        >
                          <div className="flex flex-col min-w-0 pr-1">
                            <span className="font-medium truncate group-hover:text-[#6C63FF] dark:group-hover:text-[#8B85FF] transition-colors">
                              {session.title}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {session.timestamp} · {session.sourcePreview}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteHistoryItem(session.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity"
                            title="Delete dialogue"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}

                {filteredHistory.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No conversations found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section: Settings & User Profile */}
        <div className="pt-2 border-t border-slate-200 dark:border-white/[0.08] relative" ref={profileMenuRef}>
          {isExpanded ? (
            <div className="flex items-center justify-between px-1">
              {/* User Avatar + Name */}
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 text-left rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors min-w-0 flex-1 cursor-pointer"
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs",
                    isInstructorSection
                      ? "bg-gradient-to-tr from-purple-600 to-indigo-600 ring-2 ring-purple-500/30"
                      : "bg-gradient-to-tr from-[#6C63FF] to-blue-500"
                  )}
                >
                  {effectiveInitials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {effectiveName}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    {effectiveEmail}
                  </span>
                </div>
              </button>

              {/* Settings Gear Button */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {/* Settings Gear Button */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
                aria-label="Settings"
                title="Settings"
              >
                <Settings className="h-4.5 w-4.5" />
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  Settings
                </span>
              </button>

              {/* User Avatar Button */}
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className={cn(
                  "group relative flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shadow-xs transition-all cursor-pointer",
                  isInstructorSection
                    ? "bg-gradient-to-tr from-purple-600 to-indigo-600 ring-2 ring-purple-500/30"
                    : "bg-gradient-to-tr from-[#6C63FF] to-blue-500 hover:ring-2 hover:ring-[#6C63FF]/30"
                )}
                aria-label="User Profile"
              >
                <span>{effectiveInitials}</span>
                <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/[0.08] px-2.5 py-1 text-xs font-medium text-slate-900 dark:text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  {effectiveName} ({isInstructorSection ? "Instructor" : "Student"})
                </span>
              </button>
            </div>
          )}

          {/* Profile Menu Popover */}
          {isProfileMenuOpen && (
            <div
              className={cn(
                "absolute bottom-full mb-2 z-50 w-64 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] p-3 shadow-xl animate-in fade-in zoom-in-95 duration-150",
                isExpanded ? "left-0" : "left-14"
              )}
            >
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-white/[0.08] px-1">
                <div
                  className={cn(
                    "h-9 w-9 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs",
                    isInstructorSection
                      ? "bg-gradient-to-tr from-purple-600 to-indigo-600 ring-2 ring-purple-500/30"
                      : "bg-gradient-to-tr from-[#6C63FF] to-blue-500"
                  )}
                >
                  {effectiveInitials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {effectiveName}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {effectiveEmail}
                  </span>
                  <span
                    className={cn(
                      "inline-block mt-0.5 w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                      isInstructorSection
                        ? "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 font-bold"
                        : "bg-[#6C63FF]/15 text-[#6C63FF] dark:text-[#8B85FF] border border-[#6C63FF]/30"
                    )}
                  >
                    {isInstructorSection ? "Faculty / Instructor" : "Student"}
                  </span>
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                {/* Switcher button between Student and Faculty portal */}
                {isInstructorSection ? (
                  <Link
                    href="/dashboard"
                    onClick={() => {
                      setActivePortal("student");
                      if (typeof window !== "undefined") {
                        localStorage.setItem("adaptflow_active_portal", "student");
                      }
                      setIsProfileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Switch to Student View</span>
                  </Link>
                ) : (
                  <Link
                    href="/instructor/dashboard"
                    onClick={() => {
                      setActivePortal("instructor");
                      if (typeof window !== "undefined") {
                        localStorage.setItem("adaptflow_active_portal", "instructor");
                      }
                      setIsProfileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 font-semibold transition-colors"
                  >
                    <GraduationCap className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Switch to Faculty / Instructor View</span>
                  </Link>
                )}

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Settings className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Workspace Preferences</span>
                </button>
                <Link
                  href="/auth"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <UserIcon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Switch Account / Sign Out</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-200 dark:border-white/[0.08]">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* SLIDING HISTORY DRAWER (WHEN IN COLLAPSED RAIL MODE)                      */}
      {/* ========================================================================= */}
      {!isExpanded && isHistoryOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/60 backdrop-blur-[1px] transition-opacity"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

      {!isExpanded && (
        <div
          ref={historyPanelRef}
          data-sidebar="true"
          className={cn(
            "fixed top-0 z-40 h-screen w-80 border-r border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121215] shadow-xl transition-all duration-300 ease-in-out flex flex-col",
            isHistoryOpen
              ? "left-14 translate-x-0 opacity-100 visible pointer-events-auto"
              : "left-14 -translate-x-[calc(100%+4rem)] opacity-0 invisible pointer-events-none"
          )}
        >
          {/* History Drawer Header */}
          <div className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-white/[0.08] px-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[#6C63FF]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dialogue History</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsHistoryOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Close History"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* New Chat Button & Search Bar */}
          <div className="p-3 space-y-2 border-b border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                const newSession = createNewChatSession();
                setIsHistoryOpen(false);
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("adaptflow:select-session", { detail: { sessionId: newSession.id } })
                  );
                }
                const targetChatPath = isInstructorSection ? "/instructor/chat" : "/chat";
                router.push(`${targetChatPath}?session=${newSession.id}`);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-[1.02] active:scale-[0.98] text-white py-2 px-3 text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New AI Dialogue</span>
            </button>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search past conversations..."
                className="w-full rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-zinc-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-zinc-900 focus:border-[#6C63FF] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Grouped History List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-slate-300 dark:hover:scrollbar-thumb-slate-700">
            {dateGroups.map((group) => {
              const itemsInGroup = filteredHistory.filter((item) => item.dateGroup === group);
              if (itemsInGroup.length === 0) return null;

              return (
                <div key={group} className="space-y-1">
                  <div className="px-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {group}
                  </div>
                  {itemsInGroup.map((session) => (
                    <div
                      key={session.id}
                      onClick={() => handleSelectHistorySession(session)}
                      className="group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-medium truncate text-slate-900 dark:text-white group-hover:text-[#6C63FF] dark:group-hover:text-[#8B85FF] transition-colors">
                          {session.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                          <Clock className="h-3 w-3" />
                          <span>{session.timestamp}</span>
                          <span>·</span>
                          <span className="text-slate-500 dark:text-slate-400 truncate">{session.sourcePreview}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistoryItem(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity"
                        title="Delete session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}

            {filteredHistory.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No matching conversation records found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (JUDGES PHONE VIEWPORT)                      */}
      {/* ========================================================================= */}
      <nav
        aria-label="Mobile Navigation"
        data-sidebar="true"
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden h-16 items-center justify-around border-t border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#121215]/95 px-2 backdrop-blur-lg pb-[env(safe-area-inset-bottom,0px)] shadow-lg transition-colors"
      >
        {/* Mobile Nav: Dashboard */}
        <Link
          href={isInstructorSection ? "/instructor/dashboard" : "/dashboard"}
          className={cn(
            "relative flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 py-1 rounded-xl text-[10px] font-semibold transition-all duration-200 ease-out",
            isDashboardActive
              ? "text-[#6C63FF] dark:text-[#8B85FF]"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
          aria-label="Dashboard"
        >
          {isDashboardActive && (
            <span className="absolute top-0 h-1 w-6 rounded-full bg-[#6C63FF]" />
          )}
          <LayoutDashboard className="h-5 w-5" />
          <span className="mt-0.5">Dashboard</span>
        </Link>

        {/* Mobile Nav: AI Search */}
        <button
          type="button"
          onClick={() => setIsGlobalSearchOpen(true)}
          className="relative flex flex-col items-center justify-center min-h-[48px] min-w-[44px] px-1 py-1 rounded-xl text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200 ease-out cursor-pointer"
          aria-label="AI Search"
        >
          <Search className="h-5 w-5" />
          <span className="mt-0.5">AI Search</span>
        </button>

        {/* Mobile Nav: Chat / AI Tutor (Center Tab with 24x24 AdaptFlow Logo) */}
        <Link
          href={isInstructorSection ? "/instructor/chat" : "/chat"}
          className={cn(
            "relative flex flex-col items-center justify-center min-h-[48px] min-w-[44px] px-1 py-1 rounded-xl text-[10px] font-semibold transition-all duration-200 ease-out",
            isChatActive
              ? "text-[#6C63FF] dark:text-[#8B85FF]"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
          aria-label="Source Chat"
        >
          {isChatActive && (
            <span className="absolute top-0 h-1 w-6 rounded-full bg-[#6C63FF]" />
          )}
          <AdaptFlowLogo size={24} showText={false} />
          <span className="mt-0.5">Tutor</span>
        </Link>

        {/* Mobile Nav: Quiz */}
        <Link
          href={isInstructorSection ? "/instructor/quiz" : "/quiz"}
          className={cn(
            "relative flex flex-col items-center justify-center min-h-[48px] min-w-[44px] px-1 py-1 rounded-xl text-[10px] font-semibold transition-all duration-200 ease-out",
            isQuizActive
              ? "text-[#6C63FF] dark:text-[#8B85FF]"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
          aria-label="Adaptive Quiz"
        >
          {isQuizActive && (
            <span className="absolute top-0 h-1 w-6 rounded-full bg-[#6C63FF]" />
          )}
          <GraduationCap className="h-5 w-5" />
          <span className="mt-0.5">Quiz</span>
        </Link>

        {/* Mobile Nav: Assignments */}
        <Link
          href={isInstructorSection ? "/instructor/assignments" : "/assignments"}
          className={cn(
            "relative flex flex-col items-center justify-center min-h-[48px] min-w-[48px] px-2 py-1 rounded-xl text-[10px] font-semibold transition-all duration-200 ease-out",
            isAssignmentsActive
              ? "text-[#6C63FF] dark:text-[#8B85FF]"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
          aria-label="Assignments"
        >
          {isAssignmentsActive && (
            <span className="absolute top-0 h-1 w-6 rounded-full bg-[#6C63FF]" />
          )}
          <div className="relative">
            <ClipboardList className="h-5 w-5" />
            {pendingAssignmentsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-[#121215]" />
            )}
          </div>
          <span className="mt-0.5">Tasks</span>
        </Link>
      </nav>

      {/* ========================================================================= */}
      {/* GLOBAL SEARCH COMMAND PALETTE MODAL                                       */}
      {/* ========================================================================= */}
      <GlobalSearch
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* ========================================================================= */}
      {/* SETTINGS & PREFERENCES MODAL                                               */}
      {/* ========================================================================= */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
